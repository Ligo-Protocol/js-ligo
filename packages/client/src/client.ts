import { Client as XMTPClient, Conversation } from "@xmtp/xmtp-js";
import { DIDSession } from "did-session";
import {
  EthereumAuthProvider,
  CapabilityOpts,
} from "@ceramicnetwork/blockchain-utils-linking";
import { LigoAgreement } from "@js-ligo/vocab";
import {
  AgreementSigner,
  AgreementEncrypter,
  AgreementStorageProvider,
} from "@js-ligo/agreements";
import { DagJWS } from "dids";
import { AccountId } from "caip";
import LitJsSdk from "@lit-protocol/sdk-browser";
import { CID } from "multiformats/cid";
import { Signer } from "ethers";
import { SiwxMessage } from "ceramic-cacao";

const MSG_PREFIX = "I would like to form a Ligo agreement with you:";

export type OfferResponse = {
  from: AccountId;
  agreementCid: string;
};

export class LigoClient {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  #ethProvider: any;
  #ethSigner: Signer;
  #litClient: any;
  #litLib: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  #account: AccountId;
  #session?: DIDSession;
  #agreementSigner?: AgreementSigner;
  #agreementStorageProvider: AgreementStorageProvider;
  #xmtp?: XMTPClient;

  constructor(
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    ethProvider: any,
    ethSigner: Signer,
    account: AccountId,
    agreementStorageProvider: AgreementStorageProvider,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    litLibOverride?: any
  ) {
    this.#ethSigner = ethSigner;
    this.#ethProvider = ethProvider;
    // this.#ceramic = this.#orbis.ceramic as CeramicClient;
    this.#litLib = litLibOverride ?? LitJsSdk;
    this.#litClient = new this.#litLib.LitNodeClient({
      alertWhenUnauthorized: false,
    });
    this.#account = account;
    this.#agreementStorageProvider = agreementStorageProvider;
  }

  async connect(opts: CapabilityOpts) {
    this.#xmtp = await XMTPClient.create(this.#ethSigner);

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

    // Connect to Lit Client
    await this.#litClient.connect();
    const msg = SiwxMessage.fromCacao(this.#session.cacao).toMessage(
      "Ethereum"
    );
    const authSig = {
      sig: this.#session.cacao.s?.s,
      derivedVia: "web3.eth.personal.sign",
      signedMessage: msg,
      address: this.#account.address,
    };
    localStorage.setItem("lit-auth-signature", JSON.stringify(authSig));
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
   * Send a signed agreement to seller to sign
   *
   * Encrypts, stores, and sends offer via Orbis
   */
  async sendAgreement(
    signedAgreement: DagJWS,
    recipient: AccountId
  ): Promise<CID> {
    const { symmetricKey } = await LitJsSdk.encryptString("");
    const authSig = this._getAuthSig();

    const encryptedSymmetricKey = await this.#litClient.saveEncryptionKey({
      accessControlConditions: this._generateAccessControlConditions(recipient),
      symmetricKey,
      authSig,
      chain: this.#account.chainId.reference,
    });

    const agreementEncrypter = new AgreementEncrypter(symmetricKey);
    const encryptedAgreement = await agreementEncrypter.encryptAgreement(
      signedAgreement,
      encryptedSymmetricKey
    );
    const cid = await this.#agreementStorageProvider.storeAgreement(
      encryptedAgreement
    );

    // Load conversation
    const conversation = await this.loadOrCreateConversation(recipient);

    // Send message
    const msg = await conversation.send(`${MSG_PREFIX}\n${cid.toString()}`);
    if (msg.error) {
      throw new Error("Failed to send first message: ", msg.error);
    }

    return cid;
  }

  async getOfferResponses(): Promise<OfferResponse[]> {
    const conversations = await this._loadLigoConversations();
    return await Promise.all(
      conversations.map(async (c) => {
        const messages = await c.messages();
        const offerResponseMsgs = messages.filter((m) =>
          (m.content as string).startsWith(MSG_PREFIX)
        );
        return {
          from: new AccountId({
            address: offerResponseMsgs[0].senderAddress!,
            chainId: `eip155:1`,
          }),
          agreementCid: offerResponseMsgs[0].content.split("\n")[1] as string,
        };
      })
    );
  }

  /**
   * Loads an existing or creates a new conversation with a recipient
   */
  async loadOrCreateConversation(recipient: AccountId): Promise<Conversation> {
    try {
      const existingConversation = await this._loadConversation(recipient);
      if (existingConversation) {
        return existingConversation;
      } else {
        const newConversation = await this._createConversation(recipient);
        return newConversation;
      }
    } catch {
      const newConversation = await this._createConversation(recipient);
      return newConversation;
    }
  }

  private async _createConversation(
    recipient: AccountId
  ): Promise<Conversation> {
    if (!this.#xmtp) {
      throw new Error("LigoClient is not connected");
    }

    const conversation = await this.#xmtp.conversations.newConversation(
      recipient.address
    );

    return conversation;
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private async _loadLigoConversations(): Promise<Conversation[]> {
    if (!this.#xmtp) {
      throw new Error("LigoClient is not connected");
    }

    const allConversations = await this.#xmtp.conversations.list();
    return allConversations;
  }

  private async _loadConversation(
    recipient: AccountId
  ): Promise<Conversation | null> {
    const conversations = await this._loadLigoConversations();
    const recipientConversation = conversations.find(
      (c) => c.peerAddress.toLowerCase() === recipient.address.toLowerCase()
    );
    if (!recipientConversation) return null;
    return recipientConversation;
  }

  private _getAuthSig() {
    const authSig = JSON.parse(
      localStorage.getItem("lit-auth-signature") ?? ""
    );
    if (authSig && authSig !== "") {
      return authSig;
    } else {
      console.log("User not authenticated to Lit Protocol for messages");
      throw new Error("User not authenticated to Lit Protocol for messages");
    }
  }

  private _generateAccessControlConditions(recipient: AccountId) {
    return [
      {
        contractAddress: "",
        standardContractType: "",
        chain: "ethereum",
        method: "",
        parameters: [":userAddress"],
        returnValueTest: {
          comparator: "=",
          value: recipient.address,
        },
      },
      { operator: "or" },
      {
        contractAddress: "",
        standardContractType: "",
        chain: "ethereum",
        method: "",
        parameters: [":userAddress"],
        returnValueTest: {
          comparator: "=",
          value: this.#account.address,
        },
      },
    ];
  }
}
