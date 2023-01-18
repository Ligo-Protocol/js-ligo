import EthersAdapter from "@gnosis.pm/safe-ethers-lib";
import { ethers, BigNumber, BytesLike } from "ethers";
import {
  SafeFactory,
  SafeAccountConfig,
  SafeDeploymentConfig,
} from "@gnosis.pm/safe-core-sdk";
import { JsonRpcProvider } from "@ethersproject/providers";
import { AccountId } from "caip";
import { SafeTransactionDataPartial } from "@safe-global/safe-core-sdk-types";

export class LigoSafeEscrow {
  #provider: JsonRpcProvider;
  #account: AccountId;
  #ethAdapter?: EthersAdapter;
  #safeFactory?: SafeFactory;

  constructor(provider: JsonRpcProvider, account: AccountId) {
    this.#provider = provider;
    this.#account = account;
  }

  async connect() {
    // Setup Safe Factory
    /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    this.#ethAdapter = new EthersAdapter.default({
      ethers,
      signer: this.#provider.getSigner(this.#account.address),
    });
    this.#safeFactory = await SafeFactory.create({
      /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
      ethAdapter: this.#ethAdapter!,
    });
  }

  // Renter can predict and deposit trip payment to predicted address
  async predictAndDeposit(
    accounts: AccountId[],
    saltNonce: string,
    totalAmt: string,
    sourceCurrency: string,
    destCurrency: string
  ) {
    if (!this.#safeFactory) {
      throw new Error("LigoSafeEscrow is not connected");
    }
    const safeAccountConfig: SafeAccountConfig = {
      owners: accounts.map((a) => a.address),
      threshold: accounts.length,
    };
    const safeDeploymentConfig: SafeDeploymentConfig = {
      saltNonce: saltNonce,
    };
    const safeAddress = await this.#safeFactory.predictSafeAddress({
      safeAccountConfig,
      safeDeploymentConfig,
    });
    //renter pays in Safe
    await this._wyrePayment(
      safeAddress,
      totalAmt,
      sourceCurrency,
      destCurrency
    );

    //Deploy Safe
    const safeSdk = await this.#safeFactory.deploySafe({
      safeAccountConfig,
      safeDeploymentConfig,
    });
    return safeSdk;
  }

  //Create transaction
  async createSafeTransaction(safeSdk: any) {
    const safeTransactionData: SafeTransactionDataPartial = {
      to: "0x<address>",
      value: "<eth_value_in_wei>",
      data: "0x<data>",
    };
    const safeTransaction = await (
      await safeSdk
    ).createTransaction({ safeTransactionData });
    return safeTransaction;
  }

  //Sign transaction
  async signSafeTransaction(safeSdk: any, safeTransaction: any) {
    const signedSafeTransaction = await safeSdk.signTransaction(
      safeTransaction
    );
    return signedSafeTransaction;
  }

  //Execute transaction using Relayer = 3rd owner
  async executeSafeTransaction(
    safeSdk2: any,
    safeAddress: any,
    safeTransaction: any
  ) {
    // const ethAdapterOwner3 = new EthersAdapter({ ethers, signerOrProvider: owner3 })
    const safeSdk3 = await safeSdk2.connect({
      ethAdapter: this.#ethAdapter,
      safeAddress,
    });
    const executeTxResponse = await safeSdk3.executeTransaction(
      safeTransaction
    );
    await executeTxResponse.transactionResponse?.wait();
  }

  // setup relayer
  async setupRelayer() {
    // Configure the ITX provider using your Infura credentials
    const itx = new ethers.providers.InfuraProvider(
      process.env.ETHEREUM_NETWORK,
      process.env.INFURA_PROJECT_ID
    );

    // Create a signer instance based on your private key
    const PK: BytesLike = process.env.PRIVATE_KEY
      ? process.env.PRIVATE_KEY
      : "";
    const signer = new ethers.Wallet(PK, itx);
    console.log(`Signer public address: ${signer.address}`);

    const depositTx = await signer.sendTransaction({
      // Address of the ITX deposit contract
      to: "0x015C7C7A7D65bbdb117C573007219107BD7486f9",
      // The amount of ether you want to deposit in your ITX gas tank
      value: ethers.utils.parseUnits("0.1", "ether"),
    });
    console.log("Mining deposit transaction...");
    console.log(
      `https://${process.env.ETHEREUM_NETWORK}.etherscan.io/tx/${depositTx.hash}`
    );

    // Waiting for the transaction to be mined
    const receipt = await depositTx.wait();

    // The transaction is now on chain!
    console.log(`Mined in block ${receipt.blockNumber}`);
  }

  async depositNative(paymentMethodId: AccountId, amount: BigNumber) {
    const signer = this.#provider.getSigner(this.#account.address);
    return await signer.sendTransaction({
      to: paymentMethodId.address,
      value: amount,
    });
  }

  private async _wyrePayment(
    ethAddress: string,
    total: string,
    sourceCurrency: string,
    destCurrency: string
  ) {
    try {
      const destEthAddress = "ethereum:" + ethAddress;
      const options = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: "Bearer TEST-SK-NJBM7HCD-73XMAE9P-Q87BW8WX-LCW9HXXB",
        },
        body: JSON.stringify({
          lockFields: ["amount", "destCurrency", "dest", "sourceCurrency"],
          referrerAccountId: "AC_Q4AZHYVQNXU",
          amount: total,
          sourceCurrency: sourceCurrency,
          destCurrency: destCurrency,
          dest: destEthAddress,
          firstName: "Crash",
          lastName: "Bandicoot",
          country: "US",
          postalCode: "90140",
          state: "CA",
        }),
      };
      fetch("https://api.testwyre.com/v3/orders/reserve", options)
        .then((response) => response.json())
        .then((response) => (window.location.href = response?.url))
        .catch((err) => console.error(err));
    } catch (error) {
      console.log("Ligo web app failed to initialize Wyre payment", error);
    }
  }
}
