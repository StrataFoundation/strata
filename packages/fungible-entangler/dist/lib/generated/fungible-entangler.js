"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FungibleEntanglerIDLJson = void 0;
exports.FungibleEntanglerIDLJson = {
    "version": "1.0.0",
    "name": "fungible_entangler",
    "instructions": [
        {
            "name": "initializeFungibleEntanglerV0",
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
                    "name": "storage",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "mint",
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
                        "defined": "InitializeFungibleEntanglerV0Args"
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
                    "name": "parentEntangler",
                    "isMut": false,
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
            "name": "swapBaseV0",
            "accounts": [
                {
                    "name": "common",
                    "accounts": [
                        {
                            "name": "entangler",
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
            "name": "swapTargetV0",
            "accounts": [
                {
                    "name": "common",
                    "accounts": [
                        {
                            "name": "entangler",
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
        }
    ],
    "accounts": [
        {
            "name": "FungibleEntanglerV0",
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
                        "name": "mint",
                        "type": "publicKey"
                    },
                    {
                        "name": "storage",
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
        },
        {
            "name": "FungibleChildEntanglerV0",
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
                        "name": "parentEntangler",
                        "type": "publicKey"
                    },
                    {
                        "name": "mint",
                        "type": "publicKey"
                    },
                    {
                        "name": "storage",
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
            "name": "SwapV0Args",
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
            "name": "InitializeFungibleChildEntanglerV0Args",
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
            "name": "InitializeFungibleEntanglerV0Args",
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
                        "name": "entanglerSeed",
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
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "InvalidMint",
            "msg": "An account was provided that did not have the correct mint"
        }
    ]
};
//# sourceMappingURL=fungible-entangler.js.map