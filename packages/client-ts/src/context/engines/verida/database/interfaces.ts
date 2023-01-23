import { DatabasePermissionsConfig } from "@verida/types";
import { Context } from "../../../..";
import Endpoint from "./endpoint";

/**
 * Interface for VeridaDatabaseConfig
 */
export interface VeridaDatabaseConfig {
  databaseName: string;
  did: string;
  storageContext: string;

  permissions?: DatabasePermissionsConfig;

  signData?: boolean;
  signContext: Context;

  readOnly?: boolean;
  isOwner?: boolean;
  encryptionKey?: Buffer;

  saveDatabase: boolean;

  endpoint: Endpoint;
}