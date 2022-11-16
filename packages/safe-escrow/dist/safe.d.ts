import { ethers, BigNumber } from "ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import { AccountId } from "caip";
export declare class LigoSafeEscrow {
    #private;
    constructor(provider: JsonRpcProvider, account: AccountId);
    connect(): Promise<void>;
    createEscrow(accounts: AccountId[]): Promise<AccountId>;
    depositNative(paymentMethodId: AccountId, amount: BigNumber): Promise<ethers.providers.TransactionResponse>;
}
