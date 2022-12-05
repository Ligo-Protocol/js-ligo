import { AgreementEncrypter } from "@js-ligo/agreements";
import { randomBytes } from "@stablelib/random";
import { Waku } from "@waku/interfaces";
import {
  EncoderV0,
  DecoderV0,
  MessageV0,
} from "@waku/core/lib/waku_message/version_0";
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
import { LigoAgreement } from "@js-ligo/vocab";

enum MessageType {
  ProposeAgreement = "https://ligo.dev/didcomm/ProposeAgreement",
}

type ProposeAgreement = {
  offer: string;
  agreementCid: string;
  agreementKey: string;
};

type CidAttachment = {
  id: string;
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
   * Sends a ProposeAgreement message to seller
   */
  async proposeAgreement(
    offerId: string,
    offerSellerDid: string,
    agreement: LigoAgreement
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
      agreement
    );

    // Create CAR
    const block = await Block.encode({
      value: encryptedAgreement,
      codec: dagJose,
      hasher: sha256,
    });

    // Create message
    const msg: ProposeAgreement = {
      offer: offerId,
      agreementCid: block.cid.toString(),
      agreementKey: base64.encode(symmetricKey),
    };
    const attachment: CidAttachment = {
      id: block.cid.toString(),
      data: {
        base64: base64url.encode(block.bytes),
      },
    };
    const didCommMsg = {
      id: uuidv4(),
      type: MessageType.ProposeAgreement,
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
  async getProposedAgreements(
    offerIds: string[]
  ): Promise<Record<string, LigoAgreement[]>> {
    const identifiers = await this.#veramoAgent.didManagerFind();
    if (identifiers.length === 0) {
      throw new Error("No identifiers found");
    }
    const identifier = identifiers[0];

    return (
      await Promise.all(
        offerIds.map(async (offerId) => {
          const offerResponses = await this._getProposedAgreements(
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

  private async _getProposedAgreements(
    identifier: IIdentifier,
    offerId: string
  ): Promise<LigoAgreement[]> {
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
      (unpackedMsg) => unpackedMsg.message.type === MessageType.ProposeAgreement
    );

    const agreements = await Promise.all(
      offerResponses.map(async (msg) => {
        const body = msg.message.body as ProposeAgreement;
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const attachment = (msg.message as any).attachments.filter(
          (a: any) => a.id === body.agreementCid
        )[0] as CidAttachment;
        /* eslint-enable @typescript-eslint/no-explicit-any */

        const bytes = base64url.decode(attachment.data.base64);

        const cid = CID.parse(body.agreementCid);
        const decodedBlock = await Block.create({
          bytes: bytes,
          cid,
          codec: dagJose,
          hasher: sha256,
        });

        const encryptedAgreement = decodedBlock?.value as JWE;
        const symmetricKey = base64.decode(body.agreementKey);
        const agreementEncrypter = new AgreementEncrypter(symmetricKey);

        const agreement = await agreementEncrypter.decryptAgreement(
          encryptedAgreement as JWE
        );
        return agreement;
      })
    );
    return agreements;
  }

  private static generateContentTopic(offerId: string): string {
    return `/ligo/1/offers-${offerId}/proto`;
  }
}
