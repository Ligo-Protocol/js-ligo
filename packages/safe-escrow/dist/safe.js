import EthersAdapter from "@safe-global/safe-ethers-lib"; // EthersTransactionOptions,
import { ethers } from "ethers";
import { SafeFactory } from "@safe-global/safe-core-sdk";
import Safe from "@safe-global/safe-core-sdk";
import { OperationType } from "@safe-global/safe-core-sdk-types";
import SafeServiceClient from "@safe-global/safe-service-client";
// https://safe-transaction-goerli.safe.global/
export class LigoSafeEscrow {
    // Connect to instantiate before deployment
    async deploySafe(signer, owner1, owner2, saltNonce) {
        // Create EthAdapter instance
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        const ethAdapter = new EthersAdapter.default({
            ethers,
            signerOrProvider: signer
        });
        // Create SafeFactory instance
        const safeFactory = await SafeFactory.create({
            ethAdapter
        });
        // Config of the deployed Safe
        const safeAccountConfig = {
            owners: [
                owner1,
                owner2
            ],
            threshold: 2
        };
        const safeDeploymentConfig = {
            saltNonce: saltNonce
        };
        const predictedDeployAddress = await safeFactory.predictSafeAddress({
            safeAccountConfig,
            safeDeploymentConfig
        });
        console.log(predictedDeployAddress);
        function callback(txHash) {
            console.log("Transaction hash", txHash);
        }
        // const options: EthersTransactionOptions = {
        //   gasPrice: "152907720834",
        // };
        const safe = await safeFactory.deploySafe({
            safeAccountConfig,
            safeDeploymentConfig,
            callback
        });
        return safe.getAddress();
    }
    // Send amount to deployedSafe
    async depositNative(signer, recipientAddress, amount) {
        return await signer.sendTransaction({
            to: recipientAddress,
            value: amount
        });
    }
    //Connect post deployment for Propose, Confirm and Execute transaction
    async connectPostDeploy(signer, safeAddress, txServiceUrl) {
        // Create EthAdapter instance
        const ethAdapter = new EthersAdapter({
            ethers,
            signerOrProvider: signer
        });
        // Create Safe instance
        const safe = await Safe.create({
            ethAdapter,
            safeAddress: safeAddress
        });
        // Create Safe Service Client instance
        const service = new SafeServiceClient({
            txServiceUrl: txServiceUrl,
            ethAdapter
        });
        return {
            safe,
            service
        };
    }
    //Create and propose transaction
    async createAndProposeTransaction(signer, safe, service, recipientAddress, eth_value_in_wei) {
        const safeTransactionData = {
            to: recipientAddress,
            value: eth_value_in_wei,
            data: "0x",
            operation: OperationType.Call
        };
        const safeTransaction = await safe.createTransaction({
            safeTransactionData
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
            senderSignature: senderSignature
        });
        return {
            safeAddress,
            safeTxHash,
            senderAddress,
            senderSignature
        };
    }
    // Confirm transaction
    async confirmTransaction(signer, safe, service, safeTxHash) {
        const signature = await safe.signTransactionHash(safeTxHash);
        // Confirm the Safe transaction
        const signatureResponse = await service.confirmTransaction(safeTxHash, signature.data);
        const signerAddress = await signer.getAddress();
        const responseSignature = signatureResponse.signature;
        return {
            safeTxHash,
            signerAddress,
            responseSignature
        };
    }
    // Execute transaction
    async executeTransaction(service, safe, txHash) {
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
