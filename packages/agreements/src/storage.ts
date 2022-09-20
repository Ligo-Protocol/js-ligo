import { JWE } from "did-jwt";
import { Web3Storage } from "web3.storage";
import { CarReader } from "@ipld/car";
import type { IPFS } from "ipfs-core-types";
import { CID } from "multiformats/cid";

export interface AgreementStorageProvider {
  storeAgreement(encryptedAgreement: JWE): Promise<CID>;
  fetchAgreement(cid: CID): Promise<JWE>;
}

export class Web3StorageAgreementStorageProvider
  implements AgreementStorageProvider
{
  #client: Web3Storage;
  #ipfs: IPFS;

  constructor(client: Web3Storage, ipfs: IPFS) {
    this.#client = client;
    this.#ipfs = ipfs;
  }

  async storeAgreement(encryptedAgreement: JWE): Promise<CID> {
    const cid = await this.#ipfs.dag.put(encryptedAgreement, {
      storeCodec: "dag-jose",
      hashAlg: "sha2-256",
    });

    const car = this.#ipfs.dag.export(cid);
    const reader = await CarReader.fromIterable(car);
    await this.#client.putCar(reader);

    return cid;
  }

  async fetchAgreement(cid: CID): Promise<JWE> {
    const retrieved = await this.#ipfs.dag.get(cid);
    return retrieved.value as JWE;
  }
}
