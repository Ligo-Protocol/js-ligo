import EthersAdapter from "@safe-global/safe-ethers-lib"; // EthersTransactionOptions,
import { BigNumber, ethers } from "ethers";
import {
  SafeFactory,
  SafeAccountConfig,
  SafeDeploymentConfig,
} from "@safe-global/safe-core-sdk";
import Safe from "@safe-global/safe-core-sdk";
import {
  OperationType,
  SafeTransactionDataPartial,
} from "@safe-global/safe-core-sdk-types";
import SafeServiceClient from "@safe-global/safe-service-client";

// https://safe-transaction-goerli.safe.global/

export class LigoSafeEscrow {
  // Connect to instantiate before deployment
  async deploySafe(
    signer: any,
    owner1: string,
    owner2: string,
    saltNonce: string
  ) {
    // Create EthAdapter instance
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const ethAdapter = new EthersAdapter.default({
      ethers,
      signerOrProvider: signer,
    });

    // Create SafeFactory instance
    const safeFactory = await SafeFactory.create({ ethAdapter });

    // Config of the deployed Safe
    const safeAccountConfig: SafeAccountConfig = {
      owners: [owner1, owner2],
      threshold: 2,
    };
    const safeDeploymentConfig: SafeDeploymentConfig = {
      saltNonce: saltNonce,
    };

    const predictedDeployAddress = await safeFactory.predictSafeAddress({
      safeAccountConfig,
      safeDeploymentConfig,
    });
    console.log(predictedDeployAddress);

    function callback(txHash: string) {
      console.log("Transaction hash", txHash);
    }

    const safe = await safeFactory.deploySafe({
      safeAccountConfig,
      safeDeploymentConfig,
      callback,
    });
    return safe.getAddress();
  }

  // Send amount to deployedSafe
  async depositNative(
    signer: any,
    recipientAddress: string,
    amount: BigNumber
  ) {
    return await signer.sendTransaction({
      to: recipientAddress,
      value: amount,
    });
  }

  //Connect post deployment for Propose, Confirm and Execute transaction
  async connectPostDeploy(
    signer: any,
    safeAddress: string,
    txServiceUrl: string
  ) {
    // Create EthAdapter instance
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const ethAdapter = new EthersAdapter.default({
      ethers,
      signerOrProvider: signer,
    });

    // Create Safe instance
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const safe = await Safe.default.create({
      ethAdapter,
      safeAddress: safeAddress,
    });

    // Create Safe Service Client instance
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const service = new SafeServiceClient.default({
      txServiceUrl: txServiceUrl,
      ethAdapter,
    });

    return { safe, service };
  }

  //Create and propose transaction
  async createAndProposeTransaction(
    signer: any,
    safe: Safe,
    service: SafeServiceClient,
    recipientAddress: string,
    eth_value_in_wei: string
  ) {
    const safeTransactionData: SafeTransactionDataPartial = {
      to: recipientAddress,
      value: eth_value_in_wei, // 1 wei
      data: "0x",
      operation: OperationType.Call,
    };
    const safeTransaction = await safe.createTransaction({
      safeTransactionData,
    });

    const senderAddress = await signer.getAddress();
    const safeTxHash = await safe.getTransactionHash(safeTransaction);
    const signature = await safe.signTransactionHash(safeTxHash);
    const safeAddress = await safe.getAddress();
    const senderSignature = signature.data;

    // Propose transaction to the service
    await service.proposeTransaction({
      safeAddress: safeAddress,
      safeTransactionData: safeTransaction.data,
      safeTxHash,
      senderAddress,
      senderSignature: senderSignature,
    });

    return { safeAddress, safeTxHash, senderAddress, senderSignature };
  }

  // Confirm transaction
  async confirmTransaction(
    signer: any,
    safe: Safe,
    service: SafeServiceClient,
    safeTxHash: string
  ) {
    const signature = await safe.signTransactionHash(safeTxHash);

    // Confirm the Safe transaction
    const signatureResponse = await service.confirmTransaction(
      safeTxHash,
      signature.data
    );

    const signerAddress = await signer.getAddress();
    const responseSignature = signatureResponse.signature;
    return { safeTxHash, signerAddress, responseSignature };
  }

  // Execute transaction
  async executeTransaction(
    service: SafeServiceClient,
    safe: Safe,
    txHash: string
  ) {
    // Get the transaction
    const safeTransaction = await service.getTransaction(txHash);

    const isTxExecutable = await safe.isValidTransaction(safeTransaction);

    if (isTxExecutable) {
      // Execute the transaction
      const txResponse = await safe.executeTransaction(safeTransaction);
      const contractReceipt = await txResponse.transactionResponse?.wait();

      console.log("Transaction executed.");
      console.log("- Transaction hash:", contractReceipt?.transactionHash);
      return contractReceipt?.transactionHash;
    } else {
      console.log("Transaction invalid. Transaction was not executed.");
      return;
    }
  }
}
