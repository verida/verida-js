import { EnvironmentType } from '@verida/account';

export interface NodeAccountConfig {
  privateKey: string; // or mnemonic
  environment: EnvironmentType;
  didServerUrl?: string;
  options?: any;
}
