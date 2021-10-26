import { IdlAccounts, Idl } from '@wum.bo/anchor';
export const SplTokenBondingIDLJson: Idl & { metadata?: { address: string } } = {
  "version": "0.0.0",
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
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "targetMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "targetMintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "baseStorage",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "baseStorageAuthority",
          "isMut": false,
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
      "name": "updateTokenBondingV0",
      "accounts": [
        {
          "name": "tokenBonding",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
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
      "name": "buyV0",
      "accounts": [
        {
          "name": "tokenBonding",
          "isMut": false,
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
          "name": "targetMintAuthority",
          "isMut": false,
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
          "name": "buyTargetRoyalties",
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
          "name": "clock",
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
      "name": "sellV0",
      "accounts": [
        {
          "name": "tokenBonding",
          "isMut": false,
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
          "name": "sellTargetRoyalties",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "baseStorageAuthority",
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
          "name": "clock",
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
            "name": "c",
            "type": "u128"
          },
          {
            "name": "b",
            "type": "u128"
          },
          {
            "name": "curve",
            "type": {
              "defined": "Curves"
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
            "name": "authority",
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
            "name": "buyFrozen",
            "type": "bool"
          },
          {
            "name": "sellFrozen",
            "type": "bool"
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
          }
        ]
      }
    }
  ],
  "types": [
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
            "name": "tokenBondingAuthority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "baseStorageAuthority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "buyFrozen",
            "type": "bool"
          },
          {
            "name": "bumpSeed",
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
      "name": "CreateCurveV0Args",
      "type": {
        "kind": "struct",
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
            "name": "curve",
            "type": {
              "defined": "Curves"
            }
          }
        ]
      }
    },
    {
      "name": "Curves",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "ExponentialCurveV0",
            "fields": [
              {
                "name": "pow",
                "type": "u64"
              },
              {
                "name": "frac",
                "type": "u64"
              }
            ]
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 300,
      "name": "NoMintAuthority",
      "msg": "Target mint must have an authority"
    },
    {
      "code": 301,
      "name": "InvalidMintAuthority",
      "msg": "Target mint must have an authority that is a pda of this program"
    },
    {
      "code": 302,
      "name": "InvalidBaseStorageAuthority",
      "msg": "Invalid base storage authority pda or seed did not match canonical seed for base storage authority"
    },
    {
      "code": 303,
      "name": "NoAuthority",
      "msg": "Token bonding does not have an authority"
    },
    {
      "code": 304,
      "name": "ArithmeticError",
      "msg": "Error in precise number arithmetic"
    },
    {
      "code": 305,
      "name": "PriceTooHigh",
      "msg": "Buy price was higher than the maximum buy price. Try increasing max_price or slippage configuration"
    },
    {
      "code": 306,
      "name": "PriceTooLow",
      "msg": "Sell price was lower than the minimum sell price. Try decreasing min_price or increasing slippage configuration"
    },
    {
      "code": 307,
      "name": "MintSupplyTooLow",
      "msg": "Cannot sell more than the target mint currently has in supply"
    },
    {
      "code": 308,
      "name": "SellDisabled",
      "msg": "Sell is not enabled on this bonding curve"
    },
    {
      "code": 309,
      "name": "NotLiveYet",
      "msg": "This bonding curve is not live yet"
    },
    {
      "code": 310,
      "name": "PassedMintCap",
      "msg": "Passed the mint cap"
    },
    {
      "code": 311,
      "name": "OverPurchaseCap",
      "msg": "Cannot purchase that many tokens because of purchase cap"
    },
    {
      "code": 312,
      "name": "BuyFrozen",
      "msg": "Buy is frozen on this bonding curve, purchases not allowed"
    },
    {
      "code": 313,
      "name": "WrappedSolNotAllowed",
      "msg": "Use token bonding wrapped sol via buy_wrapped_sol, sell_wrapped_sol commands. We may one day provide liquid staking rewards on this stored sol."
    }
  ],
  "metadata": {
    "address": "TBondz6ZwSM5fs4v2GpnVBMuwoncPkFLFR9S422ghhN"
  }
};
export type SplTokenBondingIDL = {"version":"0.0.0","name":"spl_token_bonding","instructions":[{"name":"initializeSolStorageV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"state","isMut":true,"isSigner":false},{"name":"solStorage","isMut":false,"isSigner":false},{"name":"wrappedSolMint","isMut":false,"isSigner":false},{"name":"mintAuthority","isMut":false,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeSolStorageV0Args"}}]},{"name":"buyWrappedSolV0","accounts":[{"name":"state","isMut":false,"isSigner":false},{"name":"wrappedSolMint","isMut":true,"isSigner":false},{"name":"mintAuthority","isMut":false,"isSigner":false},{"name":"solStorage","isMut":true,"isSigner":false},{"name":"source","isMut":true,"isSigner":true},{"name":"destination","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"BuyWrappedSolV0Args"}}]},{"name":"sellWrappedSolV0","accounts":[{"name":"state","isMut":false,"isSigner":false},{"name":"wrappedSolMint","isMut":true,"isSigner":false},{"name":"solStorage","isMut":true,"isSigner":false},{"name":"source","isMut":true,"isSigner":false},{"name":"owner","isMut":false,"isSigner":true},{"name":"destination","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"SellWrappedSolV0Args"}}]},{"name":"createCurveV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"curve","isMut":true,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"CreateCurveV0Args"}}]},{"name":"initializeTokenBondingV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"curve","isMut":false,"isSigner":false},{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"baseStorage","isMut":false,"isSigner":false},{"name":"buyBaseRoyalties","isMut":false,"isSigner":false},{"name":"buyTargetRoyalties","isMut":false,"isSigner":false},{"name":"sellBaseRoyalties","isMut":false,"isSigner":false},{"name":"sellTargetRoyalties","isMut":false,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeTokenBondingV0Args"}}]},{"name":"closeTokenBondingV0","accounts":[{"name":"refund","isMut":true,"isSigner":false},{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"authority","isMut":false,"isSigner":true},{"name":"targetMint","isMut":true,"isSigner":false},{"name":"targetMintAuthority","isMut":false,"isSigner":false},{"name":"baseStorage","isMut":false,"isSigner":false},{"name":"baseStorageAuthority","isMut":false,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false}],"args":[]},{"name":"updateTokenBondingV0","accounts":[{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"authority","isMut":false,"isSigner":true},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"buyBaseRoyalties","isMut":false,"isSigner":false},{"name":"buyTargetRoyalties","isMut":false,"isSigner":false},{"name":"sellBaseRoyalties","isMut":false,"isSigner":false},{"name":"sellTargetRoyalties","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"UpdateTokenBondingV0Args"}}]},{"name":"buyV0","accounts":[{"name":"tokenBonding","isMut":false,"isSigner":false},{"name":"curve","isMut":false,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":true,"isSigner":false},{"name":"targetMintAuthority","isMut":false,"isSigner":false},{"name":"baseStorage","isMut":true,"isSigner":false},{"name":"buyBaseRoyalties","isMut":true,"isSigner":false},{"name":"buyTargetRoyalties","isMut":true,"isSigner":false},{"name":"source","isMut":true,"isSigner":false},{"name":"sourceAuthority","isMut":false,"isSigner":true},{"name":"destination","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"BuyV0Args"}}]},{"name":"sellV0","accounts":[{"name":"tokenBonding","isMut":false,"isSigner":false},{"name":"curve","isMut":false,"isSigner":false},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":true,"isSigner":false},{"name":"baseStorage","isMut":true,"isSigner":false},{"name":"sellBaseRoyalties","isMut":true,"isSigner":false},{"name":"sellTargetRoyalties","isMut":true,"isSigner":false},{"name":"baseStorageAuthority","isMut":false,"isSigner":false},{"name":"source","isMut":true,"isSigner":false},{"name":"sourceAuthority","isMut":false,"isSigner":true},{"name":"destination","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"SellV0Args"}}]}],"accounts":[{"name":"programStateV0","type":{"kind":"struct","fields":[{"name":"wrappedSolMint","type":"publicKey"},{"name":"solStorage","type":"publicKey"},{"name":"mintAuthorityBumpSeed","type":"u8"},{"name":"solStorageBumpSeed","type":"u8"},{"name":"bumpSeed","type":"u8"}]}},{"name":"curveV0","type":{"kind":"struct","fields":[{"name":"c","type":"u128"},{"name":"b","type":"u128"},{"name":"curve","type":{"defined":"Curves"}}]}},{"name":"tokenBondingV0","type":{"kind":"struct","fields":[{"name":"baseMint","type":"publicKey"},{"name":"targetMint","type":"publicKey"},{"name":"authority","type":{"option":"publicKey"}},{"name":"baseStorage","type":"publicKey"},{"name":"buyBaseRoyalties","type":"publicKey"},{"name":"buyTargetRoyalties","type":"publicKey"},{"name":"sellBaseRoyalties","type":"publicKey"},{"name":"sellTargetRoyalties","type":"publicKey"},{"name":"buyBaseRoyaltyPercentage","type":"u32"},{"name":"buyTargetRoyaltyPercentage","type":"u32"},{"name":"sellBaseRoyaltyPercentage","type":"u32"},{"name":"sellTargetRoyaltyPercentage","type":"u32"},{"name":"curve","type":"publicKey"},{"name":"mintCap","type":{"option":"u64"}},{"name":"purchaseCap","type":{"option":"u64"}},{"name":"goLiveUnixTime","type":"i64"},{"name":"freezeBuyUnixTime","type":{"option":"i64"}},{"name":"buyFrozen","type":"bool"},{"name":"sellFrozen","type":"bool"},{"name":"bumpSeed","type":"u8"},{"name":"baseStorageBumpSeed","type":"u8"},{"name":"targetMintAuthorityBumpSeed","type":"u8"},{"name":"baseStorageAuthorityBumpSeed","type":{"option":"u8"}}]}}],"types":[{"name":"InitializeTokenBondingV0Args","type":{"kind":"struct","fields":[{"name":"buyBaseRoyaltyPercentage","type":"u32"},{"name":"buyTargetRoyaltyPercentage","type":"u32"},{"name":"sellBaseRoyaltyPercentage","type":"u32"},{"name":"sellTargetRoyaltyPercentage","type":"u32"},{"name":"goLiveUnixTime","type":"i64"},{"name":"freezeBuyUnixTime","type":{"option":"i64"}},{"name":"mintCap","type":{"option":"u64"}},{"name":"purchaseCap","type":{"option":"u64"}},{"name":"tokenBondingAuthority","type":{"option":"publicKey"}},{"name":"baseStorageAuthority","type":{"option":"publicKey"}},{"name":"buyFrozen","type":"bool"},{"name":"bumpSeed","type":"u8"},{"name":"targetMintAuthorityBumpSeed","type":"u8"},{"name":"baseStorageAuthorityBumpSeed","type":{"option":"u8"}}]}},{"name":"UpdateTokenBondingV0Args","type":{"kind":"struct","fields":[{"name":"tokenBondingAuthority","type":{"option":"publicKey"}},{"name":"buyBaseRoyaltyPercentage","type":"u32"},{"name":"buyTargetRoyaltyPercentage","type":"u32"},{"name":"sellBaseRoyaltyPercentage","type":"u32"},{"name":"sellTargetRoyaltyPercentage","type":"u32"},{"name":"buyFrozen","type":"bool"}]}},{"name":"BuyWithBaseV0Args","type":{"kind":"struct","fields":[{"name":"baseAmount","type":"u64"},{"name":"minimumTargetAmount","type":"u64"}]}},{"name":"BuyTargetAmountV0Args","type":{"kind":"struct","fields":[{"name":"targetAmount","type":"u64"},{"name":"maximumPrice","type":"u64"}]}},{"name":"BuyV0Args","type":{"kind":"struct","fields":[{"name":"buyWithBase","type":{"option":{"defined":"BuyWithBaseV0Args"}}},{"name":"buyTargetAmount","type":{"option":{"defined":"BuyTargetAmountV0Args"}}}]}},{"name":"SellV0Args","type":{"kind":"struct","fields":[{"name":"targetAmount","type":"u64"},{"name":"minimumPrice","type":"u64"}]}},{"name":"InitializeSolStorageV0Args","type":{"kind":"struct","fields":[{"name":"mintAuthorityBumpSeed","type":"u8"},{"name":"solStorageBumpSeed","type":"u8"},{"name":"bumpSeed","type":"u8"}]}},{"name":"BuyWrappedSolV0Args","type":{"kind":"struct","fields":[{"name":"amount","type":"u64"}]}},{"name":"SellWrappedSolV0Args","type":{"kind":"struct","fields":[{"name":"amount","type":"u64"},{"name":"all","type":"bool"}]}},{"name":"CreateCurveV0Args","type":{"kind":"struct","fields":[{"name":"c","type":"u128"},{"name":"b","type":"u128"},{"name":"curve","type":{"defined":"Curves"}}]}},{"name":"Curves","type":{"kind":"enum","variants":[{"name":"ExponentialCurveV0","fields":[{"name":"pow","type":"u64"},{"name":"frac","type":"u64"}]}]}}],"errors":[{"code":300,"name":"NoMintAuthority","msg":"Target mint must have an authority"},{"code":301,"name":"InvalidMintAuthority","msg":"Target mint must have an authority that is a pda of this program"},{"code":302,"name":"InvalidBaseStorageAuthority","msg":"Invalid base storage authority pda or seed did not match canonical seed for base storage authority"},{"code":303,"name":"NoAuthority","msg":"Token bonding does not have an authority"},{"code":304,"name":"ArithmeticError","msg":"Error in precise number arithmetic"},{"code":305,"name":"PriceTooHigh","msg":"Buy price was higher than the maximum buy price. Try increasing max_price or slippage configuration"},{"code":306,"name":"PriceTooLow","msg":"Sell price was lower than the minimum sell price. Try decreasing min_price or increasing slippage configuration"},{"code":307,"name":"MintSupplyTooLow","msg":"Cannot sell more than the target mint currently has in supply"},{"code":308,"name":"SellDisabled","msg":"Sell is not enabled on this bonding curve"},{"code":309,"name":"NotLiveYet","msg":"This bonding curve is not live yet"},{"code":310,"name":"PassedMintCap","msg":"Passed the mint cap"},{"code":311,"name":"OverPurchaseCap","msg":"Cannot purchase that many tokens because of purchase cap"},{"code":312,"name":"BuyFrozen","msg":"Buy is frozen on this bonding curve, purchases not allowed"},{"code":313,"name":"WrappedSolNotAllowed","msg":"Use token bonding wrapped sol via buy_wrapped_sol, sell_wrapped_sol commands. We may one day provide liquid staking rewards on this stored sol."}],"metadata":{"address":"TBondz6ZwSM5fs4v2GpnVBMuwoncPkFLFR9S422ghhN"}};

export type Curves = Record<string, Record<string, any>>
export const Curves = {
  ExponentialCurveV0: { exponentialcurvev0: {} }
}
    

  

export type ProgramStateV0 = IdlAccounts<SplTokenBondingIDL>["programStateV0"]

export type CurveV0 = IdlAccounts<SplTokenBondingIDL>["curveV0"]

export type TokenBondingV0 = IdlAccounts<SplTokenBondingIDL>["tokenBondingV0"]
  
          