import { ethers } from "ethers";

export interface DidInterface {
    address: string,
    privateKey: string,
    publicKey: string
}

export const DID_LIST : DidInterface[] = [
    {
      address: "did:vda:testnet:0x8Ec5df9Ebc9554CECaA1067F974bD34735d3e539",
      privateKey: "0x42d4c8a6b73fe84863c6f6b5a55980f9a8949e18ed20da65ca2033477ad563f0",
      publicKey: "0x042b816206dfd7c694d627ff775b9c151319b9a0e54de94d18e61619372fc713664dc677d5247adc2d4f8722b227bd9504b741ea380d5e7887a5698a7a634ec6ae",
    },
    {
      address: 'did:vda:testnet:0xE3A441c4e699433FCf1262246Cf323d8e4302998',
      privateKey: '0xb5867e47d06b2c2679c1dadfa2f3990c5db7a378acc9fb1c0d14d7861adf3490',
      publicKey : '0x04b24294e9a6880936512213d2a25a97213f870d50e8f6df553a0fc0ede5d15f2154dabb73042f40a9492da2b200f9679d6038f93d0b5f506c14f14f132b860bbe',
    },
    {
      address: 'did:vda:testnet:0x58B24541eAb4F50E05CeB08374CeAE6794dD1143',
      privateKey: '0x854eb960003cd3b6e1111c887244db09a354925c374439a8d849b55fc8dda0ef',
      publicKey : '0x04ae9b3163a8b6b0a72047d47552bc68dc46dc0f846ecaaf303007a3be52dbb2f1079cb41f3590135aa864e4c712d9f9f1b173f738761b021ad04ed816ca70fa67',
    },
    {
      address: 'did:vda:testnet:0xb61166251d6dFa18B547b954ecE5D8a0408dc7cC',
      privateKey: '0xdc5a535b4f3f3ec42f7f5fb28d61f02a493f7c2a3ff3fdc6950610473f9a11c8',
      publicKey : '0x0413f0a7a9040f9d99e9a0d1c53bea87d7ee8096c95f18b6d22fb74b01c7ca713de27a94b17c857eb39d67278f7633a40e73a75d2e6643298f3d66b77b14af77e5',
    },
    {
      address: 'did:vda:testnet:0xe484BA18d807AF41207E9D5E4983906Afe2779b6',
      privateKey: '0xe7c0985b8fe575350dba0763486a173456d41221f50ed936a20448249ae53ca7',
      publicKey : '0x04acd5fd52aaa3f9d6867e524bdc0b1716f98fc6300a87cef2a0b8054103acb33530948388e85f8280cda33deda45aae8a416fbaf3651981575710b401e1ee94c6',
    },

    {
      address: 'did:vda:testnet:0x8d27e2f49ab2f02F7F326A652Dcefa63c7da3913',
      privateKey: '0x637f5a054ee80dec48554c6cb5ec21f01eeff1a1e28049241716b9d2846f5e9c',
      publicKey : '0x040d7593f5412ffcbe7a3b77392a6328b17baf31ce3621baf5580fecfe4bcc1fc59000b9ba579a1fb74771a45d222083eb7de1bed36ed1e59e8f4e635d949ad54a',
    },
]

export const TRUSTED_SIGNER : DidInterface =  {
    address: '0x0162aE4B571E9daB51309f885200aDdF04F33747',
    privateKey: '0x8a4c7e289560bd39d1820fade8f953ba49c1281eb7056d1affde76a7a05c01a3',
    publicKey : '0x0403da4e7946c84a92ddb09cec9fce8f0cb08e3316856e55168d3e0bfa47f8a5a08e1f2a75c78353450010b6d8835046fbf8a093f9eb7431f0930afebbbbca81bf',
};

export const RECIPIENT_WALLET = {
    address: '0xeea7e0781317408d84aD70d1AA8c7553D3D31cA5',
    privateKey: '0x78538a24889f4eaa6186ee201bf7aeea89bdad695ab85d95871eac603665c620',
    publicKey : '0x040f8ef908ca54fb1a45d8dd4463e6930c1d96c674d75f3c27e42d5f60ae2123837b47d1b249e8a015e3dcf2b669a7f30884a80ff57bf3332bf96698626f31a5da',
};
  
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";