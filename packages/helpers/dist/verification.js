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
exports.verifyDidControlsDomain = void 0;
var axios_1 = require("axios");
/**
 * Uses `/.well-known/did.json` standard
 *
 * @see https://w3c-ccg.github.io/did-method-web/
 * @see https://team.verida.network/.well-known/did.json
 *
 * @param did DID that is expected to control the domain name
 * @param domain Domain (ie: team.verida.network) that is expected to be controlled by the DID. If protocol is specified (ie: `https`) it will automatically be stripped. HTTPS is forced.
 */
function verifyDidControlsDomain(did, domain) {
    return __awaiter(this, void 0, void 0, function () {
        var didJsonUrl, response, didJson_1, match, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Strip out protocol if specified
                    domain = domain.replace(/^https?:\/\//, '');
                    // Remove any trailing '/'
                    domain = domain.replace(/\/$/, '');
                    didJsonUrl = "https://" + domain + "/.well-known/did.json";
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.get(didJsonUrl)];
                case 2:
                    response = _a.sent();
                    didJson_1 = response.data;
                    if (didJson_1.id !== "did:web:" + domain) {
                        return [2 /*return*/, false];
                    }
                    match = didJson_1.verificationMethod.find(function (entry) {
                        return (
                        // Verify authentication and entry ID match the domain
                        entry.id.match("did:web:" + domain) &&
                            didJson_1.authentication.find(function (authEntry) { return authEntry == entry.id; }) &&
                            // Verify the entry matches the DID
                            entry.controller.toLowerCase().match("" + did.toLowerCase()));
                    });
                    return [2 /*return*/, match != undefined];
                case 3:
                    err_1 = _a.sent();
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.verifyDidControlsDomain = verifyDidControlsDomain;
//# sourceMappingURL=verification.js.map