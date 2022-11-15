import { DIDSession } from "did-session";
import {
  EthereumAuthProvider,
  CapabilityOpts,
} from "@ceramicnetwork/blockchain-utils-linking";
import { LigoAgreement } from "@js-ligo/vocab";
import { AgreementSigner } from "@js-ligo/agreements";
import { DagJWS } from "dids";
import { AccountId } from "caip";
import LitJsSdk from "@lit-protocol/sdk-browser";
import { LigoInteractions } from "@js-ligo/interact";
import { SiwxMessage } from "ceramic-cacao";
import { DIDResolverPlugin } from "@veramo/did-resolver";
import { DIDComm, IDIDComm } from "@veramo/did-comm";
import { Resolver } from "did-resolver";
import { getResolver as keyDidResolver } from "key-did-resolver";
import { getResolver as ethrDidResolver } from "ethr-did-resolver";
import { Waku } from "@waku/interfaces";
import {
  createAgent,
  IResolver,
  IKeyManager,
  IDIDManager,
  TAgent,
} from "@veramo/core";
import { DIDManager } from "@veramo/did-manager";
import { KeyDIDProvider } from "@veramo/did-provider-key";
import { KeyManager } from "@veramo/key-manager";
import { KeyManagementSystem, SecretBox } from "@veramo/kms-local";
import { Web3KeyManagementSystem } from "@veramo/kms-web3";
import { createPrivacyNode } from "@waku/create";
import { EthrDIDProvider } from "@veramo/did-provider-ethr";
import { ExternalProvider, Web3Provider } from "@ethersproject/providers";
import { DataSource } from "typeorm";
import {
  Entities,
  KeyStore,
  DIDStore,
  PrivateKeyStore,
  migrations,
} from "@veramo/data-store";

function defaultVeramoAgent(provider: ExternalProvider, kmsSecretKey: string) {
  const dbConnection = new DataSource({
    type: "sqlite",
    database: "./test/database.sqlite",
    synchronize: false,
    migrations,
    migrationsRun: true,
    logging: ["error", "info", "warn"],
    entities: Entities,
  }).initialize();

  return createAgent<IResolver & IDIDComm & IDIDManager & IKeyManager>({
    plugins: [
      new KeyManager({
        store: new KeyStore(dbConnection),
        kms: {
          local: new KeyManagementSystem(
            new PrivateKeyStore(dbConnection, new SecretBox(kmsSecretKey))
          ),
          web3: new Web3KeyManagementSystem({
            default: new Web3Provider(provider),
          }),
        },
      }),
      new DIDResolverPlugin({
        resolver: new Resolver({
          ...ethrDidResolver({
            name: "goerli",
            provider: new Web3Provider(provider),
          }),
          ...keyDidResolver(),
        }),
      }),
      new DIDComm([]),
      new DIDManager({
        store: new DIDStore(dbConnection),
        defaultProvider: "did:ethr:goerli",
        providers: {
          "did:ethr:goerli": new EthrDIDProvider({
            defaultKms: "local",
            networks: [
              { name: "goerli", provider: new Web3Provider(provider) },
            ],
          }),
          "did:key": new KeyDIDProvider({
            defaultKms: "local",
          }),
        },
      }),
    ],
  });
}

export type OfferResponse = {
  signedAgreement: DagJWS;
  verifiedAgreement: LigoAgreement;
};

export class LigoClient {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  #litClient: any;
  #litLib: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  #ethProvider: ExternalProvider;
  #account: AccountId;
  #session?: DIDSession;
  #agreementSigner?: AgreementSigner;
  #interactions?: LigoInteractions;

