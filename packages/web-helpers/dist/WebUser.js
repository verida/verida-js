"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebUser = void 0;
var client_ts_1 = require("@verida/client-ts");
var account_web_vault_1 = require("@verida/account-web-vault");
var events_1 = require("events");
/**
 * Usage:
 *
 * 1. Configure with this.configure(...)
 * 2. Check if the user is logged in with this.isConnected()
 * 3. Log the user in with this.connect()
 * 4. Listen to when the user has logged in with this.on('connected')
 * 5. Listen to when the user updates their profile with this.on('profileUpdated')
 * 5. Listen to when the user logs out with this.on('disconnected')
 *
 * @event profileChanged
 * @event connect
 * @event disconnected
 */
var WebUser = /** @class */ (function (_super) {
    __extends(WebUser, _super);
    function WebUser(config) {
        var _this = _super.call(this) || this;
        _this.config = config;
        return _this;
    }
    WebUser.prototype.getClient = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.client) {
                    return [2 /*return*/, this.client];
                }
                this.client = new client_ts_1.Client(this.config.clientConfig);
                return [2 /*return*/, this.client];
            });
        });
    };
    WebUser.prototype.getContext = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.requireConnection()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.context];
                }
            });
        });
    };
    WebUser.prototype.getAccount = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.requireConnection()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.account];
                }
            });
        });
    };
    WebUser.prototype.getDid = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.requireConnection()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.did];
                }
            });
        });
    };
    /**
     *
     * @param ignoreCache Ignore the cached version of the profile and force refresh a new copy of the profile
     * @returns
     */
    WebUser.prototype.getPublicProfile = function (ignoreCache) {
        if (ignoreCache === void 0) { ignoreCache = false; }
        return __awaiter(this, void 0, void 0, function () {
            var connection, profile, avatar, _a;
            var _b;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.requireConnection()];
                    case 1:
                        _c.sent();
                        if (!ignoreCache && this.profile) {
                            // return cached profile
                            return [2 /*return*/, this.profile];
                        }
                        if (!!this.profileConnection) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.context.getClient().openPublicProfile(this.did, 'Verida: Vault')];
                    case 2:
                        connection = _c.sent();
                        if (!connection) {
                            throw new Error('No profile exists for this account');
                        }
                        this.profileConnection = connection;
                        // bind an event listener to find changes
                        this.profileConnection.listen(function () { return __awaiter(_this, void 0, void 0, function () {
                            var profile;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.getPublicProfile(true)];
                                    case 1:
                                        profile = _a.sent();
                                        this.emit('profileChanged', profile);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        this.profileConnection;
                        _c.label = 3;
                    case 3:
                        profile = this.profileConnection;
                        return [4 /*yield*/, profile.get('avatar')
                            // build a cached profile
                        ];
                    case 4:
                        avatar = _c.sent();
                        // build a cached profile
                        _a = this;
                        _b = {
                            avatarUri: avatar ? avatar.uri : undefined
                        };
                        return [4 /*yield*/, profile.get('name')];
                    case 5:
                        _b.name = _c.sent();
                        return [4 /*yield*/, profile.get('country')];
                    case 6:
                        _b.country = _c.sent();
                        return [4 /*yield*/, profile.get('description')];
                    case 7:
                        // build a cached profile
                        _a.profile = (_b.description = _c.sent(),
                            _b);
                        return [2 /*return*/, this.profile];
                }
            });
        });
    };
    /**
     * Connect the user to the Verida Network
     *
     * @emit connected When the user successfully logs in
     * @returns A Promise that will resolve to true / false depending on if the user is connected
     */
    WebUser.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var config;
            var _this = this;
            return __generator(this, function (_a) {
                if (this.connecting) {
                    // Have an existing promise (that may or may not be resolved)
                    // Return it so if it's pending, the requestor will wait
                    return [2 /*return*/, this.connecting];
                }
                config = this.config;
                this.connecting = new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                    var account, context, did, profile;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                account = new account_web_vault_1.VaultAccount(config.accountConfig);
                                return [4 /*yield*/, client_ts_1.Network.connect({
                                        client: config.clientConfig,
                                        account: account,
                                        context: config.contextConfig
                                    })];
                            case 1:
                                context = _a.sent();
                                if (!context) {
                                    if (config.debug) {
                                        console.log('User cancelled login attempt by closing the QR code modal or an unexpected error occurred');
                                    }
                                    resolve(false);
                                    return [2 /*return*/];
                                }
                                return [4 /*yield*/, account.did()];
                            case 2:
                                did = _a.sent();
                                if (config.debug) {
                                    console.log("Account connected with did: " + did);
                                }
                                this.account = account;
                                this.context = context;
                                this.did = did;
                                return [4 /*yield*/, this.getPublicProfile()];
                            case 3:
                                profile = _a.sent();
                                this.client = context.getClient();
                                this.emit('connected', profile);
                                resolve(true);
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/, this.connecting];
            });
        });
    };
    WebUser.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var context_1, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getContext()];
                    case 1:
                        context_1 = _a.sent();
                        return [4 /*yield*/, context_1.disconnect()];
                    case 2:
                        _a.sent();
                        this.context = undefined;
                        this.account = undefined;
                        this.profile = undefined;
                        this.did = undefined;
                        this.connecting = undefined;
                        if (this.config.debug) {
                            console.log("Account disconnected");
                        }
                        this.emit('disconnected');
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        if (err_1.message.match('Not connected')) {
                            return [2 /*return*/];
                        }
                        throw err_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Send a generic message to a user's Verida Wallet
     *
     * @param {*} did
     * @param {*} subject
     * @param {*} message
     * @param {*} linkUrl
     * @param {*} linkText
     */
    WebUser.prototype.sendMessage = function (did, message) {
        return __awaiter(this, void 0, void 0, function () {
            var context, messaging, data, messageType, config;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getContext()];
                    case 1:
                        context = _a.sent();
                        return [4 /*yield*/, context.getMessaging()];
                    case 2:
                        messaging = _a.sent();
                        data = {
                            data: [{
                                    subject: message.subject,
                                    message: message.text,
                                    link: message.link ? message.link : undefined
                                }]
                        };
                        messageType = "inbox/type/message";
                        config = {
                            did: did,
                            recipientContextName: "Verida: Vault"
                        };
                        // Send the message across the network
                        return [4 /*yield*/, messaging.send(did, messageType, data, message.subject, config)];
                    case 3:
                        // Send the message across the network
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Is a user connected?
     *
     * Will auto-connect the user from local storage session if it exists.
     *
     * @returns
     */
    WebUser.prototype.isConnected = function () {
        return __awaiter(this, void 0, void 0, function () {
            var connected;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.did) {
                            return [2 /*return*/, true];
                        }
                        if (!(0, account_web_vault_1.hasSession)(this.config.contextConfig.name)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.connect()];
                    case 1:
                        connected = _a.sent();
                        return [2 /*return*/, connected];
                    case 2: return [2 /*return*/, false];
                }
            });
        });
    };
    /**
     * Throw an exception if a user isn't connected
     */
    WebUser.prototype.requireConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var isConnected;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.isConnected()];
                    case 1:
                        isConnected = _a.sent();
                        if (!isConnected) {
                            throw new Error('Not connected to Verida network');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Open a datastore owned by this user
     *
     * @param schemaURL
     * @param config
     * @returns
     */
    WebUser.prototype.openDatastore = function (schemaURL, config) {
        return __awaiter(this, void 0, void 0, function () {
            var context;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getContext()];
                    case 1:
                        context = _a.sent();
                        return [4 /*yield*/, context.openDatastore(schemaURL, config)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Open a database owned by this user
     *
     * @param databaseName
     * @param config
     * @returns
     */
    WebUser.prototype.openDatabase = function (databaseName, config) {
        return __awaiter(this, void 0, void 0, function () {
            var context;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getContext()];
                    case 1:
                        context = _a.sent();
                        return [4 /*yield*/, context.openDatabase(databaseName, config)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return WebUser;
}(events_1.EventEmitter));
exports.WebUser = WebUser;
//# sourceMappingURL=WebUser.js.map