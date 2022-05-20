"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FungibleEntanglerIDLJson = void 0;
exports.FungibleEntanglerIDLJson = {
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
                    "name": "parentEntangler",
                    "isMut": false,
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
            "name": "swapParentV0",
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
                            "name": "parentMint",
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
                            "name": "childMint",
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
            "name": "swapChildV0",
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
                            "name": "parentMint",
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
                            "name": "childMint",
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
        }
    ],
    "accounts": [
        {
            "name": "FungibleParentEntanglerV0",
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
            "name": "TokenAccountAmountTooLow",
            "msg": "Cannot swap more than the token account currently has"
        },
        {
            "code": 6002,
            "name": "InvalidArgs",
            "msg": "Amount or All must be provided"
        }
    ],
    "metadata": {
        "address": "Ae6wbxtjpoKGCuSdHGQXRudmdpSfGpu6KHtjDcWEDjP8"
    }
};
//# sourceMappingURL=fungible-entangler.js.map