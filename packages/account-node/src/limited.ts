import AutoAccount from './auto';
import { AccountConfig } from '@verida/account';
import { NodeAccountConfig } from './interfaces';
import { Keyring } from '@verida/keyring';
import { Interfaces } from '@verida/storage-link';

/**
 * A NodeJs account that only signs messages for a limited list of contexts.
 *
 * Used for testing.
 */
export default class LimitedAccount extends AutoAccount {
  private signingContexts: string[];

  constructor(accountConfig: AccountConfig, autoConfig: NodeAccountConfig, signingContexts = []) {
    super(accountConfig, autoConfig);
    this.signingContexts = signingContexts;
  }

  public async keyring(contextName: string): Promise<Keyring> {
    if (this.signingContexts.indexOf(contextName) == -1) {
      throw new Error(`Account does not support context: ${contextName}`);
    }

    return AutoAccount.prototype.keyring.call(this, contextName);
  }

  public async storageConfig(
    contextName: string,
    forceCreate?: boolean
  ): Promise<Interfaces.SecureContextConfig | undefined> {
    if (this.signingContexts.indexOf(contextName) == -1) {
      throw new Error(`Account does not support context: ${contextName}`);
    }

    return AutoAccount.prototype.storageConfig.call(this, contextName, forceCreate);
  }

  public async unlinkStorage(contextName: string): Promise<boolean> {
    if (this.signingContexts.indexOf(contextName) == -1) {
      throw new Error(`Account does not support context: ${contextName}`);
    }

    return AutoAccount.prototype.unlinkStorage.call(this, contextName);
  }
}
