import { ethers } from 'ethers'

export function interpretIdentifier(identifier: string): {
    address: string;
    publicKey?: string;
    network?: string;
  } {
    let id = identifier;
    let network = undefined;
    if (id.startsWith("did:vda")) {
      id = id.split("?")[0];
      const components = id.split(":");
      id = components[components.length - 1];
      if (components.length >= 4) {
        network = components.splice(2, components.length - 3).join(":");
      }
    }
    
    if (id.length > 42) {
      return { address: ethers.utils.computeAddress(id), publicKey: id, network };
    } else {
      return { address: ethers.utils.getAddress(id), network }; // checksum address
    }
  }