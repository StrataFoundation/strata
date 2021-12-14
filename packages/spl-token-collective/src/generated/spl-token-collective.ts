import { IdlAccounts, Idl } from '@project-serum/anchor';
export const SplTokenCollectiveIDLJson: Idl & { metadata?: { address: string } } = {
  "version": "0.0.0",
  "name": "spl_token_collective",
  "instructions": [
    {
      "name": "initializeCollectiveV0",
      "accounts": [
        {
          "name": "collective",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintAuthority",
          "isMut": false,
          "isSigner": true
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
            "defined": "InitializeCollectiveV0Args"
          }
        }
      ]
    },
    {
      "name": "updateCollectiveV0",
      "accounts": [
        {
          "name": "collective",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "UpdateCollectiveV0Args"
          }
        }
      ]
    },
    {
      "name": "setAsPrimaryV0",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenRef",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "primaryTokenRef",
          "isMut": true,
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
            "defined": "SetAsPrimaryV0Args"
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
              "name": "authority",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "payer",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "collective",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "tokenBonding",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "tokenMetadata",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "baseMint",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "targetMint",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "buyBaseRoyalties",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "buyTargetRoyalties",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "sellBaseRoyalties",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "sellTargetRoyalties",
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
          "name": "ownerTokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTokenRef",
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
              "name": "authority",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "payer",
              "isMut": true,
              "isSigner": true
            },
            {
              "name": "collective",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "tokenBonding",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "tokenMetadata",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "baseMint",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "targetMint",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "buyBaseRoyalties",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "buyTargetRoyalties",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "sellBaseRoyalties",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "sellTargetRoyalties",
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
          "name": "ownerTokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMetadata",
          "isMut": false,
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
          "name": "payer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "collective",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ownerTokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newTokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBonding",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenMetadata",
          "isMut": true,
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
          "name": "baseMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "targetMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "buyBaseRoyalties",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyTargetRoyalties",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellBaseRoyalties",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellTargetRoyalties",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newBuyBaseRoyalties",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newBuyTargetRoyalties",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newSellBaseRoyalties",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newSellTargetRoyalties",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBondingProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
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
            "defined": "ClaimSocialTokenV0Args"
          }
        }
      ]
    },
    {
      "name": "updateTokenBondingV0",
      "accounts": [
        {
          "name": "collective",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintTokenRef",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBonding",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenRefAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "tokenBondingProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "baseMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "targetMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "buyBaseRoyalties",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "buyTargetRoyalties",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sellBaseRoyalties",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sellTargetRoyalties",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "UpdateTokenBondingV0ArgsWrapper"
          }
        }
      ]
    },
    {
      "name": "changeOptStatusUnclaimedV0",
      "accounts": [
        {
          "name": "ownerTokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "name",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBondingUpdateAccounts",
          "accounts": [
            {
              "name": "tokenBonding",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "baseMint",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "targetMint",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "buyBaseRoyalties",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "buyTargetRoyalties",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "sellBaseRoyalties",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "sellTargetRoyalties",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "tokenBondingProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "ChangeOptStatusUnclaimedV0Args"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "CollectiveV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "config",
            "type": {
              "defined": "CollectiveConfigV0"
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
            "name": "collective",
            "type": {
              "option": "publicKey"
            }
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
            "name": "authority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "isClaimed",
            "type": "bool"
          },
          {
            "name": "isPrimary",
            "type": "bool"
          },
          {
            "name": "bumpSeed",
            "type": "u8"
          },
          {
            "name": "targetRoyaltiesOwnerBumpSeed",
            "type": "u8"
          },
          {
            "name": "isOptedOut",
            "type": "bool"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "ClaimSocialTokenV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isPrimary",
            "type": "bool"
          },
          {
            "name": "authority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "ownerTokenRefBumpSeed",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "InitializeCollectiveV0Args",
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
            "name": "config",
            "type": {
              "defined": "CollectiveConfigV0"
            }
          }
        ]
      }
    },
    {
      "name": "UpdateCollectiveV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "config",
            "type": {
              "defined": "CollectiveConfigV0"
            }
          }
        ]
      }
    },
    {
      "name": "CollectiveConfigV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isOpen",
            "type": "bool"
          },
          {
            "name": "unclaimedTokenMetadataSettings",
            "type": {
              "option": {
                "defined": "TokenMetadataSettingsV0"
              }
            }
          },
          {
            "name": "unclaimedTokenBondingSettings",
            "type": {
              "option": {
                "defined": "TokenBondingSettingsV0"
              }
            }
          },
          {
            "name": "claimedTokenBondingSettings",
            "type": {
              "option": {
                "defined": "TokenBondingSettingsV0"
              }
            }
          }
        ]
      }
    },
    {
      "name": "TokenMetadataSettingsV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "symbol",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "uri",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "nameIsNameServiceName",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "RoyaltySettingV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "ownedByName",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "TokenBondingSettingsV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "curve",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "minSellBaseRoyaltyPercentage",
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "minSellTargetRoyaltyPercentage",
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "maxSellBaseRoyaltyPercentage",
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "maxSellTargetRoyaltyPercentage",
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "minBuyBaseRoyaltyPercentage",
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "minBuyTargetRoyaltyPercentage",
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "maxBuyBaseRoyaltyPercentage",
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "maxBuyTargetRoyaltyPercentage",
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "targetMintDecimals",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "buyBaseRoyalties",
            "type": {
              "defined": "RoyaltySettingV0"
            }
          },
          {
            "name": "sellBaseRoyalties",
            "type": {
              "defined": "RoyaltySettingV0"
            }
          },
          {
            "name": "buyTargetRoyalties",
            "type": {
              "defined": "RoyaltySettingV0"
            }
          },
          {
            "name": "sellTargetRoyalties",
            "type": {
              "defined": "RoyaltySettingV0"
            }
          },
          {
            "name": "minPurchaseCap",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "maxPurchaseCap",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "minMintCap",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "maxMintCap",
            "type": {
              "option": "u64"
            }
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
            "name": "authority",
            "type": {
              "option": "publicKey"
            }
          },
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
            "name": "collectiveBumpSeed",
            "type": "u8"
          },
          {
            "name": "ownerTokenRefBumpSeed",
            "type": "u8"
          },
          {
            "name": "mintTokenRefBumpSeed",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UpdateTokenBondingV0ArgsWrapper",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenBondingAuthority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "buyBaseRoyaltyPercentage",
            "type": "u32"
          },
          {
            "name": "buyTargetRoyaltyPercentage",
            "type": "u32"
          },
          {
            "name": "sellBaseRoyaltyPercentage",
            "type": "u32"
          },
          {
            "name": "sellTargetRoyaltyPercentage",
            "type": "u32"
          },
          {
            "name": "buyFrozen",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "SetAsPrimaryV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bumpSeed",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "ChangeOptStatusUnclaimedV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "hashedName",
            "type": "bytes"
          },
          {
            "name": "isOptedOut",
            "type": "bool"
          }
        ]
      }
    },
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
      "name": "InvalidBump",
      "msg": "The bump provided did not match the canonical bump"
    },
    {
      "code": 302,
      "name": "InvalidAuthority",
      "msg": "Invalid authority passed"
    },
    {
      "code": 303,
      "name": "InvalidTokenBondingSettings",
      "msg": "Bonding curve had invalid settings to join this collective"
    },
    {
      "code": 304,
      "name": "InvalidTokenBondingRoyalties",
      "msg": "Bonding curve had invalid royalties accounts to join this collective"
    },
    {
      "code": 305,
      "name": "InvalidTokenMetadataSettings",
      "msg": "Unclaimed token had invalid metadata settings to join this collective"
    },
    {
      "code": 306,
      "name": "IncorrectOwner",
      "msg": "Incorrect owner on account"
    },
    {
      "code": 307,
      "name": "NoBonding",
      "msg": "Token is not on a bonding curve"
    },
    {
      "code": 308,
      "name": "InvalidCollective",
      "msg": "Invalid collective"
    },
    {
      "code": 309,
      "name": "InvalidNameAuthority",
      "msg": "Invalid name authority passed"
    },
    {
      "code": 310,
      "name": "UnclaimedNotLive",
      "msg": "Unclaimed tokens cannot have a go live date in the future. They must be immediately live."
    }
  ]
};
export type SplTokenCollectiveIDL = {"version":"0.0.0","name":"spl_token_collective","instructions":[{"name":"initializeCollectiveV0","accounts":[{"name":"collective","isMut":true,"isSigner":false},{"name":"mint","isMut":false,"isSigner":false},{"name":"mintAuthority","isMut":false,"isSigner":true},{"name":"payer","isMut":true,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeCollectiveV0Args"}}]},{"name":"updateCollectiveV0","accounts":[{"name":"collective","isMut":true,"isSigner":false},{"name":"authority","isMut":false,"isSigner":true}],"args":[{"name":"args","type":{"defined":"UpdateCollectiveV0Args"}}]},{"name":"setAsPrimaryV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"owner","isMut":false,"isSigner":true},{"name":"tokenRef","isMut":false,"isSigner":false},{"name":"primaryTokenRef","isMut":true,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"SetAsPrimaryV0Args"}}]},{"name":"initializeOwnedSocialTokenV0","accounts":[{"name":"initializeArgs","accounts":[{"name":"authority","isMut":false,"isSigner":false},{"name":"payer","isMut":true,"isSigner":true},{"name":"collective","isMut":false,"isSigner":false},{"name":"tokenBonding","isMut":false,"isSigner":false},{"name":"tokenMetadata","isMut":false,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"buyBaseRoyalties","isMut":false,"isSigner":false},{"name":"buyTargetRoyalties","isMut":false,"isSigner":false},{"name":"sellBaseRoyalties","isMut":false,"isSigner":false},{"name":"sellTargetRoyalties","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}]},{"name":"payer","isMut":true,"isSigner":true},{"name":"ownerTokenRef","isMut":true,"isSigner":false},{"name":"mintTokenRef","isMut":true,"isSigner":false},{"name":"owner","isMut":false,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeSocialTokenV0Args"}}]},{"name":"initializeUnclaimedSocialTokenV0","accounts":[{"name":"initializeArgs","accounts":[{"name":"authority","isMut":false,"isSigner":false},{"name":"payer","isMut":true,"isSigner":true},{"name":"collective","isMut":false,"isSigner":false},{"name":"tokenBonding","isMut":false,"isSigner":false},{"name":"tokenMetadata","isMut":false,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"buyBaseRoyalties","isMut":false,"isSigner":false},{"name":"buyTargetRoyalties","isMut":false,"isSigner":false},{"name":"sellBaseRoyalties","isMut":false,"isSigner":false},{"name":"sellTargetRoyalties","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}]},{"name":"payer","isMut":true,"isSigner":true},{"name":"ownerTokenRef","isMut":true,"isSigner":false},{"name":"mintTokenRef","isMut":true,"isSigner":false},{"name":"tokenMetadata","isMut":false,"isSigner":false},{"name":"name","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeSocialTokenV0Args"}}]},{"name":"claimSocialTokenV0","accounts":[{"name":"payer","isMut":false,"isSigner":true},{"name":"collective","isMut":false,"isSigner":false},{"name":"ownerTokenRef","isMut":true,"isSigner":false},{"name":"newTokenRef","isMut":true,"isSigner":false},{"name":"mintTokenRef","isMut":true,"isSigner":false},{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"tokenMetadata","isMut":true,"isSigner":false},{"name":"name","isMut":false,"isSigner":false},{"name":"owner","isMut":false,"isSigner":true},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"buyBaseRoyalties","isMut":true,"isSigner":false},{"name":"buyTargetRoyalties","isMut":true,"isSigner":false},{"name":"sellBaseRoyalties","isMut":true,"isSigner":false},{"name":"sellTargetRoyalties","isMut":true,"isSigner":false},{"name":"newBuyBaseRoyalties","isMut":true,"isSigner":false},{"name":"newBuyTargetRoyalties","isMut":true,"isSigner":false},{"name":"newSellBaseRoyalties","isMut":true,"isSigner":false},{"name":"newSellTargetRoyalties","isMut":true,"isSigner":false},{"name":"tokenBondingProgram","isMut":false,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"tokenMetadataProgram","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"ClaimSocialTokenV0Args"}}]},{"name":"updateTokenBondingV0","accounts":[{"name":"collective","isMut":false,"isSigner":false},{"name":"authority","isMut":false,"isSigner":false},{"name":"mintTokenRef","isMut":false,"isSigner":false},{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"tokenRefAuthority","isMut":false,"isSigner":true},{"name":"tokenBondingProgram","isMut":false,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"buyBaseRoyalties","isMut":false,"isSigner":false},{"name":"buyTargetRoyalties","isMut":false,"isSigner":false},{"name":"sellBaseRoyalties","isMut":false,"isSigner":false},{"name":"sellTargetRoyalties","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"UpdateTokenBondingV0ArgsWrapper"}}]},{"name":"changeOptStatusUnclaimedV0","accounts":[{"name":"ownerTokenRef","isMut":true,"isSigner":false},{"name":"mintTokenRef","isMut":true,"isSigner":false},{"name":"name","isMut":false,"isSigner":false},{"name":"tokenBondingUpdateAccounts","accounts":[{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"buyBaseRoyalties","isMut":false,"isSigner":false},{"name":"buyTargetRoyalties","isMut":false,"isSigner":false},{"name":"sellBaseRoyalties","isMut":false,"isSigner":false},{"name":"sellTargetRoyalties","isMut":false,"isSigner":false}]},{"name":"tokenBondingProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"ChangeOptStatusUnclaimedV0Args"}}]}],"accounts":[{"name":"collectiveV0","type":{"kind":"struct","fields":[{"name":"mint","type":"publicKey"},{"name":"authority","type":{"option":"publicKey"}},{"name":"config","type":{"defined":"CollectiveConfigV0"}},{"name":"bumpSeed","type":"u8"}]}},{"name":"tokenRefV0","type":{"kind":"struct","fields":[{"name":"collective","type":{"option":"publicKey"}},{"name":"tokenMetadata","type":"publicKey"},{"name":"mint","type":"publicKey"},{"name":"tokenBonding","type":{"option":"publicKey"}},{"name":"name","type":{"option":"publicKey"}},{"name":"owner","type":{"option":"publicKey"}},{"name":"authority","type":{"option":"publicKey"}},{"name":"isClaimed","type":"bool"},{"name":"isPrimary","type":"bool"},{"name":"bumpSeed","type":"u8"},{"name":"targetRoyaltiesOwnerBumpSeed","type":"u8"},{"name":"isOptedOut","type":"bool"}]}}],"types":[{"name":"ClaimSocialTokenV0Args","type":{"kind":"struct","fields":[{"name":"isPrimary","type":"bool"},{"name":"authority","type":{"option":"publicKey"}},{"name":"ownerTokenRefBumpSeed","type":"u8"}]}},{"name":"InitializeCollectiveV0Args","type":{"kind":"struct","fields":[{"name":"bumpSeed","type":"u8"},{"name":"authority","type":{"option":"publicKey"}},{"name":"config","type":{"defined":"CollectiveConfigV0"}}]}},{"name":"UpdateCollectiveV0Args","type":{"kind":"struct","fields":[{"name":"authority","type":{"option":"publicKey"}},{"name":"config","type":{"defined":"CollectiveConfigV0"}}]}},{"name":"CollectiveConfigV0","type":{"kind":"struct","fields":[{"name":"isOpen","type":"bool"},{"name":"unclaimedTokenMetadataSettings","type":{"option":{"defined":"TokenMetadataSettingsV0"}}},{"name":"unclaimedTokenBondingSettings","type":{"option":{"defined":"TokenBondingSettingsV0"}}},{"name":"claimedTokenBondingSettings","type":{"option":{"defined":"TokenBondingSettingsV0"}}}]}},{"name":"TokenMetadataSettingsV0","type":{"kind":"struct","fields":[{"name":"symbol","type":{"option":"string"}},{"name":"uri","type":{"option":"string"}},{"name":"nameIsNameServiceName","type":"bool"}]}},{"name":"RoyaltySettingV0","type":{"kind":"struct","fields":[{"name":"address","type":{"option":"publicKey"}},{"name":"ownedByName","type":"bool"}]}},{"name":"TokenBondingSettingsV0","type":{"kind":"struct","fields":[{"name":"curve","type":{"option":"publicKey"}},{"name":"minSellBaseRoyaltyPercentage","type":{"option":"u32"}},{"name":"minSellTargetRoyaltyPercentage","type":{"option":"u32"}},{"name":"maxSellBaseRoyaltyPercentage","type":{"option":"u32"}},{"name":"maxSellTargetRoyaltyPercentage","type":{"option":"u32"}},{"name":"minBuyBaseRoyaltyPercentage","type":{"option":"u32"}},{"name":"minBuyTargetRoyaltyPercentage","type":{"option":"u32"}},{"name":"maxBuyBaseRoyaltyPercentage","type":{"option":"u32"}},{"name":"maxBuyTargetRoyaltyPercentage","type":{"option":"u32"}},{"name":"targetMintDecimals","type":{"option":"u8"}},{"name":"buyBaseRoyalties","type":{"defined":"RoyaltySettingV0"}},{"name":"sellBaseRoyalties","type":{"defined":"RoyaltySettingV0"}},{"name":"buyTargetRoyalties","type":{"defined":"RoyaltySettingV0"}},{"name":"sellTargetRoyalties","type":{"defined":"RoyaltySettingV0"}},{"name":"minPurchaseCap","type":{"option":"u64"}},{"name":"maxPurchaseCap","type":{"option":"u64"}},{"name":"minMintCap","type":{"option":"u64"}},{"name":"maxMintCap","type":{"option":"u64"}}]}},{"name":"InitializeSocialTokenV0Args","type":{"kind":"struct","fields":[{"name":"authority","type":{"option":"publicKey"}},{"name":"nameParent","type":{"option":"publicKey"}},{"name":"nameClass","type":{"option":"publicKey"}},{"name":"collectiveBumpSeed","type":"u8"},{"name":"ownerTokenRefBumpSeed","type":"u8"},{"name":"mintTokenRefBumpSeed","type":"u8"}]}},{"name":"UpdateTokenBondingV0ArgsWrapper","type":{"kind":"struct","fields":[{"name":"tokenBondingAuthority","type":{"option":"publicKey"}},{"name":"buyBaseRoyaltyPercentage","type":"u32"},{"name":"buyTargetRoyaltyPercentage","type":"u32"},{"name":"sellBaseRoyaltyPercentage","type":"u32"},{"name":"sellTargetRoyaltyPercentage","type":"u32"},{"name":"buyFrozen","type":"bool"}]}},{"name":"SetAsPrimaryV0Args","type":{"kind":"struct","fields":[{"name":"bumpSeed","type":"u8"}]}},{"name":"ChangeOptStatusUnclaimedV0Args","type":{"kind":"struct","fields":[{"name":"hashedName","type":"bytes"},{"name":"isOptedOut","type":"bool"}]}},{"name":"UpdateMetadataAccountArgs","type":{"kind":"struct","fields":[{"name":"name","type":"string"},{"name":"symbol","type":"string"},{"name":"uri","type":"string"}]}}],"errors":[{"code":300,"name":"NoAuthority","msg":"Provided account does not have an authority"},{"code":301,"name":"InvalidBump","msg":"The bump provided did not match the canonical bump"},{"code":302,"name":"InvalidAuthority","msg":"Invalid authority passed"},{"code":303,"name":"InvalidTokenBondingSettings","msg":"Bonding curve had invalid settings to join this collective"},{"code":304,"name":"InvalidTokenBondingRoyalties","msg":"Bonding curve had invalid royalties accounts to join this collective"},{"code":305,"name":"InvalidTokenMetadataSettings","msg":"Unclaimed token had invalid metadata settings to join this collective"},{"code":306,"name":"IncorrectOwner","msg":"Incorrect owner on account"},{"code":307,"name":"NoBonding","msg":"Token is not on a bonding curve"},{"code":308,"name":"InvalidCollective","msg":"Invalid collective"},{"code":309,"name":"InvalidNameAuthority","msg":"Invalid name authority passed"},{"code":310,"name":"UnclaimedNotLive","msg":"Unclaimed tokens cannot have a go live date in the future. They must be immediately live."}]};



  

export type CollectiveV0 = IdlAccounts<SplTokenCollectiveIDL>["collectiveV0"]

export type TokenRefV0 = IdlAccounts<SplTokenCollectiveIDL>["tokenRefV0"]
  
          