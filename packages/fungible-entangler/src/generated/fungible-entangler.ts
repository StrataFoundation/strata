import { IdlAccounts, Idl } from '@project-serum/anchor';
export const FungibleEntanglerIDLJson: Idl & { metadata?: { address: string } } = {
  "version": "1.0.0",
  "name": "fungible_entangler",
  "instructions": [
    {
      "name": "initializeFungibleParentEntanglerV0",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "entangler",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "parentStorage",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "parentMint",
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
            "defined": "InitializeFungibleParentEntanglerV0Args"
          }
        }
      ]
    },
    {
      "name": "initializeFungibleChildEntanglerV0",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "parentEntangler",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "entangler",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "childStorage",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "childMint",
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
            "defined": "InitializeFungibleChildEntanglerV0Args"
          }
        }
      ]
    },
    {
      "name": "swapParentForChildV0",
      "accounts": [
        {
          "name": "common",
          "accounts": [
            {
              "name": "parentEntangler",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "parentStorage",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "childEntangler",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "childStorage",
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
          ]
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "SwapV0Args"
          }
        }
      ]
    },
    {
      "name": "swapChildForParentV0",
      "accounts": [
        {
          "name": "common",
          "accounts": [
            {
              "name": "parentEntangler",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "parentStorage",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "childEntangler",
              "isMut": true,
              "isSigner": false
            },
            {
              "name": "childStorage",
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
          ]
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "SwapV0Args"
          }
        }
      ]
    },
    {
      "name": "closeFungibleChildEntanglerV0",
      "accounts": [
        {
          "name": "refund",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "parentEntangler",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "entangler",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "childStorage",
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
      "name": "closeFungibleParentEntanglerV0",
      "accounts": [
        {
          "name": "refund",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "parentEntangler",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "parentStorage",
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
      "name": "transferChildStorageV0",
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "parentEntangler",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "entangler",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "childStorage",
          "isMut": true,
          "isSigner": false
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
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "TransferChildStorageArgsV0"
          }
        }
      ]
    },
    {
      "name": "transferParentStorageV0",
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "parentEntangler",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "parentStorage",
          "isMut": true,
          "isSigner": false
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
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "TransferParentStorageArgsV0"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "FungibleParentEntanglerV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "parentMint",
            "type": "publicKey"
          },
          {
            "name": "parentStorage",
            "type": "publicKey"
          },
          {
            "name": "goLiveUnixTime",
            "type": "i64"
          },
          {
            "name": "freezeSwapUnixTime",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "createdAtUnixTime",
            "type": "i64"
          },
          {
            "name": "numChildren",
            "type": "u32"
          },
          {
            "name": "authority",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "dynamicSeed",
            "type": "bytes"
          },
          {
            "name": "bumpSeed",
            "type": "u8"
          },
          {
            "name": "storageBumpSeed",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "FungibleChildEntanglerV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "parentEntangler",
            "type": "publicKey"
          },
          {
            "name": "childMint",
            "type": "publicKey"
          },
          {
            "name": "childStorage",
            "type": "publicKey"
          },
          {
            "name": "goLiveUnixTime",
            "type": "i64"
          },
          {
            "name": "freezeSwapUnixTime",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "createdAtUnixTime",
            "type": "i64"
          },
          {
            "name": "bumpSeed",
            "type": "u8"
          },
          {
            "name": "storageBumpSeed",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "InitializeFungibleChildEntanglerV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "goLiveUnixTime",
            "type": "i64"
          },
          {
            "name": "freezeSwapUnixTime",
            "type": {
              "option": "i64"
            }
          }
        ]
      }
    },
    {
      "name": "InitializeFungibleParentEntanglerV0Args",
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
            "name": "dynamicSeed",
            "type": "bytes"
          },
          {
            "name": "goLiveUnixTime",
            "type": "i64"
          },
          {
            "name": "freezeSwapUnixTime",
            "type": {
              "option": "i64"
            }
          }
        ]
      }
    },
    {
      "name": "SwapV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "all",
            "type": {
              "option": "bool"
            }
          }
        ]
      }
    },
    {
      "name": "TransferChildStorageArgsV0",
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
      "name": "TransferParentStorageArgsV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6001,
      "name": "InvalidAuthority",
      "msg": "Invalid Authority"
    },
    {
      "code": 6002,
      "name": "TokenAccountAmountTooLow",
      "msg": "Cannot swap more than the token account currently has"
    },
    {
      "code": 6003,
      "name": "InvalidArgs",
      "msg": "Amount or All must be provided"
    },
    {
      "code": 6004,
      "name": "ParentNotLiveYet",
      "msg": "This parent entangler is not live yet"
    },
    {
      "code": 6005,
      "name": "ChildNotLiveYet",
      "msg": "This child entangler is not live yet"
    },
    {
      "code": 6006,
      "name": "ParentSwapFrozen",
      "msg": "Swap is frozen on the parent entangler, swapping not allowed"
    },
    {
      "code": 6007,
      "name": "ChildSwapFrozen",
      "msg": "Swap is frozen on the child entangler, swapping not allowed"
    },
    {
      "code": 6008,
      "name": "NoAuthority",
      "msg": "This entangler has no authority on it"
    }
  ],
  "metadata": {
    "address": "fent99TYZcj9PGbeooaZXEMQzMd7rz8vYFiudd8HevB"
  }
};
export type FungibleEntanglerIDL = {"version":"1.0.0","name":"fungible_entangler","instructions":[{"name":"initializeFungibleParentEntanglerV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"entangler","isMut":true,"isSigner":false},{"name":"parentStorage","isMut":true,"isSigner":false},{"name":"parentMint","isMut":false,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeFungibleParentEntanglerV0Args"}}]},{"name":"initializeFungibleChildEntanglerV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"authority","isMut":false,"isSigner":true},{"name":"parentEntangler","isMut":true,"isSigner":false},{"name":"entangler","isMut":true,"isSigner":false},{"name":"childStorage","isMut":true,"isSigner":false},{"name":"childMint","isMut":false,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeFungibleChildEntanglerV0Args"}}]},{"name":"swapParentForChildV0","accounts":[{"name":"common","accounts":[{"name":"parentEntangler","isMut":true,"isSigner":false},{"name":"parentStorage","isMut":true,"isSigner":false},{"name":"childEntangler","isMut":true,"isSigner":false},{"name":"childStorage","isMut":true,"isSigner":false},{"name":"source","isMut":true,"isSigner":false},{"name":"sourceAuthority","isMut":false,"isSigner":true},{"name":"destination","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}]}],"args":[{"name":"args","type":{"defined":"SwapV0Args"}}]},{"name":"swapChildForParentV0","accounts":[{"name":"common","accounts":[{"name":"parentEntangler","isMut":true,"isSigner":false},{"name":"parentStorage","isMut":true,"isSigner":false},{"name":"childEntangler","isMut":true,"isSigner":false},{"name":"childStorage","isMut":true,"isSigner":false},{"name":"source","isMut":true,"isSigner":false},{"name":"sourceAuthority","isMut":false,"isSigner":true},{"name":"destination","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}]}],"args":[{"name":"args","type":{"defined":"SwapV0Args"}}]},{"name":"closeFungibleChildEntanglerV0","accounts":[{"name":"refund","isMut":true,"isSigner":false},{"name":"authority","isMut":false,"isSigner":true},{"name":"parentEntangler","isMut":true,"isSigner":false},{"name":"entangler","isMut":true,"isSigner":false},{"name":"childStorage","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false}],"args":[]},{"name":"closeFungibleParentEntanglerV0","accounts":[{"name":"refund","isMut":true,"isSigner":false},{"name":"authority","isMut":false,"isSigner":true},{"name":"parentEntangler","isMut":true,"isSigner":false},{"name":"parentStorage","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false}],"args":[]},{"name":"transferChildStorageV0","accounts":[{"name":"authority","isMut":false,"isSigner":true},{"name":"parentEntangler","isMut":true,"isSigner":false},{"name":"entangler","isMut":false,"isSigner":false},{"name":"childStorage","isMut":true,"isSigner":false},{"name":"destination","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"TransferChildStorageArgsV0"}}]},{"name":"transferParentStorageV0","accounts":[{"name":"authority","isMut":false,"isSigner":true},{"name":"parentEntangler","isMut":true,"isSigner":false},{"name":"parentStorage","isMut":true,"isSigner":false},{"name":"destination","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"TransferParentStorageArgsV0"}}]}],"accounts":[{"name":"fungibleParentEntanglerV0","type":{"kind":"struct","fields":[{"name":"parentMint","type":"publicKey"},{"name":"parentStorage","type":"publicKey"},{"name":"goLiveUnixTime","type":"i64"},{"name":"freezeSwapUnixTime","type":{"option":"i64"}},{"name":"createdAtUnixTime","type":"i64"},{"name":"numChildren","type":"u32"},{"name":"authority","type":{"option":"publicKey"}},{"name":"dynamicSeed","type":"bytes"},{"name":"bumpSeed","type":"u8"},{"name":"storageBumpSeed","type":"u8"}]}},{"name":"fungibleChildEntanglerV0","type":{"kind":"struct","fields":[{"name":"parentEntangler","type":"publicKey"},{"name":"childMint","type":"publicKey"},{"name":"childStorage","type":"publicKey"},{"name":"goLiveUnixTime","type":"i64"},{"name":"freezeSwapUnixTime","type":{"option":"i64"}},{"name":"createdAtUnixTime","type":"i64"},{"name":"bumpSeed","type":"u8"},{"name":"storageBumpSeed","type":"u8"}]}}],"types":[{"name":"InitializeFungibleChildEntanglerV0Args","type":{"kind":"struct","fields":[{"name":"goLiveUnixTime","type":"i64"},{"name":"freezeSwapUnixTime","type":{"option":"i64"}}]}},{"name":"InitializeFungibleParentEntanglerV0Args","type":{"kind":"struct","fields":[{"name":"authority","type":{"option":"publicKey"}},{"name":"dynamicSeed","type":"bytes"},{"name":"goLiveUnixTime","type":"i64"},{"name":"freezeSwapUnixTime","type":{"option":"i64"}}]}},{"name":"SwapV0Args","type":{"kind":"struct","fields":[{"name":"amount","type":{"option":"u64"}},{"name":"all","type":{"option":"bool"}}]}},{"name":"TransferChildStorageArgsV0","type":{"kind":"struct","fields":[{"name":"amount","type":"u64"}]}},{"name":"TransferParentStorageArgsV0","type":{"kind":"struct","fields":[{"name":"amount","type":"u64"}]}}],"errors":[{"code":6000,"name":"InvalidAmount","msg":"Invalid amount"},{"code":6001,"name":"InvalidAuthority","msg":"Invalid Authority"},{"code":6002,"name":"TokenAccountAmountTooLow","msg":"Cannot swap more than the token account currently has"},{"code":6003,"name":"InvalidArgs","msg":"Amount or All must be provided"},{"code":6004,"name":"ParentNotLiveYet","msg":"This parent entangler is not live yet"},{"code":6005,"name":"ChildNotLiveYet","msg":"This child entangler is not live yet"},{"code":6006,"name":"ParentSwapFrozen","msg":"Swap is frozen on the parent entangler, swapping not allowed"},{"code":6007,"name":"ChildSwapFrozen","msg":"Swap is frozen on the child entangler, swapping not allowed"},{"code":6008,"name":"NoAuthority","msg":"This entangler has no authority on it"}],"metadata":{"address":"fent99TYZcj9PGbeooaZXEMQzMd7rz8vYFiudd8HevB"}};



  

export type FungibleParentEntanglerV0 = IdlAccounts<FungibleEntanglerIDL>["fungibleParentEntanglerV0"]

export type FungibleChildEntanglerV0 = IdlAccounts<FungibleEntanglerIDL>["fungibleChildEntanglerV0"]
  
          