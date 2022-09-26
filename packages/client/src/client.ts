import { Orbis } from "@orbisclub/orbis-sdk";
import { DIDSession } from "did-session";
import { EthereumAuthProvider } from "@ceramicnetwork/blockchain-utils-linking";
import { LigoAgreement } from "@js-ligo/vocab";
import {
  AgreementSigner,
  // AgreementEncrypter,
  // AgreementStorageProvider,
} from "@js-ligo/agreements";
import { DagJWS, DID } from "dids";

const ORBIS_CONTEXT = "Ligo";

export class LigoClient {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  #ethProvider: any;
  #orbis: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  #session?: DIDSession;
  #agreementSigner?: AgreementSigner;
  // #agreementStorageProvider: AgreementStorageProvider;

  constructor(
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    ethProvider: any
    // agreementStorageProvider: AgreementStorageProvider
  ) {
    this.#ethProvider = ethProvider;
    this.#orbis = new Orbis();
    // this.#agreementStorageProvider = agreementStorageProvider;
  }

  async connect() {
    const isConnected = await this.#orbis.isConnected();

    if (!isConnected) {
      const addresses = await this.#ethProvider.enable();
      const authProvider = new EthereumAuthProvider(
        this.#ethProvider,
        addresses[0]
      );

      this.#session = await DIDSession.authorize(authProvider, {
        resources: ["ceramic://*"],
      });

      try {
        const sessionString = this.#session.serialize();
        localStorage.setItem("ceramic-session", sessionString);
      } catch (e) {
        console.log("Error creating sessionString: " + e);
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
  async sendAgreement(recipient: DID) {
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
  async loadOrCreateConversation(recipient: DID): Promise<string> {
    try {
      const existingConversationId = this._loadConversation(recipient);
      return existingConversationId;
    } catch {
      const newConversationId = this._createConversation(recipient);
      return newConversationId;
    }
  }

  private async _createConversation(recipient: DID): Promise<string> {
    const res = await this.#orbis.createConversation({
      recipients: [recipient.id],
      context: ORBIS_CONTEXT,
    });

    if (res.status === 200) {
      return res.doc as string;
    } else {
      throw new Error("Error creating conversation: ", res);
    }
  }

  private async _loadConversation(recipient: DID): Promise<string> {
    if (!this.#session) {
      throw new Error("LigoClient is not connected");
    }

    const { data, error } = await this.#orbis.getConversations({
      did: this.#session.did.id,
      context: ORBIS_CONTEXT,
    });

    if (!error) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const conversations = data as Array<any>;
      const recipientConversation = conversations.find(
        (c) => c.recipients.length === 1 && c.recipients[0] === recipient.id
      );
      return recipientConversation.stream_id as string;
    } else {
      throw new Error("Error loading conversations: ", error);
    }
  }
}
