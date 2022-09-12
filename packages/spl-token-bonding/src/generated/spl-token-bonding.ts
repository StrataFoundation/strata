import { IdlAccounts, Idl } from '@project-serum/anchor';
export const SplTokenBondingIDLJson: Idl & { metadata?: { address: string } } = {
  "version": "3.9.2",
  "name": "spl_token_bonding",
  "instructions": [
    {
      "name": "initializeSolStorageV0",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "state",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "solStorage",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wrappedSolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
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
            "defined": "InitializeSolStorageV0Args"
          }
        }
      ]
    },
    {
      "name": "buyWrappedSolV0",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wrappedSolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "solStorage",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "source",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "destination",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "BuyWrappedSolV0Args"
          }
        }
      ]
    },
    {
      "name": "sellWrappedSolV0",
      "accounts": [
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wrappedSolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "solStorage",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "source",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "destination",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "SellWrappedSolV0Args"
          }
        }
      ]
    },
    {
      "name": "createCurveV0",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "curve",
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
            "defined": "CreateCurveV0Args"
          }
        }
      ]
    },
    {
      "name": "initializeTokenBondingV0",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "curve",
          "isMut": false,
          "isSigner": false
        },
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
          "name": "baseStorage",
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
          "name": "tokenProgram",
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
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "InitializeTokenBondingV0Args"
          }
        }
      ]
    },
    {
      "name": "closeTokenBondingV0",
      "accounts": [
        {
          "name": "refund",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBonding",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "generalAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "targetMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseStorage",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "transferReservesV0",
      "accounts": [
        {
          "name": "common",
          "accounts": [
            {
              "name": "tokenBonding",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "reserveAuthority",
              "isMut": false,
              "isSigner": true
            },
            {
              "name": "baseMint",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "baseStorage",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenProgram",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "destination",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "TransferReservesV0Args"
          }
        }
      ]
    },
    {
      "name": "transferReservesNativeV0",
      "accounts": [
        {
          "name": "common",
          "accounts": [
            {
              "name": "tokenBonding",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "reserveAuthority",
              "isMut": false,
              "isSigner": true
            },
            {
              "name": "baseMint",
              "isMut": false,
              "isSigner": false
            },
            {
              "name": "baseStorage",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenProgram",
              "isMut": false,
              "isSigner": false
            }
          ]
        },
        {
          "name": "destination",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wrappedSolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "solStorage",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "TransferReservesV0Args"
          }
        }
      ]
    },
    {
      "name": "updateReserveAuthorityV0",
      "accounts": [
        {
          "name": "tokenBonding",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveAuthority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "UpdateReserveAuthorityV0Args"
          }
        }
      ]
    },
    {
      "name": "updateCurveV0",
      "accounts": [
        {
          "name": "tokenBonding",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "curveAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "curve",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "UpdateCurveV0Args"
          }
        }
      ]
    },
    {
      "name": "updateTokenBondingV0",
      "accounts": [
        {
          "name": "tokenBonding",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "generalAuthority",
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
            "defined": "UpdateTokenBondingV0Args"
          }
        }
      ]
    },
    {
      "name": "buyV1",
      "accounts": [
        {
          "name": "common",
          "accounts": [
            {
              "name": "tokenBonding",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "curve",
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
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "baseStorage",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "buyBaseRoyalties",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "destination",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "buyTargetRoyalties",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenProgram",
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
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "source",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sourceAuthority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "BuyV0Args"
          }
        }
      ]
    },
    {
      "name": "buyNativeV0",
      "accounts": [
        {
          "name": "common",
          "accounts": [
            {
              "name": "tokenBonding",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "curve",
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
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "baseStorage",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "buyBaseRoyalties",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "destination",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "buyTargetRoyalties",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenProgram",
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
          "name": "source",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wrappedSolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "solStorage",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "BuyV0Args"
          }
        }
      ]
    },
    {
      "name": "sellV1",
      "accounts": [
        {
          "name": "common",
          "accounts": [
            {
              "name": "tokenBonding",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "curve",
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
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "baseStorage",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "sellBaseRoyalties",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "source",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "sourceAuthority",
              "isMut": false,
              "isSigner": true
            },
            {
              "name": "sellTargetRoyalties",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenProgram",
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
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destination",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "SellV0Args"
          }
        }
      ]
    },
    {
      "name": "sellNativeV0",
      "accounts": [
        {
          "name": "common",
          "accounts": [
            {
              "name": "tokenBonding",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "curve",
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
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "baseStorage",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "sellBaseRoyalties",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "source",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "sourceAuthority",
              "isMut": false,
              "isSigner": true
            },
            {
              "name": "sellTargetRoyalties",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "tokenProgram",
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
          "name": "destination",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "state",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wrappedSolMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "solStorage",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "SellV0Args"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ProgramStateV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wrappedSolMint",
            "type": "publicKey"
          },
          {
            "name": "solStorage",
            "type": "publicKey"
          },
          {
            "name": "mintAuthorityBumpSeed",
            "type": "u8"
          },
          {
            "name": "solStorageBumpSeed",
            "type": "u8"
          },
          {
            "name": "bumpSeed",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "CurveV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "definition",
            "type": {
              "defined": "PiecewiseCurve"
            }
          }
        ]
      }
    },
    {
      "name": "TokenBondingV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "baseMint",
            "type": "publicKey"
          },
          {
            "name": "targetMint",
            "type": "publicKey"
          },
          {
            "name": "generalAuthority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "reserveAuthority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "curveAuthority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "baseStorage",
            "type": "publicKey"
          },
          {
            "name": "buyBaseRoyalties",
            "type": "publicKey"
          },
          {
            "name": "buyTargetRoyalties",
            "type": "publicKey"
          },
          {
            "name": "sellBaseRoyalties",
            "type": "publicKey"
          },
          {
            "name": "sellTargetRoyalties",
            "type": "publicKey"
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
            "name": "curve",
            "type": "publicKey"
          },
          {
            "name": "mintCap",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "purchaseCap",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "goLiveUnixTime",
            "type": "i64"
          },
          {
            "name": "freezeBuyUnixTime",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "createdAtUnixTime",
            "type": "i64"
          },
          {
            "name": "buyFrozen",
            "type": "bool"
          },
          {
            "name": "sellFrozen",
            "type": "bool"
          },
          {
            "name": "index",
            "type": "u16"
          },
          {
            "name": "bumpSeed",
            "type": "u8"
          },
          {
            "name": "baseStorageBumpSeed",
            "type": "u8"
          },
          {
            "name": "targetMintAuthorityBumpSeed",
            "type": "u8"
          },
          {
            "name": "baseStorageAuthorityBumpSeed",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "reserveBalanceFromBonding",
            "type": "u64"
          },
          {
            "name": "supplyFromBonding",
            "type": "u64"
          },
          {
            "name": "ignoreExternalReserveChanges",
            "type": "bool"
          },
          {
            "name": "ignoreExternalSupplyChanges",
            "type": "bool"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "BuyWithBaseV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "baseAmount",
            "type": "u64"
          },
          {
            "name": "minimumTargetAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "BuyTargetAmountV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "targetAmount",
            "type": "u64"
          },
          {
            "name": "maximumPrice",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "BuyV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyWithBase",
            "type": {
              "option": {
                "defined": "BuyWithBaseV0Args"
              }
            }
          },
          {
            "name": "buyTargetAmount",
            "type": {
              "option": {
                "defined": "BuyTargetAmountV0Args"
              }
            }
          }
        ]
      }
    },
    {
      "name": "BuyWrappedSolV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "CreateCurveV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "definition",
            "type": {
              "defined": "PiecewiseCurve"
            }
          }
        ]
      }
    },
    {
      "name": "InitializeSolStorageV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mintAuthorityBumpSeed",
            "type": "u8"
          },
          {
            "name": "solStorageBumpSeed",
            "type": "u8"
          },
          {
            "name": "bumpSeed",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "InitializeTokenBondingV0Args",
      "type": {
        "kind": "struct",
        "fields": [
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
            "name": "goLiveUnixTime",
            "type": "i64"
          },
          {
            "name": "freezeBuyUnixTime",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "mintCap",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "purchaseCap",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "generalAuthority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "reserveAuthority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "curveAuthority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "buyFrozen",
            "type": "bool"
          },
          {
            "name": "index",
            "type": "u16"
          },
          {
            "name": "bumpSeed",
            "type": "u8"
          },
          {
            "name": "sellFrozen",
            "type": "bool"
          },
          {
            "name": "ignoreExternalReserveChanges",
            "type": "bool"
          },
          {
            "name": "ignoreExternalSupplyChanges",
            "type": "bool"
          },
          {
            "name": "initialReservesPad",
            "type": "u64"
          },
          {
            "name": "initialSupplyPad",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "SellV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "targetAmount",
            "type": "u64"
          },
          {
            "name": "minimumPrice",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "SellWrappedSolV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "all",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "TransferReservesV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "UpdateCurveV0Args",
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
      "name": "UpdateReserveAuthorityV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "newReserveAuthority",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "UpdateTokenBondingV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "generalAuthority",
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
      "name": "TimeCurveV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "offset",
            "type": "i64"
          },
          {
            "name": "curve",
            "type": {
              "defined": "PrimitiveCurve"
            }
          },
          {
            "name": "buyTransitionFees",
            "type": {
              "option": {
                "defined": "TransitionFeeV0"
              }
            }
          },
          {
            "name": "sellTransitionFees",
            "type": {
              "option": {
                "defined": "TransitionFeeV0"
              }
            }
          }
        ]
      }
    },
    {
      "name": "TransitionFeeV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "percentage",
            "type": "u32"
          },
          {
            "name": "interval",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "PrimitiveCurve",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ExponentialCurveV0",
            "fields": [
              {
                "name": "c",
                "type": "u128"
              },
              {
                "name": "b",
                "type": "u128"
              },
              {
                "name": "pow",
                "type": "u8"
              },
              {
                "name": "frac",
                "type": "u8"
              }
            ]
          },
          {
            "name": "TimeDecayExponentialCurveV0",
            "fields": [
              {
                "name": "c",
                "type": "u128"
              },
              {
                "name": "k1",
                "type": "u128"
              },
              {
                "name": "k0",
                "type": "u128"
              },
              {
                "name": "interval",
                "type": "u32"
              },
              {
                "name": "d",
                "type": "u128"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "PiecewiseCurve",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "TimeV0",
            "fields": [
              {
                "name": "curves",
                "type": {
                  "vec": {
                    "defined": "TimeCurveV0"
                  }
                }
              }
            ]
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NoMintAuthority",
      "msg": "Target mint must have an authority"
    },
    {
      "code": 6001,
      "name": "InvalidMintAuthority",
      "msg": "Target mint must have an authority that is a pda of this program"
    },
    {
      "code": 6002,
      "name": "InvalidBaseStorageAuthority",
      "msg": "Invalid base storage authority pda or seed did not match canonical seed for base storage authority"
    },
    {
      "code": 6003,
      "name": "NoAuthority",
      "msg": "Token bonding does not have an authority"
    },
    {
      "code": 6004,
      "name": "ArithmeticError",
      "msg": "Error in precise number arithmetic"
    },
    {
      "code": 6005,
      "name": "PriceTooHigh",
      "msg": "Buy price was higher than the maximum buy price. Try increasing max_price or slippage configuration"
    },
    {
      "code": 6006,
      "name": "PriceTooLow",
      "msg": "Sell price was lower than the minimum sell price. Try decreasing min_price or increasing slippage configuration"
    },
    {
      "code": 6007,
      "name": "MintSupplyTooLow",
      "msg": "Cannot sell more than the target mint currently has in supply"
    },
    {
      "code": 6008,
      "name": "SellDisabled",
      "msg": "Sell is not enabled on this bonding curve"
    },
    {
      "code": 6009,
      "name": "NotLiveYet",
      "msg": "This bonding curve is not live yet"
    },
    {
      "code": 6010,
      "name": "PassedMintCap",
      "msg": "Passed the mint cap"
    },
    {
      "code": 6011,
      "name": "OverPurchaseCap",
      "msg": "Cannot purchase that many tokens because of purchase cap"
    },
    {
      "code": 6012,
      "name": "BuyFrozen",
      "msg": "Buy is frozen on this bonding curve, purchases not allowed"
    },
    {
      "code": 6013,
      "name": "WrappedSolNotAllowed",
      "msg": "Use token bonding wrapped sol via buy_wrapped_sol, sell_wrapped_sol commands. We may one day provide liquid staking rewards on this stored sol."
    },
    {
      "code": 6014,
      "name": "InvalidCurve",
      "msg": "The provided curve is invalid"
    },
    {
      "code": 6015,
      "name": "InvalidMint",
      "msg": "An account was provided that did not have the correct mint"
    },
    {
      "code": 6016,
      "name": "IgnoreExternalV1Only",
      "msg": "Ignoring external changes is only supported on v1 of buy and sell endpoints. Please upgrade your client"
    },
    {
      "code": 6017,
      "name": "InvalidPad",
      "msg": "Cannot pad token bonding without ignoring external reserve and supply changes. This is an advanced feature, incorrect use could lead to insufficient resreves to cover sells"
    }
  ],
  "metadata": {
    "address": "TBondmkCYxaPCKG4CHYfVTcwQ8on31xnJrPzk8F8WsS"
  }
};
export type SplTokenBondingIDL = {"version":"3.9.2","name":"spl_token_bonding","instructions":[{"name":"initializeSolStorageV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"state","isMut":true,"isSigner":false},{"name":"solStorage","isMut":false,"isSigner":false},{"name":"wrappedSolMint","isMut":false,"isSigner":false},{"name":"mintAuthority","isMut":false,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeSolStorageV0Args"}}]},{"name":"buyWrappedSolV0","accounts":[{"name":"state","isMut":false,"isSigner":false},{"name":"wrappedSolMint","isMut":true,"isSigner":false},{"name":"mintAuthority","isMut":false,"isSigner":false},{"name":"solStorage","isMut":true,"isSigner":false},{"name":"source","isMut":true,"isSigner":true},{"name":"destination","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"BuyWrappedSolV0Args"}}]},{"name":"sellWrappedSolV0","accounts":[{"name":"state","isMut":false,"isSigner":false},{"name":"wrappedSolMint","isMut":true,"isSigner":false},{"name":"solStorage","isMut":true,"isSigner":false},{"name":"source","isMut":true,"isSigner":false},{"name":"owner","isMut":false,"isSigner":true},{"name":"destination","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"SellWrappedSolV0Args"}}]},{"name":"createCurveV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"curve","isMut":true,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"CreateCurveV0Args"}}]},{"name":"initializeTokenBondingV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"curve","isMut":false,"isSigner":false},{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"baseStorage","isMut":false,"isSigner":false},{"name":"buyBaseRoyalties","isMut":false,"isSigner":false},{"name":"buyTargetRoyalties","isMut":false,"isSigner":false},{"name":"sellBaseRoyalties","isMut":false,"isSigner":false},{"name":"sellTargetRoyalties","isMut":false,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeTokenBondingV0Args"}}]},{"name":"closeTokenBondingV0","accounts":[{"name":"refund","isMut":true,"isSigner":false},{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"generalAuthority","isMut":false,"isSigner":true},{"name":"targetMint","isMut":true,"isSigner":false},{"name":"baseStorage","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false}],"args":[]},{"name":"transferReservesV0","accounts":[{"name":"common","accounts":[{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"reserveAuthority","isMut":false,"isSigner":true},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"baseStorage","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false}]},{"name":"destination","isMut":true,"isSigner":false}],"args":[{"name":"args","type":{"defined":"TransferReservesV0Args"}}]},{"name":"transferReservesNativeV0","accounts":[{"name":"common","accounts":[{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"reserveAuthority","isMut":false,"isSigner":true},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"baseStorage","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false}]},{"name":"destination","isMut":true,"isSigner":false},{"name":"state","isMut":false,"isSigner":false},{"name":"wrappedSolMint","isMut":true,"isSigner":false},{"name":"mintAuthority","isMut":false,"isSigner":false},{"name":"solStorage","isMut":true,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"TransferReservesV0Args"}}]},{"name":"updateReserveAuthorityV0","accounts":[{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"reserveAuthority","isMut":false,"isSigner":true}],"args":[{"name":"args","type":{"defined":"UpdateReserveAuthorityV0Args"}}]},{"name":"updateCurveV0","accounts":[{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"curveAuthority","isMut":false,"isSigner":true},{"name":"curve","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"UpdateCurveV0Args"}}]},{"name":"updateTokenBondingV0","accounts":[{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"generalAuthority","isMut":false,"isSigner":true},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"buyBaseRoyalties","isMut":false,"isSigner":false},{"name":"buyTargetRoyalties","isMut":false,"isSigner":false},{"name":"sellBaseRoyalties","isMut":false,"isSigner":false},{"name":"sellTargetRoyalties","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"UpdateTokenBondingV0Args"}}]},{"name":"buyV1","accounts":[{"name":"common","accounts":[{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"curve","isMut":false,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":true,"isSigner":false},{"name":"baseStorage","isMut":true,"isSigner":false},{"name":"buyBaseRoyalties","isMut":true,"isSigner":false},{"name":"destination","isMut":true,"isSigner":false},{"name":"buyTargetRoyalties","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}]},{"name":"state","isMut":false,"isSigner":false},{"name":"source","isMut":true,"isSigner":false},{"name":"sourceAuthority","isMut":false,"isSigner":true}],"args":[{"name":"args","type":{"defined":"BuyV0Args"}}]},{"name":"buyNativeV0","accounts":[{"name":"common","accounts":[{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"curve","isMut":false,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":true,"isSigner":false},{"name":"baseStorage","isMut":true,"isSigner":false},{"name":"buyBaseRoyalties","isMut":true,"isSigner":false},{"name":"destination","isMut":true,"isSigner":false},{"name":"buyTargetRoyalties","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}]},{"name":"source","isMut":true,"isSigner":true},{"name":"state","isMut":false,"isSigner":false},{"name":"wrappedSolMint","isMut":true,"isSigner":false},{"name":"mintAuthority","isMut":false,"isSigner":false},{"name":"solStorage","isMut":true,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"BuyV0Args"}}]},{"name":"sellV1","accounts":[{"name":"common","accounts":[{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"curve","isMut":false,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":true,"isSigner":false},{"name":"baseStorage","isMut":true,"isSigner":false},{"name":"sellBaseRoyalties","isMut":true,"isSigner":false},{"name":"source","isMut":true,"isSigner":false},{"name":"sourceAuthority","isMut":false,"isSigner":true},{"name":"sellTargetRoyalties","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}]},{"name":"state","isMut":false,"isSigner":false},{"name":"destination","isMut":true,"isSigner":false}],"args":[{"name":"args","type":{"defined":"SellV0Args"}}]},{"name":"sellNativeV0","accounts":[{"name":"common","accounts":[{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"curve","isMut":false,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":true,"isSigner":false},{"name":"baseStorage","isMut":true,"isSigner":false},{"name":"sellBaseRoyalties","isMut":true,"isSigner":false},{"name":"source","isMut":true,"isSigner":false},{"name":"sourceAuthority","isMut":false,"isSigner":true},{"name":"sellTargetRoyalties","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}]},{"name":"destination","isMut":true,"isSigner":false},{"name":"state","isMut":false,"isSigner":false},{"name":"wrappedSolMint","isMut":true,"isSigner":false},{"name":"mintAuthority","isMut":false,"isSigner":false},{"name":"solStorage","isMut":true,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"SellV0Args"}}]}],"accounts":[{"name":"programStateV0","type":{"kind":"struct","fields":[{"name":"wrappedSolMint","type":"publicKey"},{"name":"solStorage","type":"publicKey"},{"name":"mintAuthorityBumpSeed","type":"u8"},{"name":"solStorageBumpSeed","type":"u8"},{"name":"bumpSeed","type":"u8"}]}},{"name":"curveV0","type":{"kind":"struct","fields":[{"name":"definition","type":{"defined":"PiecewiseCurve"}}]}},{"name":"tokenBondingV0","type":{"kind":"struct","fields":[{"name":"baseMint","type":"publicKey"},{"name":"targetMint","type":"publicKey"},{"name":"generalAuthority","type":{"option":"publicKey"}},{"name":"reserveAuthority","type":{"option":"publicKey"}},{"name":"curveAuthority","type":{"option":"publicKey"}},{"name":"baseStorage","type":"publicKey"},{"name":"buyBaseRoyalties","type":"publicKey"},{"name":"buyTargetRoyalties","type":"publicKey"},{"name":"sellBaseRoyalties","type":"publicKey"},{"name":"sellTargetRoyalties","type":"publicKey"},{"name":"buyBaseRoyaltyPercentage","type":"u32"},{"name":"buyTargetRoyaltyPercentage","type":"u32"},{"name":"sellBaseRoyaltyPercentage","type":"u32"},{"name":"sellTargetRoyaltyPercentage","type":"u32"},{"name":"curve","type":"publicKey"},{"name":"mintCap","type":{"option":"u64"}},{"name":"purchaseCap","type":{"option":"u64"}},{"name":"goLiveUnixTime","type":"i64"},{"name":"freezeBuyUnixTime","type":{"option":"i64"}},{"name":"createdAtUnixTime","type":"i64"},{"name":"buyFrozen","type":"bool"},{"name":"sellFrozen","type":"bool"},{"name":"index","type":"u16"},{"name":"bumpSeed","type":"u8"},{"name":"baseStorageBumpSeed","type":"u8"},{"name":"targetMintAuthorityBumpSeed","type":"u8"},{"name":"baseStorageAuthorityBumpSeed","type":{"option":"u8"}},{"name":"reserveBalanceFromBonding","type":"u64"},{"name":"supplyFromBonding","type":"u64"},{"name":"ignoreExternalReserveChanges","type":"bool"},{"name":"ignoreExternalSupplyChanges","type":"bool"}]}}],"types":[{"name":"BuyWithBaseV0Args","type":{"kind":"struct","fields":[{"name":"baseAmount","type":"u64"},{"name":"minimumTargetAmount","type":"u64"}]}},{"name":"BuyTargetAmountV0Args","type":{"kind":"struct","fields":[{"name":"targetAmount","type":"u64"},{"name":"maximumPrice","type":"u64"}]}},{"name":"BuyV0Args","type":{"kind":"struct","fields":[{"name":"buyWithBase","type":{"option":{"defined":"BuyWithBaseV0Args"}}},{"name":"buyTargetAmount","type":{"option":{"defined":"BuyTargetAmountV0Args"}}}]}},{"name":"BuyWrappedSolV0Args","type":{"kind":"struct","fields":[{"name":"amount","type":"u64"}]}},{"name":"CreateCurveV0Args","type":{"kind":"struct","fields":[{"name":"definition","type":{"defined":"PiecewiseCurve"}}]}},{"name":"InitializeSolStorageV0Args","type":{"kind":"struct","fields":[{"name":"mintAuthorityBumpSeed","type":"u8"},{"name":"solStorageBumpSeed","type":"u8"},{"name":"bumpSeed","type":"u8"}]}},{"name":"InitializeTokenBondingV0Args","type":{"kind":"struct","fields":[{"name":"buyBaseRoyaltyPercentage","type":"u32"},{"name":"buyTargetRoyaltyPercentage","type":"u32"},{"name":"sellBaseRoyaltyPercentage","type":"u32"},{"name":"sellTargetRoyaltyPercentage","type":"u32"},{"name":"goLiveUnixTime","type":"i64"},{"name":"freezeBuyUnixTime","type":{"option":"i64"}},{"name":"mintCap","type":{"option":"u64"}},{"name":"purchaseCap","type":{"option":"u64"}},{"name":"generalAuthority","type":{"option":"publicKey"}},{"name":"reserveAuthority","type":{"option":"publicKey"}},{"name":"curveAuthority","type":{"option":"publicKey"}},{"name":"buyFrozen","type":"bool"},{"name":"index","type":"u16"},{"name":"bumpSeed","type":"u8"},{"name":"sellFrozen","type":"bool"},{"name":"ignoreExternalReserveChanges","type":"bool"},{"name":"ignoreExternalSupplyChanges","type":"bool"},{"name":"initialReservesPad","type":"u64"},{"name":"initialSupplyPad","type":"u64"}]}},{"name":"SellV0Args","type":{"kind":"struct","fields":[{"name":"targetAmount","type":"u64"},{"name":"minimumPrice","type":"u64"}]}},{"name":"SellWrappedSolV0Args","type":{"kind":"struct","fields":[{"name":"amount","type":"u64"},{"name":"all","type":"bool"}]}},{"name":"TransferReservesV0Args","type":{"kind":"struct","fields":[{"name":"amount","type":"u64"}]}},{"name":"UpdateCurveV0Args","type":{"kind":"struct","fields":[{"name":"curveAuthority","type":{"option":"publicKey"}}]}},{"name":"UpdateReserveAuthorityV0Args","type":{"kind":"struct","fields":[{"name":"newReserveAuthority","type":{"option":"publicKey"}}]}},{"name":"UpdateTokenBondingV0Args","type":{"kind":"struct","fields":[{"name":"generalAuthority","type":{"option":"publicKey"}},{"name":"buyBaseRoyaltyPercentage","type":"u32"},{"name":"buyTargetRoyaltyPercentage","type":"u32"},{"name":"sellBaseRoyaltyPercentage","type":"u32"},{"name":"sellTargetRoyaltyPercentage","type":"u32"},{"name":"buyFrozen","type":"bool"}]}},{"name":"TimeCurveV0","type":{"kind":"struct","fields":[{"name":"offset","type":"i64"},{"name":"curve","type":{"defined":"PrimitiveCurve"}},{"name":"buyTransitionFees","type":{"option":{"defined":"TransitionFeeV0"}}},{"name":"sellTransitionFees","type":{"option":{"defined":"TransitionFeeV0"}}}]}},{"name":"TransitionFeeV0","type":{"kind":"struct","fields":[{"name":"percentage","type":"u32"},{"name":"interval","type":"u32"}]}},{"name":"PrimitiveCurve","type":{"kind":"enum","variants":[{"name":"ExponentialCurveV0","fields":[{"name":"c","type":"u128"},{"name":"b","type":"u128"},{"name":"pow","type":"u8"},{"name":"frac","type":"u8"}]},{"name":"TimeDecayExponentialCurveV0","fields":[{"name":"c","type":"u128"},{"name":"k1","type":"u128"},{"name":"k0","type":"u128"},{"name":"interval","type":"u32"},{"name":"d","type":"u128"}]}]}},{"name":"PiecewiseCurve","type":{"kind":"enum","variants":[{"name":"TimeV0","fields":[{"name":"curves","type":{"vec":{"defined":"TimeCurveV0"}}}]}]}}],"errors":[{"code":6000,"name":"NoMintAuthority","msg":"Target mint must have an authority"},{"code":6001,"name":"InvalidMintAuthority","msg":"Target mint must have an authority that is a pda of this program"},{"code":6002,"name":"InvalidBaseStorageAuthority","msg":"Invalid base storage authority pda or seed did not match canonical seed for base storage authority"},{"code":6003,"name":"NoAuthority","msg":"Token bonding does not have an authority"},{"code":6004,"name":"ArithmeticError","msg":"Error in precise number arithmetic"},{"code":6005,"name":"PriceTooHigh","msg":"Buy price was higher than the maximum buy price. Try increasing max_price or slippage configuration"},{"code":6006,"name":"PriceTooLow","msg":"Sell price was lower than the minimum sell price. Try decreasing min_price or increasing slippage configuration"},{"code":6007,"name":"MintSupplyTooLow","msg":"Cannot sell more than the target mint currently has in supply"},{"code":6008,"name":"SellDisabled","msg":"Sell is not enabled on this bonding curve"},{"code":6009,"name":"NotLiveYet","msg":"This bonding curve is not live yet"},{"code":6010,"name":"PassedMintCap","msg":"Passed the mint cap"},{"code":6011,"name":"OverPurchaseCap","msg":"Cannot purchase that many tokens because of purchase cap"},{"code":6012,"name":"BuyFrozen","msg":"Buy is frozen on this bonding curve, purchases not allowed"},{"code":6013,"name":"WrappedSolNotAllowed","msg":"Use token bonding wrapped sol via buy_wrapped_sol, sell_wrapped_sol commands. We may one day provide liquid staking rewards on this stored sol."},{"code":6014,"name":"InvalidCurve","msg":"The provided curve is invalid"},{"code":6015,"name":"InvalidMint","msg":"An account was provided that did not have the correct mint"},{"code":6016,"name":"IgnoreExternalV1Only","msg":"Ignoring external changes is only supported on v1 of buy and sell endpoints. Please upgrade your client"},{"code":6017,"name":"InvalidPad","msg":"Cannot pad token bonding without ignoring external reserve and supply changes. This is an advanced feature, incorrect use could lead to insufficient resreves to cover sells"}],"metadata":{"address":"TBondmkCYxaPCKG4CHYfVTcwQ8on31xnJrPzk8F8WsS"}};

export type PrimitiveCurve = Record<string, Record<string, any>>
export const PrimitiveCurve = {
  ExponentialCurveV0: { exponentialcurvev0: {} },
  TimeDecayExponentialCurveV0: { timedecayexponentialcurvev0: {} }
}
    

export type PiecewiseCurve = Record<string, Record<string, any>>
export const PiecewiseCurve = {
  TimeV0: { timev0: {} }
}
    

  

export type ProgramStateV0 = IdlAccounts<SplTokenBondingIDL>["programStateV0"]

export type CurveV0 = IdlAccounts<SplTokenBondingIDL>["curveV0"]

export type TokenBondingV0 = IdlAccounts<SplTokenBondingIDL>["tokenBondingV0"]
  
          