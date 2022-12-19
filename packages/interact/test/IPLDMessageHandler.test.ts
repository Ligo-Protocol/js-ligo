import { IDIDComm, DIDCommMessageHandler, DIDComm } from "@veramo/did-comm";
import {
  createAgent,
  IDIDManager,
  IEventListener,
  IIdentifier,
  IKeyManager,
  IMessageHandler,
  IResolver,
  TAgent,
} from "@veramo/core";
import { DIDManager, MemoryDIDStore } from "@veramo/did-manager";
import {
  KeyManager,
  MemoryKeyStore,
  MemoryPrivateKeyStore,
} from "@veramo/key-manager";
import { KeyManagementSystem } from "@veramo/kms-local";
import { DIDResolverPlugin } from "@veramo/did-resolver";
import { Resolver } from "did-resolver";
import { MessageHandler } from "@veramo/message-handler";
import { FakeDidProvider, FakeDidResolver } from "./fake-did";
import {
  Entities,
  IDataStore,
  migrations,
  DataStore,
  DataStoreORM,
} from "@veramo/data-store";
import { DataSource } from "typeorm";
import { v4 } from "uuid";
import { jest } from "@jest/globals";
import { IPLDMessageHandler } from "../src";
import * as dagjson from "@ipld/dag-json";
import * as Block from "multiformats/block";
import { sha256 as hasher } from "multiformats/hashes/sha2";
import { base32 } from "multiformats/bases/base32";

const IPLDEventSniffer: IEventListener = {
  eventTypes: ["IPLDMessage-received"],
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onEvent: jest.fn(),
};

const databaseFile = `./tmp/local-database2-${Math.random().toPrecision(
  5
)}.sqlite`;

describe("IPLDMessageHandler", () => {
  let sender: IIdentifier;
  let recipient: IIdentifier;
  let agent: TAgent<
    IResolver &
      IKeyManager &
      IDIDManager &
      IDIDComm &
      IMessageHandler &
      IDataStore
  >;
  let dbConnection: DataSource;

  beforeAll(async () => {
    dbConnection = new DataSource({
      name: "test",
      type: "sqlite",
      database: databaseFile,
      synchronize: false,
      migrations: migrations,
      migrationsRun: true,
      logging: false,
      entities: Entities,
    });
    agent = createAgent({
      plugins: [
        new KeyManager({
          store: new MemoryKeyStore(),
          kms: {
            local: new KeyManagementSystem(new MemoryPrivateKeyStore()),
          },
        }),
        new DIDManager({
          providers: {
            "did:fake": new FakeDidProvider(),
            // 'did:web': new WebDIDProvider({ defaultKms: 'local' })
          },
          store: new MemoryDIDStore(),
          defaultProvider: "did:fake",
        }),
        new DIDComm(),
        new DIDResolverPlugin({
          resolver: new Resolver({
            ...new FakeDidResolver(() => agent).getDidFakeResolver(),
          }),
        }),
        new MessageHandler({
          messageHandlers: [
            new DIDCommMessageHandler(),
            new IPLDMessageHandler(),
          ],
        }),
        new DataStore(dbConnection),
        new DataStoreORM(dbConnection),
        IPLDEventSniffer,
      ],
    });

    sender = await agent.didManagerImport({
      did: "did:fake:z6MkgbqNU4uF9NKSz5BqJQ4XKVHuQZYcUZP8pXGsJC8nTHwo",
      keys: [
        {
          type: "Ed25519",
          kid: "didcomm-senderKey-1",
          publicKeyHex:
            "1fe9b397c196ab33549041b29cf93be29b9f2bdd27322f05844112fad97ff92a",
          privateKeyHex:
            "b57103882f7c66512dc96777cbafbeb2d48eca1e7a867f5a17a84e9a6740f7dc1fe9b397c196ab33549041b29cf93be29b9f2bdd27322f05844112fad97ff92a",
          kms: "local",
        },
      ],
      services: [],
      provider: "did:fake",
      alias: "sender",
    });

    recipient = await agent.didManagerImport({
      did: "did:fake:z6MkrPhffVLBZpxH7xvKNyD4sRVZeZsNTWJkLdHdgWbfgNu3",
      keys: [
        {
          type: "Ed25519",
          kid: "didcomm-receiverKey-1",
          publicKeyHex:
            "b162e405b6485eff8a57932429b192ec4de13c06813e9028a7cdadf0e2703636",
          privateKeyHex:
            "19ed9b6949cfd0f9a57e30f0927839a985fa699491886ebcdda6a954d869732ab162e405b6485eff8a57932429b192ec4de13c06813e9028a7cdadf0e2703636",
          kms: "local",
        },
      ],
      services: [],
      provider: "did:fake",
      alias: "receiver",
    });
    // console.log("sender: ", sender)
    // console.log("recipient: ", recipient)
  });

  const expectMessageReceived = async () => {
    expect(IPLDEventSniffer.onEvent).toHaveBeenCalled();
  };

  const getRegularMessage = async () => {
    const attachment = {
      some: "attachment",
    };
    const block = await Block.encode({
      value: attachment,
      codec: dagjson,
      hasher,
    });

    return {
      id: v4(),
      type: "fake",
      to: recipient.did,
      from: sender.did,
      body: { someLink: { "/": block.cid.toString() } },
      attachments: [
        {
          data: {
            hash: base32.encode(block.cid.multihash.bytes),
            json: block.value,
          },
        },
        { id: "not-a-cid", data: { json: { some: "attachment" } } },
      ],
    };
  };

  it("should handle packed (with authcrypt) message directly", async () => {
    const anyMessage = await getRegularMessage();
    const packedMessage = await agent.packDIDCommMessage({
      message: anyMessage,
      packing: "authcrypt",
    });
    await agent.handleMessage({ raw: packedMessage.message });
    expectMessageReceived();
  }, 30000);
});
