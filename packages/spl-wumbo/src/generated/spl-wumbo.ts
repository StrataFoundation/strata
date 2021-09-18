import { IdlAccounts, Idl } from '@wum.bo/anchor';
export const SplWumboIDLJson: Idl & { metadata?: { address: string } } = {
  "version": "0.0.0",
  "name": "spl_wumbo",
  "instructions": [
    {
      "name": "initializeWumbo",
      "accounts": [
        {
          "name": "wumbo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "curve",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "InitializeWumboArgs"
          }
        }
      ]
    },
    {
      "name": "initializeOwnedSocialTokenV0",
      "accounts": [
        {
          "name": "initializeArgs",
          "accounts": [
            {
              "name": "payer",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "wumbo",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "tokenBonding",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "baseRoyalties",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "targetRoyalties",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "targetMint",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "tokenMetadata",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "systemProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "rent",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "clock",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reverseTokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "InitializeSocialTokenV0Args"
          }
        }
      ]
    },
    {
      "name": "initializeUnclaimedSocialTokenV0",
      "accounts": [
        {
          "name": "initializeArgs",
          "accounts": [
            {
              "name": "payer",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "wumbo",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "tokenBonding",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "baseRoyalties",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "targetRoyalties",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "targetMint",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "tokenMetadata",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "systemProgram",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "rent",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "clock",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reverseTokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "name",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "InitializeSocialTokenV0Args"
          }
        }
      ]
    },
    {
      "name": "claimSocialTokenV0",
      "accounts": [
        {
          "name": "wumbo",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newTokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reverseTokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBonding",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBondingAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "targetRoyaltiesOwner",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "name",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "newTargetRoyalties",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "targetRoyalties",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBondingProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenRefBumpSeed",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateTokenMetadata",
      "accounts": [
        {
          "name": "reverseTokenRef",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "updateAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "UpdateMetadataAccountArgs"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "WumboV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "curve",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "tokenMetadataDefaults",
            "type": {
              "defined": "TokenMetadataDefaults"
            }
          },
          {
            "name": "tokenBondingDefaults",
            "type": {
              "defined": "TokenBondingDefaults"
            }
          },
          {
            "name": "tokenStakingDefaults",
            "type": {
              "defined": "TokenStakingDefaults"
            }
          },
          {
            "name": "bumpSeed",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "TokenRefV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wumbo",
            "type": "publicKey"
          },
          {
            "name": "tokenMetadata",
            "type": "publicKey"
          },
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "tokenBonding",
            "type": "publicKey"
          },
          {
            "name": "tokenStaking",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "name",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "owner",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "isClaimed",
            "type": "bool"
          },
          {
            "name": "bumpSeed",
            "type": "u8"
          },
          {
            "name": "tokenBondingAuthorityBumpSeed",
            "type": "u8"
          },
          {
            "name": "targetRoyaltiesOwnerBumpSeed",
            "type": "u8"
          },
          {
            "name": "tokenMetadataUpdateAuthorityBumpSeed",
            "type": "u8"
          },
          {
            "name": "stakingAuthorityBumpSeed",
            "type": {
              "option": "u8"
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "UpdateMetadataAccountArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "InitializeWumboArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bumpSeed",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "tokenMetadataDefaults",
            "type": {
              "defined": "TokenMetadataDefaults"
            }
          },
          {
            "name": "tokenBondingDefaults",
            "type": {
              "defined": "TokenBondingDefaults"
            }
          },
          {
            "name": "tokenStakingDefaults",
            "type": {
              "defined": "TokenStakingDefaults"
            }
          }
        ]
      }
    },
    {
      "name": "TokenMetadataDefaults",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "TokenBondingDefaults",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "curve",
            "type": "publicKey"
          },
          {
            "name": "baseRoyaltyPercentage",
            "type": "u32"
          },
          {
            "name": "targetRoyaltyPercentage",
            "type": "u32"
          },
          {
            "name": "targetMintDecimals",
            "type": "u8"
          },
          {
            "name": "buyFrozen",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "TokenStakingDefaults",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "periodUnit",
            "type": {
              "defined": "PeriodUnit"
            }
          },
          {
            "name": "period",
            "type": "u32"
          },
          {
            "name": "targetMintDecimals",
            "type": "u8"
          },
          {
            "name": "rewardPercentPerPeriodPerLockupPeriod",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "InitializeSocialTokenV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nameParent",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "nameClass",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "wumboBumpSeed",
            "type": "u8"
          },
          {
            "name": "tokenBondingAuthorityBumpSeed",
            "type": "u8"
          },
          {
            "name": "targetRoyaltiesOwnerBumpSeed",
            "type": "u8"
          },
          {
            "name": "baseRoyaltiesOwnerBumpSeed",
            "type": "u8"
          },
          {
            "name": "tokenRefBumpSeed",
            "type": "u8"
          },
          {
            "name": "reverseTokenRefBumpSeed",
            "type": "u8"
          },
          {
            "name": "tokenMetadataUpdateAuthorityBumpSeed",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "PeriodUnit",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "SECOND"
          },
          {
            "name": "MINUTE"
          },
          {
            "name": "HOUR"
          },
          {
            "name": "DAY"
          },
          {
            "name": "YEAR"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 300,
      "name": "NoAuthority",
      "msg": "Provided account does not have an authority"
    },
    {
      "code": 301,
      "name": "NoStakingAuthority",
      "msg": "Token bonding does not have an authority"
    },
    {
      "code": 302,
      "name": "InvalidNameProgramId",
      "msg": "Name program id did not match expected for this wumbo instance"
    },
    {
      "code": 303,
      "name": "IncorrectOwner",
      "msg": "Account does not have correct owner!"
    },
    {
      "code": 304,
      "name": "InvalidBump",
      "msg": "The bump provided did not match the canonical bump"
    },
    {
      "code": 305,
      "name": "InvalidAuthority",
      "msg": "Invalid authority passed"
    },
    {
      "code": 306,
      "name": "InvalidNameOwner",
      "msg": "The provided name owner is not the owner of the name record"
    }
  ]
};
export type SplWumboIDL = {"version":"0.0.0","name":"spl_wumbo","instructions":[{"name":"initializeWumbo","accounts":[{"name":"wumbo","isMut":true,"isSigner":false},{"name":"mint","isMut":false,"isSigner":false},{"name":"curve","isMut":false,"isSigner":false},{"name":"payer","isMut":true,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeWumboArgs"}}]},{"name":"initializeOwnedSocialTokenV0","accounts":[{"name":"initializeArgs","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"wumbo","isMut":false,"isSigner":false},{"name":"tokenBonding","isMut":false,"isSigner":false},{"name":"baseRoyalties","isMut":false,"isSigner":false},{"name":"targetRoyalties","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"tokenMetadata","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}]},{"name":"payer","isMut":true,"isSigner":true},{"name":"tokenRef","isMut":true,"isSigner":false},{"name":"reverseTokenRef","isMut":true,"isSigner":false},{"name":"owner","isMut":false,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeSocialTokenV0Args"}}]},{"name":"initializeUnclaimedSocialTokenV0","accounts":[{"name":"initializeArgs","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"wumbo","isMut":false,"isSigner":false},{"name":"tokenBonding","isMut":false,"isSigner":false},{"name":"baseRoyalties","isMut":false,"isSigner":false},{"name":"targetRoyalties","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"tokenMetadata","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}]},{"name":"payer","isMut":true,"isSigner":true},{"name":"tokenRef","isMut":true,"isSigner":false},{"name":"reverseTokenRef","isMut":true,"isSigner":false},{"name":"name","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeSocialTokenV0Args"}}]},{"name":"claimSocialTokenV0","accounts":[{"name":"wumbo","isMut":false,"isSigner":false},{"name":"tokenRef","isMut":true,"isSigner":false},{"name":"newTokenRef","isMut":true,"isSigner":false},{"name":"reverseTokenRef","isMut":true,"isSigner":false},{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"tokenBondingAuthority","isMut":false,"isSigner":false},{"name":"targetRoyaltiesOwner","isMut":false,"isSigner":false},{"name":"name","isMut":false,"isSigner":false},{"name":"owner","isMut":false,"isSigner":true},{"name":"newTargetRoyalties","isMut":true,"isSigner":false},{"name":"targetRoyalties","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"tokenBondingProgram","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"tokenRefBumpSeed","type":"u8"}]},{"name":"updateTokenMetadata","accounts":[{"name":"reverseTokenRef","isMut":false,"isSigner":false},{"name":"owner","isMut":false,"isSigner":true},{"name":"tokenMetadata","isMut":true,"isSigner":false},{"name":"updateAuthority","isMut":false,"isSigner":false},{"name":"tokenMetadataProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"UpdateMetadataAccountArgs"}}]}],"accounts":[{"name":"wumboV0","type":{"kind":"struct","fields":[{"name":"mint","type":"publicKey"},{"name":"curve","type":"publicKey"},{"name":"authority","type":{"option":"publicKey"}},{"name":"tokenMetadataDefaults","type":{"defined":"TokenMetadataDefaults"}},{"name":"tokenBondingDefaults","type":{"defined":"TokenBondingDefaults"}},{"name":"tokenStakingDefaults","type":{"defined":"TokenStakingDefaults"}},{"name":"bumpSeed","type":"u8"}]}},{"name":"tokenRefV0","type":{"kind":"struct","fields":[{"name":"wumbo","type":"publicKey"},{"name":"tokenMetadata","type":"publicKey"},{"name":"mint","type":"publicKey"},{"name":"tokenBonding","type":"publicKey"},{"name":"tokenStaking","type":{"option":"publicKey"}},{"name":"name","type":{"option":"publicKey"}},{"name":"owner","type":{"option":"publicKey"}},{"name":"isClaimed","type":"bool"},{"name":"bumpSeed","type":"u8"},{"name":"tokenBondingAuthorityBumpSeed","type":"u8"},{"name":"targetRoyaltiesOwnerBumpSeed","type":"u8"},{"name":"tokenMetadataUpdateAuthorityBumpSeed","type":"u8"},{"name":"stakingAuthorityBumpSeed","type":{"option":"u8"}}]}}],"types":[{"name":"UpdateMetadataAccountArgs","type":{"kind":"struct","fields":[{"name":"name","type":"string"},{"name":"symbol","type":"string"},{"name":"uri","type":"string"}]}},{"name":"InitializeWumboArgs","type":{"kind":"struct","fields":[{"name":"bumpSeed","type":"u8"},{"name":"authority","type":{"option":"publicKey"}},{"name":"tokenMetadataDefaults","type":{"defined":"TokenMetadataDefaults"}},{"name":"tokenBondingDefaults","type":{"defined":"TokenBondingDefaults"}},{"name":"tokenStakingDefaults","type":{"defined":"TokenStakingDefaults"}}]}},{"name":"TokenMetadataDefaults","type":{"kind":"struct","fields":[{"name":"symbol","type":"string"},{"name":"uri","type":"string"}]}},{"name":"TokenBondingDefaults","type":{"kind":"struct","fields":[{"name":"curve","type":"publicKey"},{"name":"baseRoyaltyPercentage","type":"u32"},{"name":"targetRoyaltyPercentage","type":"u32"},{"name":"targetMintDecimals","type":"u8"},{"name":"buyFrozen","type":"bool"}]}},{"name":"TokenStakingDefaults","type":{"kind":"struct","fields":[{"name":"periodUnit","type":{"defined":"PeriodUnit"}},{"name":"period","type":"u32"},{"name":"targetMintDecimals","type":"u8"},{"name":"rewardPercentPerPeriodPerLockupPeriod","type":"u32"}]}},{"name":"InitializeSocialTokenV0Args","type":{"kind":"struct","fields":[{"name":"nameParent","type":{"option":"publicKey"}},{"name":"nameClass","type":{"option":"publicKey"}},{"name":"wumboBumpSeed","type":"u8"},{"name":"tokenBondingAuthorityBumpSeed","type":"u8"},{"name":"targetRoyaltiesOwnerBumpSeed","type":"u8"},{"name":"baseRoyaltiesOwnerBumpSeed","type":"u8"},{"name":"tokenRefBumpSeed","type":"u8"},{"name":"reverseTokenRefBumpSeed","type":"u8"},{"name":"tokenMetadataUpdateAuthorityBumpSeed","type":"u8"}]}},{"name":"PeriodUnit","type":{"kind":"enum","variants":[{"name":"SECOND"},{"name":"MINUTE"},{"name":"HOUR"},{"name":"DAY"},{"name":"YEAR"}]}}],"errors":[{"code":300,"name":"NoAuthority","msg":"Provided account does not have an authority"},{"code":301,"name":"NoStakingAuthority","msg":"Token bonding does not have an authority"},{"code":302,"name":"InvalidNameProgramId","msg":"Name program id did not match expected for this wumbo instance"},{"code":303,"name":"IncorrectOwner","msg":"Account does not have correct owner!"},{"code":304,"name":"InvalidBump","msg":"The bump provided did not match the canonical bump"},{"code":305,"name":"InvalidAuthority","msg":"Invalid authority passed"},{"code":306,"name":"InvalidNameOwner","msg":"The provided name owner is not the owner of the name record"}]};

export type PeriodUnit = Record<string, Record<string, any>>
export const PeriodUnit = {
  SECOND: { second: {} },
  MINUTE: { minute: {} },
  HOUR: { hour: {} },
  DAY: { day: {} },
  YEAR: { year: {} }
}
    

  

export type WumboV0 = IdlAccounts<SplWumboIDL>["wumboV0"]

export type TokenRefV0 = IdlAccounts<SplWumboIDL>["tokenRefV0"]
  
          