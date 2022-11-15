import { AgreementEncrypter } from "@js-ligo/agreements";
import { DagJWS } from "dids";
import { randomBytes } from "@stablelib/random";
import { Waku, Encoder, Decoder } from "@waku/interfaces";
import {
  EncoderV0,
  DecoderV0,
  MessageV0,
} from "@waku/core/lib/waku_message/version_0";
import { CarBufferWriter } from "@ipld/car";
import { CarReader } from "@ipld/car/reader";
import { base64, base64url } from "multiformats/bases/base64";
import { IDIDComm, IUnpackedDIDCommMessage } from "@veramo/did-comm";
import { IResolver, TAgent, IDIDManager, IIdentifier } from "@veramo/core";
import { CID } from "multiformats";
import { sha256 } from "multiformats/hashes/sha2";
import * as Block from "multiformats/block";
import * as dagJose from "dag-jose";
import * as json from "multiformats/codecs/json";
import { JWE } from "did-jwt";
import { v4 as uuidv4 } from "uuid";

enum MessageType {
  ResponseToOffer = "https://ligo.dev/didcomm/ResponseToOffer",
}

type ResponseToOffer = {
  offer: string;
  agreementKey: string;
};

type Attachment = {
  id: string;
  description: string;
  data: {
    base64: string;
  };
};

export class LigoInteractions {
  #waku: Waku;
  #veramoAgent: TAgent<IResolver & IDIDComm & IDIDManager>;

  constructor(
    waku: Waku,
    veramoAgent: TAgent<IResolver & IDIDComm & IDIDManager>
  ) {
    this.#waku = waku;
    this.#veramoAgent = veramoAgent;
  }

  /**
   * Respond to an offer
   *
   * Sends a ResponseToOffer message to seller
   */
  async respondToOffer(
    offerId: string,
    offerSellerDid: string,
    signedAgreement: DagJWS
  ) {
    // Get Idenfier
    const identifiers = await this.#veramoAgent.didManagerFind();
    if (identifiers.length === 0) {
      throw new Error("No identifiers found");
    }
    const identifier = identifiers[0];

    const symmetricKey = randomBytes(32);
    const agreementEncrypter = new AgreementEncrypter(symmetricKey);
    const encryptedAgreement = await agreementEncrypter.encryptAgreement(
      signedAgreement
    );

    // Create CAR
    const block = await Block.encode({
      value: encryptedAgreement,
      codec: dagJose,
      hasher: sha256,
    });
    const buffer = new ArrayBuffer(block.bytes.length * 2);
    const writer = CarBufferWriter.createWriter(buffer, {
      roots: [block.cid],
    });
    writer.write(block);
    const bytes = writer.close({ resize: true });

    // Create message
    const msg: ResponseToOffer = {
      offer: offerId,
      agreementKey: base64.encode(symmetricKey),
    };
    const attachment: Attachment = {
      id: block.cid.toString(),
      description: "A LigoAgreement",
      data: {
        base64: base64url.encode(bytes),
      },
    };
    const didCommMsg = {
      id: uuidv4(),
      type: MessageType.ResponseToOffer,
      from: identifier.did,
      to: offerSellerDid,
      created_time: (new Date().getTime() / 1000).toString(),
      body: msg,
      attachments: [attachment],
    };

    // Pack message
    const packed = await this.#veramoAgent.packDIDCommMessage({
      message: didCommMsg,
      packing: "authcrypt",
    });

    // Send message
    const wakuEncoder = new EncoderV0(
      LigoInteractions.generateContentTopic(offerId)
    );
    const wakuMessage = {
      payload: json.encode(JSON.parse(packed.message)),
    };
    await this.#waku.relay?.send(wakuEncoder, new MessageV0(wakuMessage));
  }

  /**
   * Get offer responses
   *
   * Gets offer response from Waku store
   */
  async getSignedOfferResponses(
    offerIds: string[]
  ): Promise<Record<string, DagJWS[]>> {
    const identifiers = await this.#veramoAgent.didManagerFind();
    if (identifiers.length === 0) {
      throw new Error("No identifiers found");
    }
    const identifier = identifiers[0];

    return (
      await Promise.all(
        offerIds.map(async (offerId) => {
          const offerResponses = await this._getSignedOfferResponses(
            identifier,
            offerId
          );
          return { [offerId]: offerResponses };
        })
      )
    ).reduce((prev, cur) => {
      return { ...prev, ...cur };
    });
  }

  private async _getSignedOfferResponses(
    identifier: IIdentifier,
    offerId: string
  ) {
    // Fetch from Waku store
    const wakuDecoder = new DecoderV0(
      LigoInteractions.generateContentTopic(offerId)
    );
    const messages: IUnpackedDIDCommMessage[] = [];
    await this.#waku.store?.queryCallbackOnPromise(
      [wakuDecoder],
      async (msgP) => {
        const msg = await msgP;
        if (msg?.payload) {
          const payload = json.decode(msg.payload);
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          const recipients = (payload as any).recipients;
          if (!recipients) return;

          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          const myRecipients = recipients.filter((r: any) => {
            return r.header.kid.split("#")[0] === identifier.did;
          });
          if (myRecipients.length > 0) {
            const unpackedMsg = await this.#veramoAgent.unpackDIDCommMessage({
              message: JSON.stringify(payload),
            });
            messages.push(unpackedMsg);
          }
        }
      }
    );

    const offerResponses = messages.filter(
      (unpackedMsg) => unpackedMsg.message.type === MessageType.ResponseToOffer
    );

    const agreements = await Promise.all(
      offerResponses.map(async (msg) => {
        const body = msg.message.body as ResponseToOffer;
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const attachment = (msg.message as any).attachments[0] as Attachment;
        const reader = await CarReader.fromBytes(
          base64url.decode(attachment.data.base64)
        );

        const cid = CID.parse(attachment.id);
        const block = await reader.get(cid);
        const decodedBlock = block
          ? await Block.create({
              bytes: block.bytes,
              cid,
              codec: dagJose,
              hasher: sha256,
            })
          : undefined;

        const encryptedAgreement = decodedBlock?.value as JWE;
        const symmetricKey = base64.decode(body.agreementKey);
        const agreementEncrypter = new AgreementEncrypter(symmetricKey);

        const signedAgreement = await agreementEncrypter.decryptAgreement(
          encryptedAgreement as JWE
        );
        return signedAgreement;
      })
    );
    return agreements;
  }

  private static generateContentTopic(offerId: string): string {
    return `/ligo/1/offers-${offerId}/proto`;
  }
}
