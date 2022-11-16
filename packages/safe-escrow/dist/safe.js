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
import { AccountId } from "caip";
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
    async createEscrow(accounts) {
        if (!_classPrivateFieldGet(this, _safeFactory)) {
            throw new Error("LigoSafeEscrow is not connected");
        }
        const safeAccountConfig = {
            owners: accounts.map((a)=>a.address),
            threshold: accounts.length
        };
        const safeSdk = await _classPrivateFieldGet(this, _safeFactory).deploySafe({
            safeAccountConfig
        });
        const network = await _classPrivateFieldGet(this, _provider).getNetwork();
        return new AccountId({
            chainId: {
                namespace: "eip155",
                reference: network.chainId.toString()
            },
            address: safeSdk.getAddress()
        });
    }
    async depositNative(paymentMethodId, amount) {
        const signer = _classPrivateFieldGet(this, _provider).getSigner(_classPrivateFieldGet(this, _account).address);
        return await signer.sendTransaction({
            to: paymentMethodId.address,
            value: amount
        });
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
