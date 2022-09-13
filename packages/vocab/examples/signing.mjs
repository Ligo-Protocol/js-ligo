import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import KeyResolver from "key-did-resolver";
import { randomBytes } from "@stablelib/random";
import { base64ToBytes } from "did-jwt";
import * as u8a from "uint8arrays";

const agreement = {
  "@context": "https://schema.org",
  order: {
    "@id": "ipfs://fake",
  },
};

async function createDID() {
  const seed = randomBytes(32);
  const provider = new Ed25519Provider(seed);
  const did = new DID({ provider, resolver: KeyResolver.getResolver() });
  await did.authenticate();

  return did;
}
async function run() {
  const didA = await createDID();
  const didB = await createDID();

  // Sign the JWS with didA
  const jwsA = await didA.createJWS(agreement);

  // JWS would be sent to other party...

  // Sign JWS with didB
  const jwsB = await didB.createJWS(jwsA.payload);

  // Form final JWS signed by both parties
  const jws = { ...jwsA, signatures: [...jwsA.signatures, ...jwsB.signatures] };
  console.log(jws);

  // Verify each signature
  const retrievedJWSA = {
    ...jws,
    signatures: jws.signatures.filter(
      (v) =>
        JSON.parse(u8a.toString(base64ToBytes(v.protected)))["kid"].split(
          "#"
        )[0] === didA.id
    ),
  };
  const verifiedJWSA = await didA.verifyJWS(retrievedJWSA);
  console.log(verifiedJWSA);

  const retrievedJWSB = {
    ...jws,
    signatures: jws.signatures.filter(
      (v) =>
        JSON.parse(u8a.toString(base64ToBytes(v.protected)))["kid"].split(
          "#"
        )[0] === didB.id
    ),
  };
  const verifiedJWSB = await didB.verifyJWS(retrievedJWSB);
  console.log(verifiedJWSB);
}

run();