  constructor(
    ethProvider: ExternalProvider,
    account: AccountId,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    litLibOverride?: any
  ) {
    this.#ethProvider = ethProvider;
    // this.#ceramic = this.#orbis.ceramic as CeramicClient;
    this.#litLib = litLibOverride ?? LitJsSdk;
    this.#litClient = new this.#litLib.LitNodeClient({
      alertWhenUnauthorized: false,
    });
    this.#account = account;
  }

  async connect(
    opts: CapabilityOpts,
    kmsSecretKey: string,
    waku?: Waku,
    veramoAgent?: TAgent<IResolver & IDIDComm & IDIDManager>
  ) {
    // Setup interactions
    const agent =
      veramoAgent ?? defaultVeramoAgent(this.#ethProvider, kmsSecretKey);
    this.#interactions = new LigoInteractions(
      waku ?? (await createPrivacyNode()),
      agent
    );

    await this._importSigningKey(agent);

    // Setup DID session
    const authProvider = new EthereumAuthProvider(
      this.#ethProvider,
      this.#account.address
    );

    const sessionStr = localStorage.getItem("ceramic-session");
    if (sessionStr) {
      this.#session = await DIDSession.fromSession(sessionStr);
    }

    if (
      !this.#session ||
      (this.#session.hasSession && this.#session.isExpired)
    ) {
      this.#session = await DIDSession.authorize(authProvider, {
        resources: ["ceramic://*"],
        ...opts,
      });
      localStorage.setItem("ceramic-session", this.#session.serialize());
    }

    this.#agreementSigner = new AgreementSigner(this.#session.did);

    // Setup did:ethr
    await this._createOrImportEncryptionKeys(agent);

    // Connect to Lit Client
    // await this.#litClient.connect();
    // const msg = SiwxMessage.fromCacao(this.#session.cacao).toMessage(
    //   "Ethereum"
    // );
    // const authSig = {
    //   sig: this.#session.cacao.s?.s,
    //   derivedVia: "web3.eth.personal.sign",
    //   signedMessage: msg,
    //   address: this.#account.address,
    // };
    // localStorage.setItem("lit-auth-signature", JSON.stringify(authSig));
  }

  /**
   * Sign an agreement
   */
  async signAgreement(agreement: LigoAgreement): Promise<DagJWS> {
    if (!this.#agreementSigner) {
      throw new Error("LigoClient is not connected");
    }

    return await this.#agreementSigner.signRawAgreement(agreement);
  }

  /**
   * Respond to an offer by sending a signed agreement
   */
  async respondToOffer(
    offerId: string,
    offerSellerDid: string,
    signedAgreement: DagJWS
  ): Promise<void> {
    if (!this.#interactions) {
      throw new Error("LigoClient is not connected");
    }

    await this.#interactions.respondToOffer(
      offerId,
      offerSellerDid,
      signedAgreement
    );
  }

  async getOfferResponses(): Promise<OfferResponse[]> {
    if (!this.#interactions || !this.#agreementSigner) {
      throw new Error("LigoClient is not connected");
    }

    const signedAgreements = await this.#interactions.getSignedOfferResponses();

    return await Promise.all(
      signedAgreements.map(async (signedAgreement) => {
        const payload = await this.#agreementSigner!.verifyAgreement(
          signedAgreement
        );
        return {
          signedAgreement: signedAgreement,
          verifiedAgreement: payload,
        };
      })
    );
  }

  private async _importSigningKey(
    agent: TAgent<IResolver & IDIDComm & IDIDManager>
  ) {
    // Import default signing key
    const did = `did:ethr:goerli:${this.#account.address}`;
    try {
      await agent.didManagerGet({ did });
    } catch (e) {
      const controllerKeyId = `default-${this.#account.address}`;
      await agent.didManagerImport({
        did,
        provider: "did:ethr:goerli",
        keys: [
          {
            kid: controllerKeyId,
            type: "Secp256k1",
            kms: "web3",
            publicKeyHex: "",
            privateKeyHex: "",
            meta: {
              provider: "did:ethr:goerli",
              account: this.#account.address.toLocaleLowerCase(),
              algorithms: ["eth_signMessage", "eth_signTypedData"],
            },
          },
        ],
        controllerKeyId,
      });
    }
  }

  private async _createOrImportEncryptionKeys(
    agent: TAgent<IResolver & IDIDComm & IDIDManager>
  ) {
    const identifier = await agent.didManagerGet({
      did: `did:ethr:goerli:${this.#account.address}`,
    });
    if (identifier.keys.filter((k) => k.type === "X25519").length == 0) {
      // Create encryption key
      const key = await agent.keyManagerCreate({
        kms: "local",
        type: "X25519",
      });

      // Triggers a did:ethr registry update transaction
      await agent.didManagerAddKey({
        did: `did:ethr:goerli:${this.#account.address}`,
        key,
      });
    }
  }
}
