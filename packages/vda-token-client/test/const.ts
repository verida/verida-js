import { BlockchainAnchor } from "@verida/types"
import { VeridaTokenOwner } from "../src"
import { BigNumber, Wallet } from "ethers";
import { DID_LIST } from "@verida/vda-common-test";

export const TOKEN_SENDER = new Wallet(DID_LIST[0].privateKey);
export const TOKEN_APPROVER = new Wallet(DID_LIST[1].privateKey);
export const TOKEN_RECIVER = new Wallet(DID_LIST[2].privateKey);

export const TOKEN_MINTER = new Wallet(DID_LIST[3].privateKey);