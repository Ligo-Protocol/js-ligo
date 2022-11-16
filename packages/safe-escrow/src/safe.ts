import EthersAdapter from "@gnosis.pm/safe-ethers-lib";
import { ethers, BigNumber } from "ethers";
import { SafeFactory, SafeAccountConfig } from "@gnosis.pm/safe-core-sdk";
import { JsonRpcProvider } from "@ethersproject/providers";
import { AccountId } from "caip";

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

  async createEscrow(accounts: AccountId[]): Promise<AccountId> {
    if (!this.#safeFactory) {
      throw new Error("LigoSafeEscrow is not connected");
    }

    const safeAccountConfig: SafeAccountConfig = {
      owners: accounts.map((a) => a.address),
      threshold: accounts.length,
    };
    const safeSdk = await this.#safeFactory.deploySafe({ safeAccountConfig });
    const network = await this.#provider.getNetwork();

    return new AccountId({
      chainId: {
        namespace: "eip155",
        reference: network.chainId.toString(),
      },
      address: safeSdk.getAddress(),
    });
  }

  async depositNative(paymentMethodId: AccountId, amount: BigNumber) {
    const signer = this.#provider.getSigner(this.#account.address);
    return await signer.sendTransaction({
      to: paymentMethodId.address,
      value: amount,
    });
  }
}
