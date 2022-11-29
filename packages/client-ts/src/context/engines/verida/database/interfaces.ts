import { Context } from "../../../..";
import { PermissionsConfig } from "../../../interfaces";
import DatastoreServerClient from "./client";
import Endpoint from "./endpoint";

/**
 * Interface for VeridaDatabaseConfig
 */
export interface VeridaDatabaseConfig {
  databaseName: string;
  did: string;
  dsn?: string | string[];
  storageContext: string;

  permissions?: PermissionsConfig;

  signData?: boolean;
  signContext: Context;

  readOnly?: boolean;
  isOwner?: boolean;
  encryptionKey?: Buffer;

  saveDatabase: boolean;

  endpoints: Record<string, Endpoint>;
}
