import { Provider } from "@ethersproject/providers";

export interface ProviderConfiguration {
    name?: string;
    provider?: Provider;
    rpcUrl?: string;
    registry?: string;
    chainId?: string | number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    web3?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [index: string]: any;
  }
  
  export interface MultiProviderConfiguration extends ProviderConfiguration {
    networks?: ProviderConfiguration[];
    privateKey?: string;
  }
  
  export type ConfigurationOptions = MultiProviderConfiguration;

