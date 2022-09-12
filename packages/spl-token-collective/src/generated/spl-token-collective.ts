import { IdlAccounts, Idl } from '@project-serum/anchor';
export const SplTokenCollectiveIDLJson: Idl & { metadata?: { address: string } } = {
  "version": "3.9.2",
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
      "name": "initializeCollectiveForSocialTokenV0",
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
          "name": "tokenRef",
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
            "defined": "InitializeCollectiveForSocialTokenV0Args"
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
          "isMut": true,
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
          "isMut": true,
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
      "name": "updateCurveV0",
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
          "name": "curve",
          "isMut": false,
          "isSigner": false
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
        }
      ],
      "args": []
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
    },
    {
      "name": "changeOptStatusClaimedV0",
      "accounts": [
        {
          "name": "ownerTokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "primaryTokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "mintTokenRef",
          "isMut": true,
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
            "defined": "ChangeOptStatusClaimedV0Args"
          }
        }
      ]
    },
    {
      "name": "updateOwnerV0",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "newOwner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "baseMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "oldOwnerTokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newOwnerTokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "oldPrimaryTokenRef",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newPrimaryTokenRef",
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
            "defined": "UpdateOwnerV0Args"
          }
        }
      ]
    },
    {
      "name": "updateAuthorityV0",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "baseMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
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
          "name": "primaryTokenRef",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "UpdateAuthorityV0Args"
          }
        }
      ]
    },
    {
      "name": "claimBondingAuthorityV0",
      "accounts": [
        {
          "name": "mintTokenRef",
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
      "args": []
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
      "name": "InitializeCollectiveForSocialTokenV0Args",
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
      "name": "UpdateOwnerV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "ownerTokenRefBumpSeed",
            "type": "u8"
          },
          {
            "name": "primaryTokenRefBumpSeed",
            "type": "u8"
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
      "name": "UpdateCurveV0ArgsWrapper",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "curveAuthority",
            "type": {
              "option": "publicKey"
            }
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
      "name": "ChangeOptStatusClaimedV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isOptedOut",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "UpdateAuthorityV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "newAuthority",
            "type": "publicKey"
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
      "code": 6000,
      "name": "NoAuthority",
      "msg": "Provided account does not have an authority"
    },
    {
      "code": 6001,
      "name": "InvalidBump",
      "msg": "The bump provided did not match the canonical bump"
    },
    {
      "code": 6002,
      "name": "InvalidAuthority",
      "msg": "Invalid authority passed"
    },
    {
      "code": 6003,
      "name": "InvalidTokenBondingSettings",
      "msg": "Bonding curve had invalid settings to join this collective"
    },
    {
      "code": 6004,
      "name": "InvalidTokenBondingRoyalties",
      "msg": "Bonding curve had invalid royalties accounts to join this collective"
    },
    {
      "code": 6005,
      "name": "InvalidTokenMetadataSettings",
      "msg": "Unclaimed token had invalid metadata settings to join this collective"
    },
    {
      "code": 6006,
      "name": "IncorrectOwner",
      "msg": "Incorrect owner on account"
    },
    {
      "code": 6007,
      "name": "NoBonding",
      "msg": "Token is not on a bonding curve"
    },
    {
      "code": 6008,
      "name": "InvalidCollective",
      "msg": "Invalid collective"
    },
    {
      "code": 6009,
      "name": "InvalidNameAuthority",
      "msg": "Invalid name authority passed"
    },
    {
      "code": 6010,
      "name": "UnclaimedNotLive",
      "msg": "Unclaimed tokens cannot have a go live date in the future. They must be immediately live."
    },
    {
      "code": 6011,
      "name": "InvalidGoLive",
      "msg": "Invalid go live date for prelaunch"
    },
    {
      "code": 6012,
      "name": "AccountDiscriminatorMismatch",
      "msg": "Account discriminator mismatch"
    }
  ],
  "metadata": {
    "address": "TCo1sfSr2nCudbeJPykbif64rG9K1JNMGzrtzvPmp3y"
  }
};
export type SplTokenCollectiveIDL = {"version":"3.9.2","name":"spl_token_collective","instructions":[{"name":"initializeCollectiveV0","accounts":[{"name":"collective","isMut":true,"isSigner":false},{"name":"mint","isMut":false,"isSigner":false},{"name":"mintAuthority","isMut":false,"isSigner":true},{"name":"payer","isMut":true,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeCollectiveV0Args"}}]},{"name":"initializeCollectiveForSocialTokenV0","accounts":[{"name":"collective","isMut":true,"isSigner":false},{"name":"mint","isMut":false,"isSigner":false},{"name":"tokenRef","isMut":false,"isSigner":false},{"name":"payer","isMut":true,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeCollectiveForSocialTokenV0Args"}}]},{"name":"updateCollectiveV0","accounts":[{"name":"collective","isMut":true,"isSigner":false},{"name":"authority","isMut":false,"isSigner":true}],"args":[{"name":"args","type":{"defined":"UpdateCollectiveV0Args"}}]},{"name":"setAsPrimaryV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"owner","isMut":false,"isSigner":true},{"name":"tokenRef","isMut":false,"isSigner":false},{"name":"primaryTokenRef","isMut":true,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"SetAsPrimaryV0Args"}}]},{"name":"initializeOwnedSocialTokenV0","accounts":[{"name":"initializeArgs","accounts":[{"name":"authority","isMut":false,"isSigner":false},{"name":"payer","isMut":true,"isSigner":true},{"name":"collective","isMut":false,"isSigner":false},{"name":"tokenBonding","isMut":false,"isSigner":false},{"name":"tokenMetadata","isMut":false,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"buyBaseRoyalties","isMut":false,"isSigner":false},{"name":"buyTargetRoyalties","isMut":false,"isSigner":false},{"name":"sellBaseRoyalties","isMut":false,"isSigner":false},{"name":"sellTargetRoyalties","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}]},{"name":"payer","isMut":true,"isSigner":true},{"name":"ownerTokenRef","isMut":true,"isSigner":false},{"name":"mintTokenRef","isMut":true,"isSigner":false},{"name":"owner","isMut":false,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeSocialTokenV0Args"}}]},{"name":"initializeUnclaimedSocialTokenV0","accounts":[{"name":"initializeArgs","accounts":[{"name":"authority","isMut":false,"isSigner":false},{"name":"payer","isMut":true,"isSigner":true},{"name":"collective","isMut":false,"isSigner":false},{"name":"tokenBonding","isMut":false,"isSigner":false},{"name":"tokenMetadata","isMut":false,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"buyBaseRoyalties","isMut":false,"isSigner":false},{"name":"buyTargetRoyalties","isMut":false,"isSigner":false},{"name":"sellBaseRoyalties","isMut":false,"isSigner":false},{"name":"sellTargetRoyalties","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}]},{"name":"payer","isMut":true,"isSigner":true},{"name":"ownerTokenRef","isMut":true,"isSigner":false},{"name":"mintTokenRef","isMut":true,"isSigner":false},{"name":"tokenMetadata","isMut":false,"isSigner":false},{"name":"name","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeSocialTokenV0Args"}}]},{"name":"claimSocialTokenV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"collective","isMut":false,"isSigner":false},{"name":"ownerTokenRef","isMut":true,"isSigner":false},{"name":"newTokenRef","isMut":true,"isSigner":false},{"name":"mintTokenRef","isMut":true,"isSigner":false},{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"tokenMetadata","isMut":true,"isSigner":false},{"name":"name","isMut":false,"isSigner":false},{"name":"owner","isMut":true,"isSigner":true},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"buyBaseRoyalties","isMut":true,"isSigner":false},{"name":"buyTargetRoyalties","isMut":true,"isSigner":false},{"name":"sellBaseRoyalties","isMut":true,"isSigner":false},{"name":"sellTargetRoyalties","isMut":true,"isSigner":false},{"name":"newBuyBaseRoyalties","isMut":true,"isSigner":false},{"name":"newBuyTargetRoyalties","isMut":true,"isSigner":false},{"name":"newSellBaseRoyalties","isMut":true,"isSigner":false},{"name":"newSellTargetRoyalties","isMut":true,"isSigner":false},{"name":"tokenBondingProgram","isMut":false,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"tokenMetadataProgram","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"ClaimSocialTokenV0Args"}}]},{"name":"updateCurveV0","accounts":[{"name":"collective","isMut":false,"isSigner":false},{"name":"authority","isMut":false,"isSigner":false},{"name":"mintTokenRef","isMut":false,"isSigner":false},{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"tokenRefAuthority","isMut":false,"isSigner":true},{"name":"curve","isMut":false,"isSigner":false},{"name":"tokenBondingProgram","isMut":false,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false}],"args":[]},{"name":"updateTokenBondingV0","accounts":[{"name":"collective","isMut":false,"isSigner":false},{"name":"authority","isMut":false,"isSigner":false},{"name":"mintTokenRef","isMut":false,"isSigner":false},{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"tokenRefAuthority","isMut":false,"isSigner":true},{"name":"tokenBondingProgram","isMut":false,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"buyBaseRoyalties","isMut":false,"isSigner":false},{"name":"buyTargetRoyalties","isMut":false,"isSigner":false},{"name":"sellBaseRoyalties","isMut":false,"isSigner":false},{"name":"sellTargetRoyalties","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"UpdateTokenBondingV0ArgsWrapper"}}]},{"name":"changeOptStatusUnclaimedV0","accounts":[{"name":"ownerTokenRef","isMut":true,"isSigner":false},{"name":"mintTokenRef","isMut":true,"isSigner":false},{"name":"name","isMut":false,"isSigner":false},{"name":"tokenBondingUpdateAccounts","accounts":[{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"buyBaseRoyalties","isMut":false,"isSigner":false},{"name":"buyTargetRoyalties","isMut":false,"isSigner":false},{"name":"sellBaseRoyalties","isMut":false,"isSigner":false},{"name":"sellTargetRoyalties","isMut":false,"isSigner":false}]},{"name":"tokenBondingProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"ChangeOptStatusUnclaimedV0Args"}}]},{"name":"changeOptStatusClaimedV0","accounts":[{"name":"ownerTokenRef","isMut":true,"isSigner":false},{"name":"primaryTokenRef","isMut":true,"isSigner":false},{"name":"owner","isMut":false,"isSigner":true},{"name":"mintTokenRef","isMut":true,"isSigner":false},{"name":"tokenBondingUpdateAccounts","accounts":[{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"buyBaseRoyalties","isMut":false,"isSigner":false},{"name":"buyTargetRoyalties","isMut":false,"isSigner":false},{"name":"sellBaseRoyalties","isMut":false,"isSigner":false},{"name":"sellTargetRoyalties","isMut":false,"isSigner":false}]},{"name":"tokenBondingProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"ChangeOptStatusClaimedV0Args"}}]},{"name":"updateOwnerV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"newOwner","isMut":false,"isSigner":true},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"owner","isMut":false,"isSigner":true},{"name":"oldOwnerTokenRef","isMut":true,"isSigner":false},{"name":"newOwnerTokenRef","isMut":true,"isSigner":false},{"name":"mintTokenRef","isMut":true,"isSigner":false},{"name":"oldPrimaryTokenRef","isMut":true,"isSigner":false},{"name":"newPrimaryTokenRef","isMut":true,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"UpdateOwnerV0Args"}}]},{"name":"updateAuthorityV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"authority","isMut":false,"isSigner":true},{"name":"ownerTokenRef","isMut":true,"isSigner":false},{"name":"mintTokenRef","isMut":true,"isSigner":false},{"name":"primaryTokenRef","isMut":true,"isSigner":false}],"args":[{"name":"args","type":{"defined":"UpdateAuthorityV0Args"}}]},{"name":"claimBondingAuthorityV0","accounts":[{"name":"mintTokenRef","isMut":false,"isSigner":false},{"name":"tokenBondingUpdateAccounts","accounts":[{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"buyBaseRoyalties","isMut":false,"isSigner":false},{"name":"buyTargetRoyalties","isMut":false,"isSigner":false},{"name":"sellBaseRoyalties","isMut":false,"isSigner":false},{"name":"sellTargetRoyalties","isMut":false,"isSigner":false}]},{"name":"tokenBondingProgram","isMut":false,"isSigner":false}],"args":[]}],"accounts":[{"name":"collectiveV0","type":{"kind":"struct","fields":[{"name":"mint","type":"publicKey"},{"name":"authority","type":{"option":"publicKey"}},{"name":"config","type":{"defined":"CollectiveConfigV0"}},{"name":"bumpSeed","type":"u8"}]}},{"name":"tokenRefV0","type":{"kind":"struct","fields":[{"name":"collective","type":{"option":"publicKey"}},{"name":"tokenMetadata","type":"publicKey"},{"name":"mint","type":"publicKey"},{"name":"tokenBonding","type":{"option":"publicKey"}},{"name":"name","type":{"option":"publicKey"}},{"name":"owner","type":{"option":"publicKey"}},{"name":"authority","type":{"option":"publicKey"}},{"name":"isClaimed","type":"bool"},{"name":"isPrimary","type":"bool"},{"name":"bumpSeed","type":"u8"},{"name":"targetRoyaltiesOwnerBumpSeed","type":"u8"},{"name":"isOptedOut","type":"bool"}]}}],"types":[{"name":"ClaimSocialTokenV0Args","type":{"kind":"struct","fields":[{"name":"isPrimary","type":"bool"},{"name":"authority","type":{"option":"publicKey"}}]}},{"name":"InitializeCollectiveV0Args","type":{"kind":"struct","fields":[{"name":"bumpSeed","type":"u8"},{"name":"authority","type":{"option":"publicKey"}},{"name":"config","type":{"defined":"CollectiveConfigV0"}}]}},{"name":"InitializeCollectiveForSocialTokenV0Args","type":{"kind":"struct","fields":[{"name":"authority","type":{"option":"publicKey"}},{"name":"config","type":{"defined":"CollectiveConfigV0"}}]}},{"name":"UpdateCollectiveV0Args","type":{"kind":"struct","fields":[{"name":"authority","type":{"option":"publicKey"}},{"name":"config","type":{"defined":"CollectiveConfigV0"}}]}},{"name":"CollectiveConfigV0","type":{"kind":"struct","fields":[{"name":"isOpen","type":"bool"},{"name":"unclaimedTokenMetadataSettings","type":{"option":{"defined":"TokenMetadataSettingsV0"}}},{"name":"unclaimedTokenBondingSettings","type":{"option":{"defined":"TokenBondingSettingsV0"}}},{"name":"claimedTokenBondingSettings","type":{"option":{"defined":"TokenBondingSettingsV0"}}}]}},{"name":"TokenMetadataSettingsV0","type":{"kind":"struct","fields":[{"name":"symbol","type":{"option":"string"}},{"name":"uri","type":{"option":"string"}},{"name":"nameIsNameServiceName","type":"bool"}]}},{"name":"RoyaltySettingV0","type":{"kind":"struct","fields":[{"name":"address","type":{"option":"publicKey"}},{"name":"ownedByName","type":"bool"}]}},{"name":"UpdateOwnerV0Args","type":{"kind":"struct","fields":[{"name":"ownerTokenRefBumpSeed","type":"u8"},{"name":"primaryTokenRefBumpSeed","type":"u8"}]}},{"name":"TokenBondingSettingsV0","type":{"kind":"struct","fields":[{"name":"curve","type":{"option":"publicKey"}},{"name":"minSellBaseRoyaltyPercentage","type":{"option":"u32"}},{"name":"minSellTargetRoyaltyPercentage","type":{"option":"u32"}},{"name":"maxSellBaseRoyaltyPercentage","type":{"option":"u32"}},{"name":"maxSellTargetRoyaltyPercentage","type":{"option":"u32"}},{"name":"minBuyBaseRoyaltyPercentage","type":{"option":"u32"}},{"name":"minBuyTargetRoyaltyPercentage","type":{"option":"u32"}},{"name":"maxBuyBaseRoyaltyPercentage","type":{"option":"u32"}},{"name":"maxBuyTargetRoyaltyPercentage","type":{"option":"u32"}},{"name":"targetMintDecimals","type":{"option":"u8"}},{"name":"buyBaseRoyalties","type":{"defined":"RoyaltySettingV0"}},{"name":"sellBaseRoyalties","type":{"defined":"RoyaltySettingV0"}},{"name":"buyTargetRoyalties","type":{"defined":"RoyaltySettingV0"}},{"name":"sellTargetRoyalties","type":{"defined":"RoyaltySettingV0"}},{"name":"minPurchaseCap","type":{"option":"u64"}},{"name":"maxPurchaseCap","type":{"option":"u64"}},{"name":"minMintCap","type":{"option":"u64"}},{"name":"maxMintCap","type":{"option":"u64"}}]}},{"name":"SetAsPrimaryV0Args","type":{"kind":"struct","fields":[{"name":"bumpSeed","type":"u8"}]}},{"name":"InitializeSocialTokenV0Args","type":{"kind":"struct","fields":[{"name":"authority","type":{"option":"publicKey"}},{"name":"nameParent","type":{"option":"publicKey"}},{"name":"nameClass","type":{"option":"publicKey"}}]}},{"name":"UpdateTokenBondingV0ArgsWrapper","type":{"kind":"struct","fields":[{"name":"tokenBondingAuthority","type":{"option":"publicKey"}},{"name":"buyBaseRoyaltyPercentage","type":"u32"},{"name":"buyTargetRoyaltyPercentage","type":"u32"},{"name":"sellBaseRoyaltyPercentage","type":"u32"},{"name":"sellTargetRoyaltyPercentage","type":"u32"},{"name":"buyFrozen","type":"bool"}]}},{"name":"UpdateCurveV0ArgsWrapper","type":{"kind":"struct","fields":[{"name":"curveAuthority","type":{"option":"publicKey"}}]}},{"name":"ChangeOptStatusUnclaimedV0Args","type":{"kind":"struct","fields":[{"name":"hashedName","type":"bytes"},{"name":"isOptedOut","type":"bool"}]}},{"name":"ChangeOptStatusClaimedV0Args","type":{"kind":"struct","fields":[{"name":"isOptedOut","type":"bool"}]}},{"name":"UpdateAuthorityV0Args","type":{"kind":"struct","fields":[{"name":"newAuthority","type":"publicKey"}]}},{"name":"UpdateMetadataAccountArgs","type":{"kind":"struct","fields":[{"name":"name","type":"string"},{"name":"symbol","type":"string"},{"name":"uri","type":"string"}]}}],"errors":[{"code":6000,"name":"NoAuthority","msg":"Provided account does not have an authority"},{"code":6001,"name":"InvalidBump","msg":"The bump provided did not match the canonical bump"},{"code":6002,"name":"InvalidAuthority","msg":"Invalid authority passed"},{"code":6003,"name":"InvalidTokenBondingSettings","msg":"Bonding curve had invalid settings to join this collective"},{"code":6004,"name":"InvalidTokenBondingRoyalties","msg":"Bonding curve had invalid royalties accounts to join this collective"},{"code":6005,"name":"InvalidTokenMetadataSettings","msg":"Unclaimed token had invalid metadata settings to join this collective"},{"code":6006,"name":"IncorrectOwner","msg":"Incorrect owner on account"},{"code":6007,"name":"NoBonding","msg":"Token is not on a bonding curve"},{"code":6008,"name":"InvalidCollective","msg":"Invalid collective"},{"code":6009,"name":"InvalidNameAuthority","msg":"Invalid name authority passed"},{"code":6010,"name":"UnclaimedNotLive","msg":"Unclaimed tokens cannot have a go live date in the future. They must be immediately live."},{"code":6011,"name":"InvalidGoLive","msg":"Invalid go live date for prelaunch"},{"code":6012,"name":"AccountDiscriminatorMismatch","msg":"Account discriminator mismatch"}],"metadata":{"address":"TCo1sfSr2nCudbeJPykbif64rG9K1JNMGzrtzvPmp3y"}};



  

export type CollectiveV0 = IdlAccounts<SplTokenCollectiveIDL>["collectiveV0"]

export type TokenRefV0 = IdlAccounts<SplTokenCollectiveIDL>["tokenRefV0"]
  
          