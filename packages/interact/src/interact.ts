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
import { base64, base64url } from "multiformats/bases/base64";
import { getResolver as keyDidResolver } from "key-did-resolver";
import { DIDResolverPlugin } from "@veramo/did-resolver";
import { DIDComm, IDIDComm, IUnpackedDIDCommMessage } from "@veramo/did-comm";
import { Resolver } from "did-resolver";
import { createAgent, IResolver, TAgent } from "@veramo/core";
import { sha256 } from "multiformats/hashes/sha2";
import * as Block from "multiformats/block";
import * as dagJose from "dag-jose";
import * as json from "multiformats/codecs/json";
export const CONTENT_TOPIC = "/ligo/1/offerresponse/proto";

enum MessageType {
  ResponseToOffer = "https://ligo.dev/didcomm/ResponseToOffer",
}

interface ResponseToOffer {
  offer: string;
  agreementKey: string;
}

export class LigoInteractions {
  #waku: Waku;
  #wakuEncoder: Encoder;
  #wakuDecoder: Decoder<MessageV0>;
  #veramoAgent: TAgent<IResolver & IDIDComm> = createAgent<
    IResolver & IDIDComm
  >({
    plugins: [
      new DIDResolverPlugin({
        resolver: new Resolver({
          ...keyDidResolver(),
        }),
      }),
      new DIDComm([]),
    ],
  });

  constructor(waku: Waku) {
    this.#waku = waku;
    this.#wakuEncoder = new EncoderV0(CONTENT_TOPIC);
    this.#wakuDecoder = new DecoderV0(CONTENT_TOPIC);
  }

  /**
   * Respond to an offer
   *
   * Sends a ResponseToOffer message to seller
   */
  async respondToOffer(signedAgreement: DagJWS) {
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
      offer: block.cid.toString(),
      agreementKey: base64.encode(symmetricKey),
    };
    const attachment = {
      id: block.cid.toString(),
      description: "A LigoAgreement",
      data: {
        base64: base64url.encode(bytes),
      },
    };
    const didCommMsg = {
      id: "1234567890",
      type: MessageType.ResponseToOffer,
      from: "did:example:alice",
      to: "did:example:bob",
      created_time: (new Date().getTime() / 1000).toString(),
      body: msg,
      attachments: [attachment],
    };

    // Pack message
    const packed = await this.#veramoAgent.packDIDCommMessage({
      message: didCommMsg,
      packing: "none",
    });

    // Send message
    const wakuMessage = {
      payload: json.encode(JSON.parse(packed.message)),
    };
    await this.#waku.relay?.send(this.#wakuEncoder, new MessageV0(wakuMessage));
  }

  /**
   * Get offer responses
   *
   * Gets offer response from Waku store
   */
  async getOfferResponses() {
    // Fetch from Waku store
    const messages: IUnpackedDIDCommMessage[] = [];
    await this.#waku.store?.queryCallbackOnPromise(
      [this.#wakuDecoder],
      async (msgP) => {
        const msg = await msgP;
        if (msg?.payload) {
          const payload = json.decode(msg.payload);
          const unpackedMsg = await this.#veramoAgent.unpackDIDCommMessage({
            message: JSON.stringify(payload),
          });
          messages.push(unpackedMsg);
        }
      }
    );

    console.log(messages);
  }
}
