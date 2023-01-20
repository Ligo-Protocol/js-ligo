import EthersAdapter from "@gnosis.pm/safe-ethers-lib";
import { ethers, BigNumber } from "ethers";
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
  async predictAndDeposit(accounts: AccountId[], saltNonce: string) {
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

    //Deploy Safe
    const safeSdk = await this.#safeFactory.deploySafe({
      safeAccountConfig,
      safeDeploymentConfig,
    });
    return { safeSdk, safeAddress };
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

  async depositNative(paymentMethodId: AccountId, amount: BigNumber) {
    const signer = this.#provider.getSigner(this.#account.address);
    return await signer.sendTransaction({
      to: paymentMethodId.address,
      value: amount,
    });
  }
}
