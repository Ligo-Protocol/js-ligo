import { AbstractMessageHandler, Message } from "@veramo/message-handler";
import { IAgentContext, IDIDManager, IKeyManager } from "@veramo/core";
import { IDIDComm } from "@veramo/did-comm";
import Debug from "debug";
import * as json from "multiformats/codecs/json";
import * as dagjson from "@ipld/dag-json";
import * as dagcbor from "@ipld/dag-cbor";
import { CarWriter } from "@ipld/car";
import * as Block from "multiformats/block";
import { sha256 as hasher } from "multiformats/hashes/sha2";
import { base32 } from "multiformats/bases/base32";
import { decode as decodeDigest } from "multiformats/hashes/digest";
import { CID } from "multiformats/cid";

const debug = Debug("js-ligo:did-comm:base-ipld-message-handler");

type IContext = IAgentContext<IDIDManager & IKeyManager & IDIDComm>;

/**
 * Message handler that decodes a message as IPLD DAG-JSON and bundles attachments into a CAR.
 */
export class IPLDMessageHandler extends AbstractMessageHandler {
  constructor() {
    super();
  }

  public async handle(message: Message, context: IContext): Promise<Message> {
    if (message.data) {
      try {
        // Encode as JSON
        const jsonMsg = json.encode(message.data);

        // Decode as DAG-JSON
        const dagJsonMsg = dagjson.decode(jsonMsg);
        const block = await Block.encode({
          value: dagJsonMsg,
          codec: dagcbor,
          hasher,
        });

        // Build CAR
        const { writer, out } = CarWriter.create([block.cid]);

        // Put message in CAR
        writer.put(block);

        // Put attachments in CAR
        const attachmentsToAdd: string[] = [];
        for (const attachment of message.attachments ?? []) {
          // Check if data is content addressed
          if (!attachment.data.hash) {
            continue;
          }
          const multiHash = decodeDigest(base32.decode(attachment.data.hash));
          const attachmentCid = CID.createV1(dagjson.code, multiHash);
          const attachmentBlock = await Block.encode({
            value: dagjson.decode(json.encode(attachment.data.json)),
            codec: dagjson,
            hasher,
          });
          if (attachmentBlock.cid.toString() !== attachmentCid.toString()) {
            debug(
              `CID for attachment does not match. Not adding to CAR: ${attachmentCid.toString()}`
            );
            continue;
          }

          writer.put(attachmentBlock);

          attachmentsToAdd.push(attachment.data.hash);
        }

        const remainingAttachments = message.attachments?.filter(
          (attachment) => {
            return (
              !attachment.data.hash ||
              !attachmentsToAdd.includes(attachment.data.hash)
            );
          }
        );

        writer.close();

        let raw = new Uint8Array();
        for await (const b of out) {
          const mergedArray = new Uint8Array(raw.length + b.length);
          mergedArray.set(raw);
          mergedArray.set(b, raw.length);
          raw = mergedArray;
        }

        // Keep attachments that are not in CAR
        message.attachments = remainingAttachments;

        // Set data as decoded Node
        message.data = dagJsonMsg;

        // Set raw to CAR
        message.raw = base32.baseEncode(raw);

        context.agent.emit("IPLDMessage-received", message);

        let superHandled;
        try {
          superHandled = await super.handle(message, context);
        } catch (e) {
          debug(`Could not handle IPLD message in downstream handlers: ${e}`);
        }

        // if downstream message handlers failed, still treat original unpacked DIDCommV2Message as good
        return superHandled || message;
      } catch (e) {
        debug(`Could not handle message as IPLD: ${e}`);
      }
    }

    return super.handle(message, context);
  }
}
