import { DatabasePermissionsConfig, IContext } from "@verida/types";
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
  signContext: IContext;

  readOnly?: boolean;
  isOwner?: boolean;
  verifyEncryptionKey?: boolean;
  encryptionKey?: Buffer;

  saveDatabase: boolean;

  endpoint: Endpoint;
}