import { Orbis } from "@orbisclub/orbis-sdk";
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
import { CeramicClient } from "@ceramicnetwork/http-client";
import LitJsSdk from "lit-js-sdk";
import { CID } from "multiformats/cid";

const ORBIS_CONTEXT = "Ligo";

export class LigoClient {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  #ethProvider: any;
  #orbis: any;
  #litClient: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  #account: AccountId;
  #session?: DIDSession;
  #ceramic: CeramicClient;
  #agreementSigner?: AgreementSigner;
  #agreementStorageProvider: AgreementStorageProvider;

  constructor(
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    ethProvider: any,
    account: AccountId,
    agreementStorageProvider: AgreementStorageProvider
  ) {
    this.#ethProvider = ethProvider;
    this.#orbis = new Orbis();
    this.#ceramic = this.#orbis.ceramic as CeramicClient;
    this.#litClient = new LitJsSdk.LitNodeClient();
    this.#account = account;
    this.#agreementStorageProvider = agreementStorageProvider;
  }

  async connect(opts: CapabilityOpts) {
    const isConnected = await this.#orbis.isConnected();

    if (isConnected.status !== 200) {
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

      const res = await this.#orbis.connectLit({
        provider: this.#ethProvider,
        address: this.#account.address.toLowerCase(),
      });

      if (res.status !== 200) {
        throw new Error(res.result);
      }

      await this.#orbis.isConnected();

      this.#agreementSigner = new AgreementSigner(this.#session.did);
    }

    // Connect to Lit Client
    await this.#litClient.connect();
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
    // Load conversation
    const conversationId = await this.loadOrCreateConversation(recipient);

    // Send first part
    const firstMsg = await this.#orbis.sendMessage({
      conversation_id: conversationId,
      body: `I would like to form a Ligo agreement with you:`,
    });

    if (firstMsg.status !== 200) {
      throw new Error("Failed to send first message");
    }

    // Fetch encrypted key info from first message
    const firstMsgStream = await this.#ceramic.loadStream(firstMsg.doc);
    const authSig = this._getAuthSig();
    const symmetricKey = await this.#litClient.getEncryptionKey({
      accessControlConditions: JSON.parse(
        firstMsgStream.content.encryptedMessage.accessControlConditions
      ),
      toDecrypt: firstMsgStream.content.encryptedMessage.encryptedSymmetricKey,
      chain: this.#account.chainId.reference,
      authSig,
    });

    const agreementEncrypter = new AgreementEncrypter(symmetricKey);
    const encryptedAgreement = await agreementEncrypter.encryptAgreement(
      signedAgreement,
      firstMsgStream.content.encryptedMessage.encryptedSymmetricKey
    );
    const cid = await this.#agreementStorageProvider.storeAgreement(
      encryptedAgreement
    );

    // Send second message with CID
    const secondMsg = await this.#orbis.sendMessage({
      conversation_id: conversationId,
      body: cid.toString(),
    });

    if (secondMsg.status !== 200) {
      throw new Error("Failed to send second message");
    }

    return cid;
  }

  async getOfferResponses() {
    const conversations = await this._loadLigoConversations();
    console.log(
      await Promise.all(
        conversations.map(async (c) => {
          const { data, error } = await this.#orbis.getMessages(c.stream_id);
          if (!error) {
            return await Promise.all(
              /* eslint-disable @typescript-eslint/no-explicit-any */
              data.map(async (v: any) => {
                console.log(v.content);
                return await this.#orbis.decryptMessage(v.content);
              })
            );
          } else {
            throw new Error("Error loading messages: ", error);
          }
        })
      )
    );
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

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private async _loadLigoConversations(): Promise<any[]> {
    if (!this.#session) {
      throw new Error("LigoClient is not connected");
    }

    console.log(`did:pkh:${this.#account.toString()}`);
    const { data, error } = await this.#orbis.getConversations({
      did: `did:pkh:${this.#account.toString()}`,
    });

    if (!error) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      return data as Array<any>;
    } else {
      throw new Error("Error loading conversations: ", error);
    }
  }

  private async _loadConversation(
    recipient: AccountId
  ): Promise<string | null> {
    const conversations = await this._loadLigoConversations();
    const recipientConversation = conversations.find(
      (c) =>
        c.recipients.length === 1 &&
        c.recipients[0] === `did:pkh:${recipient.toString()}`
    );
    if (!recipientConversation) return null;
    return recipientConversation.stream_id as string;
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
}
