function _checkPrivateRedeclaration(obj, privateCollection) {
    if (privateCollection.has(obj)) {
        throw new TypeError("Cannot initialize the same private elements twice on an object");
    }
}
function _classApplyDescriptorGet(receiver, descriptor) {
    if (descriptor.get) {
        return descriptor.get.call(receiver);
    }
    return descriptor.value;
}
function _classApplyDescriptorSet(receiver, descriptor, value) {
    if (descriptor.set) {
        descriptor.set.call(receiver, value);
    } else {
        if (!descriptor.writable) {
            throw new TypeError("attempted to set read only private field");
        }
        descriptor.value = value;
    }
}
function _classExtractFieldDescriptor(receiver, privateMap, action) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to " + action + " private field on non-instance");
    }
    return privateMap.get(receiver);
}
function _classPrivateFieldGet(receiver, privateMap) {
    var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get");
    return _classApplyDescriptorGet(receiver, descriptor);
}
function _classPrivateFieldInit(obj, privateMap, value) {
    _checkPrivateRedeclaration(obj, privateMap);
    privateMap.set(obj, value);
}
function _classPrivateFieldSet(receiver, privateMap, value) {
    var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set");
    _classApplyDescriptorSet(receiver, descriptor, value);
    return value;
}
import EthersAdapter from "@gnosis.pm/safe-ethers-lib";
import { ethers } from "ethers";
import { SafeFactory } from "@gnosis.pm/safe-core-sdk";
var _provider = /*#__PURE__*/ new WeakMap(), _account = /*#__PURE__*/ new WeakMap(), _ethAdapter = /*#__PURE__*/ new WeakMap(), _safeFactory = /*#__PURE__*/ new WeakMap();
export class LigoSafeEscrow {
    async connect() {
        _classPrivateFieldSet(this, _ethAdapter, new EthersAdapter.default({
            ethers,
            signer: _classPrivateFieldGet(this, _provider).getSigner(_classPrivateFieldGet(this, _account).address)
        }));
        _classPrivateFieldSet(this, _safeFactory, await SafeFactory.create({
            /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */ ethAdapter: _classPrivateFieldGet(this, _ethAdapter)
        }));
    }
    async predictAndDeposit(accounts, saltNonce, totalAmt, sourceCurrency, destCurrency) {
        if (!_classPrivateFieldGet(this, _safeFactory)) {
            throw new Error("LigoSafeEscrow is not connected");
        }
        const safeAccountConfig = {
            owners: accounts.map((a)=>a.address),
            threshold: accounts.length
        };
        const safeDeploymentConfig = {
            saltNonce: saltNonce
        };
        const safeAddress = await _classPrivateFieldGet(this, _safeFactory).predictSafeAddress({
            safeAccountConfig,
            safeDeploymentConfig
        });
        //renter pays in Safe
        await this._wyrePayment(safeAddress, totalAmt, sourceCurrency, destCurrency);
        //Deploy Safe
        const safeSdk = await _classPrivateFieldGet(this, _safeFactory).deploySafe({
            safeAccountConfig,
            safeDeploymentConfig
        });
        return safeSdk;
    }
    //Create transaction
    async createSafeTransaction(safeSdk) {
        const safeTransactionData = {
            to: "0x<address>",
            value: "<eth_value_in_wei>",
            data: "0x<data>"
        };
        const safeTransaction = await (await safeSdk).createTransaction({
            safeTransactionData
        });
        return safeTransaction;
    }
    //Sign transaction
    async signSafeTransaction(safeSdk, safeTransaction) {
        const signedSafeTransaction = await safeSdk.signTransaction(safeTransaction);
        return signedSafeTransaction;
    }
    //Execute transaction using Relayer = 3rd owner
    async executeSafeTransaction(safeSdk2, owner3, safeAddress, safeTransaction) {
        // const ethAdapterOwner3 = new EthersAdapter({ ethers, signerOrProvider: owner3 })
        const safeSdk3 = await safeSdk2.connect({
            ethAdapter: _classPrivateFieldGet(this, _ethAdapter),
            safeAddress
        });
        const executeTxResponse = await safeSdk3.executeTransaction(safeTransaction);
        await executeTxResponse.transactionResponse?.wait();
    }
    // setup relayer
    async setupRelayer() {
        // Configure the ITX provider using your Infura credentials
        const itx = new ethers.providers.InfuraProvider(process.env.ETHEREUM_NETWORK, process.env.INFURA_PROJECT_ID);
        // Create a signer instance based on your private key
        const signer = new ethers.Wallet("0x015C7C7A7D65bbdb117C573007219107BD7486f9 <<< PRIVATE KEY ", itx);
        console.log(`Signer public address: ${signer.address}`);
        const depositTx = await signer.sendTransaction({
            // Address of the ITX deposit contract
            to: "0x015C7C7A7D65bbdb117C573007219107BD7486f9",
            // The amount of ether you want to deposit in your ITX gas tank
            value: ethers.utils.parseUnits("0.1", "ether")
        });
        console.log("Mining deposit transaction...");
        console.log(`https://${process.env.ETHEREUM_NETWORK}.etherscan.io/tx/${depositTx.hash}`);
        // Waiting for the transaction to be mined
        const receipt = await depositTx.wait();
        // The transaction is now on chain!
        console.log(`Mined in block ${receipt.blockNumber}`);
    }
    async depositNative(paymentMethodId, amount) {
        const signer = _classPrivateFieldGet(this, _provider).getSigner(_classPrivateFieldGet(this, _account).address);
        return await signer.sendTransaction({
            to: paymentMethodId.address,
            value: amount
        });
    }
    async _wyrePayment(ethAddress, total, sourceCurrency, destCurrency) {
        try {
            const destEthAddress = "ethereum:" + ethAddress;
            const options = {
                method: "POST",
                headers: {
                    accept: "application/json",
                    "content-type": "application/json",
                    authorization: "Bearer TEST-SK-NJBM7HCD-73XMAE9P-Q87BW8WX-LCW9HXXB"
                },
                body: JSON.stringify({
                    lockFields: [
                        "amount",
                        "destCurrency",
                        "dest",
                        "sourceCurrency"
                    ],
                    referrerAccountId: "AC_Q4AZHYVQNXU",
                    amount: total,
                    sourceCurrency: sourceCurrency,
                    destCurrency: destCurrency,
                    dest: destEthAddress,
                    firstName: "Crash",
                    lastName: "Bandicoot",
                    country: "US",
                    postalCode: "90140",
                    state: "CA"
                })
            };
            fetch("https://api.testwyre.com/v3/orders/reserve", options).then((response)=>response.json()).then((response)=>window.location.href = response?.url).catch((err)=>console.error(err));
        } catch (error) {
            console.log("Ligo web app failed to initialize Wyre payment", error);
        }
    }
    constructor(provider, account){
        _classPrivateFieldInit(this, _provider, {
            writable: true,
            value: void 0
        });
        _classPrivateFieldInit(this, _account, {
            writable: true,
            value: void 0
        });
        _classPrivateFieldInit(this, _ethAdapter, {
            writable: true,
            value: void 0
        });
        _classPrivateFieldInit(this, _safeFactory, {
            writable: true,
            value: void 0
        });
        _classPrivateFieldSet(this, _provider, provider);
        _classPrivateFieldSet(this, _account, account);
    }
}
