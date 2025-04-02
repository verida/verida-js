import { AccountConfig, AccountNodeConfig } from "@verida/types";
import LimitedAccount from "./limited";

export default class ContextAccount extends LimitedAccount {
    constructor(autoConfig: AccountNodeConfig, did: string, contextName: string, accountConfig?: AccountConfig) {
        super(autoConfig, accountConfig, [contextName])
    }
}
