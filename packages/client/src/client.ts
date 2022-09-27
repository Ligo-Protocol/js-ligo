import { Orbis } from "@orbisclub/orbis-sdk";
import { DIDSession } from "did-session";
import {
  EthereumAuthProvider,
  CapabilityOpts,
} from "@ceramicnetwork/blockchain-utils-linking";
import { LigoAgreement } from "@js-ligo/vocab";
import {
  AgreementSigner,
  // AgreementEncrypter,
  // AgreementStorageProvider,
} from "@js-ligo/agreements";
import { DagJWS } from "dids";
import { AccountId } from "caip";

const ORBIS_CONTEXT = "Ligo";

export class LigoClient {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  #ethProvider: any;
  #orbis: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  #account: AccountId;
  #session?: DIDSession;
  #agreementSigner?: AgreementSigner;
  // #agreementStorageProvider: AgreementStorageProvider;

  constructor(
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    ethProvider: any,
    account: AccountId
    // agreementStorageProvider: AgreementStorageProvider
  ) {
    this.#ethProvider = ethProvider;
    this.#orbis = new Orbis();
    this.#account = account;
    // this.#agreementStorageProvider = agreementStorageProvider;
  }

  async connect(opts: CapabilityOpts) {
    const isConnected = await this.#orbis.isConnected();

    if (!isConnected) {
      const authProvider = new EthereumAuthProvider(
        this.#ethProvider,
        this.#account.address
      );

      this.#session = await DIDSession.authorize(authProvider, {
        resources: ["ceramic://*"],
        ...opts,
      });

      try {
        const sessionString = this.#session.serialize();
        localStorage.setItem("ceramic-session", sessionString);
      } catch (e) {
        console.log("Error creating sessionString: " + e);
      }

      const res = await this.#orbis.connectLit(
        this.#ethProvider,
        this.#account.address.toLowerCase()
      );
      if (res.status !== 200) {
        throw res.error;
      }

      await this.#orbis.isConnected();

      this.#agreementSigner = new AgreementSigner(this.#session.did);
    }
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
  async sendAgreement(recipient: AccountId) {
    // Load conversation
    const conversationId = await this.loadOrCreateConversation(recipient);

    // Send first part
    const firstMsg = await this.#orbis.sendMessage({
      conversation_id: conversationId,
      body: `I would like to form a Ligo agreement with you:`,
    });

    console.log(firstMsg);
    // this.#agreementStorageProvider.storeAgreement()
  }

  /**
   * Loads an existing or creates a new conversation with a recipient
   */
  async loadOrCreateConversation(recipient: AccountId): Promise<string> {
    try {
      const existingConversationId = await this._loadConversation(recipient);
      if (existingConversationId) {
        return existingConversationId;
      } else {
        const newConversationId = await this._createConversation(recipient);
        return newConversationId;
      }
    } catch {
      const newConversationId = await this._createConversation(recipient);
      return newConversationId;
    }
  }

  private async _createConversation(recipient: AccountId): Promise<string> {
    const res = await this.#orbis.createConversation({
      recipients: [`did:pkh:${recipient.toString()}`],
      context: ORBIS_CONTEXT,
    });

    if (res.status === 200) {
      return res.doc as string;
    } else {
      throw new Error("Error creating conversation: ", res);
    }
  }

  private async _loadConversation(
    recipient: AccountId
  ): Promise<string | null> {
    if (!this.#session) {
      throw new Error("LigoClient is not connected");
    }

    const { data, error } = await this.#orbis.getConversations({
      did: this.#session.did.id,
      context: ORBIS_CONTEXT,
    });

    if (!error && data.length > 0) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const conversations = data as Array<any>;
      const recipientConversation = conversations.find(
        (c) =>
          c.recipients.length === 1 &&
          c.recipients[0] === `did:pkh:${recipient.toString()}`
      );
      if (!recipientConversation) return null;
      return recipientConversation.stream_id as string;
    } else {
      throw new Error("Error loading conversations: ", error);
    }
  }
}
