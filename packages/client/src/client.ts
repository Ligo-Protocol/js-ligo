import { Orbis } from "@orbisclub/orbis-sdk";
import { DIDSession } from "did-session";
import { EthereumAuthProvider } from "@ceramicnetwork/blockchain-utils-linking";
import { LigoAgreement } from "@js-ligo/vocab";
import { AgreementSigner } from "@js-ligo/agreements";
import { DagJWS } from "dids";

export class LigoClient {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  #ethProvider: any;
  #orbis: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */

  #session?: DIDSession;
  #agreementSigner?: AgreementSigner;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  constructor(ethProvider: any) {
    this.#ethProvider = ethProvider;
    this.#orbis = new Orbis();
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

  async signAgreement(agreement: LigoAgreement): Promise<DagJWS> {
    if (!this.#agreementSigner) {
      throw new Error("LigoClient is not connected");
    }

    return await this.#agreementSigner.signRawAgreement(agreement);
  }
}
