import {
  xc20pDirEncrypter,
  xc20pDirDecrypter,
  createJWE,
  base64ToBytes,
  decryptJWE,
} from "did-jwt";
import { prepareCleartext, decodeCleartext } from "dag-jose-utils";
import { randomBytes } from "@stablelib/random";
import { create as createIpfs } from "ipfs";
import { convert as toLegacyIpld } from "blockcodec-to-ipld-format";
import * as dagJose from "dag-jose";
import * as u8a from "uint8arrays";

const agreement = {
  "@context": "https://schema.org",
  order: {
    "@id": "ipfs://fake",
  },
};

async function run() {
  // Encrypt agreement with a sample key. See https://ligo-book.codyhatfield.me/Reference/Utilities/Encryption%20and%20Decryption for full example using Lit
  const key = randomBytes(32);

  // 1. Create IPFS
  const dagJoseIpldFormat = toLegacyIpld(dagJose);
  const ipfs = await createIpfs({ ipld: { formats: [dagJoseIpldFormat] } });

  console.log(`Encrypting...`);
  // 2. Prepare cleartext
  const dirEncrypter = xc20pDirEncrypter(key);
  const cleartext = await prepareCleartext(agreement);

  // 3. Encrypt + add encrypted key to protected header
  const jwe = await createJWE(cleartext, [dirEncrypter], {
    encryptedSymmetricKey: u8a.toString(key, "base64pad"), // Just store unencrypted key to show that header works. Should actually be an encrypted Lit key
  });

  // 4. Put encrypted object in IPFS
  const cid = await ipfs.dag.put(jwe, {
    format: dagJoseIpldFormat.codec,
    hashAlg: "sha2-256",
  });

  console.log(`Created CID: ${cid}`);

  console.log("Retrieving and decrypting...");
  const retrieved = await ipfs.dag.get(cid);

  // 1. Retrieve key from header
  const protHeader = JSON.parse(
    u8a.toString(base64ToBytes(retrieved.value.protected))
  );

  // 2. Decrypt data
  const dirDecrypter = xc20pDirDecrypter(
    base64ToBytes(protHeader.encryptedSymmetricKey)
  );
  const decryptedData = await decryptJWE(retrieved.value, dirDecrypter);
  const decryptedAgreement = decodeCleartext(decryptedData);
  console.log(decryptedAgreement);

  process.exit(0);
}

run();
