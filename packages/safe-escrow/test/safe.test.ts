import { ethers } from "ethers";
import { LigoSafeEscrow } from "../src";
import { BigNumber } from "ethers";

interface Config {
  RPC_URL: string;
  DEPLOYER_ADDRESS_PRIVATE_KEY: string;
  SECOND_SIGNER_PRIVATE_KEY: string;
  DEPLOY_SAFE: {
    OWNERS: string[];
    THRESHOLD: number;
    SALT_NONCE: string;
  };
}

const config: Config = {
  RPC_URL: "https://goerli.infura.io/v3/9834efc01c904696a10cb3c37c72727c",
  DEPLOYER_ADDRESS_PRIVATE_KEY:
    "e33c0ef98f3b445248268e27819075d7398f50b6dbc756c9900087c1825ffbc0",
  SECOND_SIGNER_PRIVATE_KEY:
    "d48a46935960baf1f76c0ef3b62090dbec067596682612e72b60fe31736bd6a6",
  DEPLOY_SAFE: {
    OWNERS: [
      "0x851f1A838de1763e52e95Ad4485B579B0cfF34C1",
      "0x9f4532185122fA4975639dCb700Ad5E43e95Bb53",
    ],
    THRESHOLD: 2, // <SAFE_THRESHOLD>
    SALT_NONCE: "11111",
  },
};

describe("LigoSafeEscrow", () => {
  const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL);
  const signer1 = new ethers.Wallet(
    config.DEPLOYER_ADDRESS_PRIVATE_KEY,
    provider
  );
  const signer2 = new ethers.Wallet(config.SECOND_SIGNER_PRIVATE_KEY, provider);

  describe("Deploy and deposit", () => {
    test.only("predict, deploy and deposit on address", async () => {
      const ligosafe = new LigoSafeEscrow();
      const safeAddress = await ligosafe.deploySafe(
        signer1,
        config.DEPLOY_SAFE.OWNERS[0],
        config.DEPLOY_SAFE.OWNERS[1],
        "12212"
      );

      console.log("MARK>>>>>>>>>>>>>>>>>>>>>>");
      console.log(safeAddress);
      const deposit = await ligosafe.depositNative(
        signer1,
        safeAddress,
        BigNumber.from("10000")
      );
      console.log("DEPOSIT", deposit);
    }, 300000);
  });

  describe("Propose, confirm and execute", () => {
    test.only("create and propose transaction, confirm and execute.", async () => {
      //Renter Side connect and propose
      const ligosafe = new LigoSafeEscrow();
      const result = await ligosafe.connectPostDeploy(
        signer1,
        "0xA877F3EF39c88BBEBA4448a9E9Ff7DF9f32364fd",
        "https://safe-transaction-goerli.safe.global/"
      );

      //Host Side connect
      const ligosafe2 = new LigoSafeEscrow();
      const resultH1 = await ligosafe.connectPostDeploy(
        signer2,
        "0xA877F3EF39c88BBEBA4448a9E9Ff7DF9f32364fd",
        "https://safe-transaction-goerli.safe.global/"
      );

      const result2 = await ligosafe.createAndProposeTransaction(
        signer1, //Renter
        result.safe,
        result.service,
        signer2.address, // Host address
        "1" // Amount to transfer
      );

      //Renter confirmation
      const result3 = await ligosafe.confirmTransaction(
        signer1,
        result.safe,
        result.service,
        result2.safeTxHash
      );
      console.log(result3.responseSignature);

      //Host confirmation
      const resultH2 = await ligosafe2.confirmTransaction(
        signer2,
        resultH1.safe,
        resultH1.service,
        result2.safeTxHash
      );

      //Host executes transaction
      const receipt = await ligosafe2.executeTransaction(
        resultH1.service,
        resultH1.safe,
        resultH2.safeTxHash
      );
      console.log(receipt);
    }, 300000);
  });
});
