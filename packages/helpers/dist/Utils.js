"use strict";
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
exports.explodeDID = exports.decodeUri = exports.encodeUri = exports.wrapUri = exports.fetchVeridaUri = exports.explodeVeridaUri = exports.buildVeridaUri = void 0;
var encryption_utils_1 = require("@verida/encryption-utils");
var types_1 = require("@verida/types");
var url = require('url');
var bs58 = require('bs58');
/**
 * Build a URI that represents a specific record in a database
 *
 * @param did
 * @param contextName
 * @param databaseName
 * @param itemId
 * @param params
 * @returns
 */
function buildVeridaUri(did, contextName, databaseName, itemId, deepAttributes, params) {
    var uri = "verida://" + did + "/" + encodeURI(contextName);
    if (databaseName) {
        uri += "/" + databaseName;
    }
    if (itemId) {
        uri += "/" + itemId;
    }
    if (deepAttributes) {
        deepAttributes.forEach(function (attr) {
            uri += "/" + attr;
        });
    }
    if (params && params.key) {
        var encryptionKey = Buffer.from(params.key).toString('hex');
        uri += '?key=' + encryptionKey;
    }
    return uri;
}
exports.buildVeridaUri = buildVeridaUri;
/**
 * Explode a Verida URI into it's individual pieces
 *
 * @param uri
 * @returns
 */
function explodeVeridaUri(uri) {
    var regex = /^verida:\/\/(did\:[^\/]*)\/([^\/]*)\/([^\/]*)\/([^?]*)(\/([^?]*))?/i;
    var matches = uri.match(regex);
    if (!matches) {
        throw new Error('Invalid URI');
    }
    var did = matches[1];
    var contextName = decodeURI(matches[2]);
    var dbName = matches[3];
    var recordString = matches[4];
    var recordParts = recordString.split('/');
    var recordId = recordParts[0];
    var urlParts = url.parse(uri, true);
    var query = urlParts.query;
    return {
        did: did,
        contextName: contextName,
        dbName: dbName,
        recordId: recordId,
        deepAttributes: recordParts.splice(1).filter(function (value) { return value != ''; }),
        query: query
    };
}
exports.explodeVeridaUri = explodeVeridaUri;
/**
 * Fetch the data accessible from a Verida URI
 *
 * @param uri Verida URI of the record to access. If `key` is in the query parameters, it is used as a (hex) encryption key to decode the data
 * @param context An existing context used to open the external database
 * @returns
 */
function fetchVeridaUri(uri, client) {
    return __awaiter(this, void 0, void 0, function () {
        var uriParts, context, db, item, key, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    uriParts = explodeVeridaUri(uri);
                    return [4 /*yield*/, client.openExternalContext(uriParts.contextName, uriParts.did)];
                case 1:
                    context = _a.sent();
                    return [4 /*yield*/, context.openExternalDatabase(uriParts.dbName, uriParts.did, {
                            permissions: {
                                read: types_1.DatabasePermissionOptionsEnum.PUBLIC,
                                write: types_1.DatabasePermissionOptionsEnum.OWNER,
                            },
                            //@ts-ignore
                            contextName: uriParts.contextName,
                            readOnly: true,
                        })];
                case 2:
                    db = _a.sent();
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, db.get(uriParts.recordId, {})];
                case 4:
                    item = _a.sent();
                    if (uriParts.deepAttributes.length) {
                        item = getDeepAttributeValue(item, uriParts.deepAttributes);
                    }
                    if (uriParts.query && uriParts.query.key) {
                        key = Buffer.from(uriParts.query.key, 'hex');
                        item = encryption_utils_1.default.symDecrypt(item, key);
                    }
                    // Otherwise return the actual data
                    return [2 /*return*/, item];
                case 5:
                    err_1 = _a.sent();
                    if (err_1.error == 'not_found') {
                        throw new Error('Document does not exist ');
                    }
                    throw err_1;
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.fetchVeridaUri = fetchVeridaUri;
function getDeepAttributeValue(data, deepAttributes) {
    var nextAttribute = deepAttributes[0];
    if (typeof data[nextAttribute] === 'undefined') {
        throw new Error('Invalid attribute path');
    }
    if (deepAttributes.length == 1) {
        return data[nextAttribute];
    }
    return getDeepAttributeValue(data[nextAttribute], deepAttributes.splice(1));
}
/**
 * Wrap a Verida URI in a wrapper URI that handles fetching the record and returning it.
 *
 * ie: wrapUri('http://data.verida.network', ...)
 *
 * @param wrapperUri HTTP(s) endpoint that fetches a Verida URI
 * @param veridaUri Verida URI
 * @param separator optional separator (defaults to `/`)
 * @returns
 */
function wrapUri(veridaUri, wrapperUri) {
    if (wrapperUri === void 0) { wrapperUri = 'https://data.verida.network'; }
    var encodedVeridaUri = encodeUri(veridaUri);
    return wrapperUri + "/" + encodedVeridaUri;
}
exports.wrapUri = wrapUri;
/**
 * Encode a Verida URI in base58 to create a unique string reference on the network
 *
 * @param veridaUri
 * @returns
 */
function encodeUri(veridaUri) {
    var bytes = Buffer.from(veridaUri);
    var encodedVeridaUri = bs58.encode(bytes);
    return encodedVeridaUri;
}
exports.encodeUri = encodeUri;
/**
 * Decode a Verida URI from base58 to it's `verida://` URI format
 */
function decodeUri(encodedVeridaUri) {
    var bytes = bs58.decode(encodedVeridaUri);
    var veridaUri = Buffer.from(bytes).toString();
    return veridaUri;
}
exports.decodeUri = decodeUri;
/**
 * Get the `network` and `address` parts of a DID
 *
 * @param did
 */
function explodeDID(did) {
    var parts = did.split(':');
    if (parts.length != 4) {
        throw new Error('Invalid DID');
    }
    return {
        network: parts[2],
        address: parts[3]
    };
}
exports.explodeDID = explodeDID;
//# sourceMappingURL=Utils.js.map