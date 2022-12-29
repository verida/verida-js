"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NameClient = void 0;
var config_1 = require("./config");
var web3_1 = require("@verida/web3");
var providers_1 = require("@ethersproject/providers");
var ethers_1 = require("ethers");
var encryption_utils_1 = __importDefault(require("@verida/encryption-utils"));
var NameClient = /** @class */ (function () {
    function NameClient(config) {
        this.config = config;
        var didParts = this.parseDid(config.did);
        this.didAddress = didParts.address;
        var contractInfo = this.buildContractInfo();
        // @ts-ignore
        if (options.callType == 'web3' && !options.web3Options.rpcUrl) {
            throw new Error('Web3 transactions must specify `rpcUrl` in the configuration options');
        }
        this.vdaWeb3Client = (0, web3_1.getVeridaContract)(config.callType, __assign(__assign({}, contractInfo), config.web3Options));
    }
    NameClient.prototype.register = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var signature, result, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.signRegister(username)
                        // Register a name against a DID
                    ];
                    case 1:
                        signature = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.vdaWeb3Client.register(username, this.didAddress, signature)];
                    case 3:
                        result = _a.sent();
                        console.log('register result', result);
                        return [2 /*return*/, result];
                    case 4:
                        err_1 = _a.sent();
                        // @throws new Error(`DID not found.`)
                        // @throws new Error(`DID has too many usernames.`)
                        throw new Error("Unable to register name for DID (".concat(this.config.did, "): ").concat(err_1.message));
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the DID address associated with a `username`.
     *
     * @param username
     * @throws Error Username not found
     * @returns string DID address (ie: 0xabc123...)
     */
    NameClient.prototype.getDidAddress = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var result, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.vdaWeb3Client.findDID(username)];
                    case 1:
                        result = _a.sent();
                        console.log('findDID result', result);
                        return [2 /*return*/, result];
                    case 2:
                        err_2 = _a.sent();
                        throw new Error("Unable to find name for DID (".concat(this.config.did, "): ").concat(err_2.message));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get an array of all the usernames associated with a DID
     *
     * @param did
     * @throws Error Unknown blockchain error
     * @returns array Usernames associated with the DID
     */
    NameClient.prototype.getUsernames = function (did) {
        return __awaiter(this, void 0, void 0, function () {
            var didParts, result, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        didParts = this.parseDid(did);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.vdaWeb3Client.getUserNameList(didParts.address)];
                    case 2:
                        result = _a.sent();
                        console.log('getUserNameList result', result);
                        return [2 /*return*/, result];
                    case 3:
                        err_3 = _a.sent();
                        if (err_3.message == 'No registered DID') {
                            return [2 /*return*/, []];
                        }
                        throw new Error("Unknown error finding usernames for DID (".concat(this.config.did, "): ").concat(err_3.message));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    NameClient.prototype.buildContractAddress = function () {
        return config_1.CONTRACT_ADDRESSES[this.config.network];
    };
    NameClient.prototype.buildContractAbi = function () {
        return require("./abi/NameRegistry.json");
    };
    NameClient.prototype.buildContract = function () {
        var abi = this.buildContractAbi();
        var provider = new providers_1.JsonRpcProvider(this.config.rpcUrl);
        var address = this.buildContractAddress();
        return ethers_1.ContractFactory.fromSolidity(abi)
            .attach(address)
            .connect(provider);
    };
    NameClient.prototype.buildContractInfo = function () {
        return {
            address: this.buildContractAddress(),
            abi: this.buildContractAbi()
        };
    };
    NameClient.prototype.signRegister = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var rawMsg, contract, nonce, wrappedMsg, privateKeyArray;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        rawMsg = ethers_1.ethers.utils.solidityPack(["string", "address"], [name, this.didAddress]);
                        contract = this.buildContract();
                        return [4 /*yield*/, contract.nonce(this.didAddress)];
                    case 1:
                        nonce = (_a.sent()).toNumber();
                        wrappedMsg = ethers_1.ethers.utils.solidityPack(["bytes", "uint256"], [rawMsg, nonce]);
                        privateKeyArray = new Uint8Array(Buffer.from(this.config.privateKey.slice(2), "hex"));
                        return [2 /*return*/, encryption_utils_1.default.signData(wrappedMsg, privateKeyArray)];
                }
            });
        });
    };
    NameClient.prototype.getNonce = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.vdaWeb3Client.nonce(this.didAddress)];
                    case 1:
                        response = _a.sent();
                        if (response.data === undefined) {
                            throw new Error('Error in getting nonce');
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    NameClient.prototype.parseDid = function (did) {
        var id = did;
        var network = undefined;
        if (id.startsWith("did:vda")) {
            id = id.split("?")[0];
            var components = id.split(":");
            id = components[components.length - 1];
            if (components.length >= 4) {
                network = components.splice(2, components.length - 3).join(":");
            }
        }
        if (id.length > 42) {
            return { address: ethers_1.ethers.utils.computeAddress(id).toLowerCase(), publicKey: id, network: network };
        }
        else {
            return { address: ethers_1.ethers.utils.getAddress(id).toLowerCase(), network: network }; // checksum address
        }
    };
    return NameClient;
}());
exports.NameClient = NameClient;
//# sourceMappingURL=nameClient.js.map