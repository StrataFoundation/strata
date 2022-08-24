import { IdlAccounts, Idl } from '@project-serum/anchor';
export const ChatIDLJson: Idl & { metadata?: { address: string } } = {
  "version": "3.9.2",
  "name": "chat",
  "instructions": [
    {
      "name": "initializeNamespacesV0",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "namespaces",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "namespacesProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "chatNamespace",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userNamespace",
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
            "defined": "InitializeNamespacesArgsV0"
          }
        }
      ]
    },
    {
      "name": "claimAdminV0",
      "accounts": [
        {
          "name": "chat",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "identifierCertificateMintAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ownerWallet",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "initializeChatV0",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "chat",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "namespaces",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "entry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "identifierCertificateMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "identifierCertificateMintAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ownerWallet",
          "isMut": false,
          "isSigner": true
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
            "defined": "InitializeChatArgsV0"
          }
        }
      ]
    },
    {
      "name": "initializeUnidentifiedChatV0",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "chat",
          "isMut": true,
          "isSigner": true
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
            "defined": "InitializeChatArgsV0"
          }
        },
        {
          "name": "admin",
          "type": {
            "option": "publicKey"
          }
        }
      ]
    },
    {
      "name": "closeChatV0",
      "accounts": [
        {
          "name": "refund",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "chat",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "closeChatPermissionsV0",
      "accounts": [
        {
          "name": "refund",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "chat",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "chatPermissions",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "initializeChatPermissionsV0",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "chat",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "chatPermissions",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
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
            "defined": "InitializeChatPermissionsArgsV0"
          }
        }
      ]
    },
    {
      "name": "initializeSettingsV0",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "settings",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ownerWallet",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "rent",
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
            "defined": "InitializeSettingsArgsV0"
          }
        }
      ]
    },
    {
      "name": "initializeProfileV0",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "walletProfile",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "namespaces",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "entry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "identifierCertificateMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "identifierCertificateMintAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ownerWallet",
          "isMut": false,
          "isSigner": true
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
            "defined": "InitializeProfileArgsV0"
          }
        }
      ]
    },
    {
      "name": "initializeDelegateWalletV0",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "delegateWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "owner",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "delegate",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "sendTokenMessageV0",
      "accounts": [
        {
          "name": "chat",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "chatPermissions",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "postPermissionAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "postPermissionMint",
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
            "defined": "MessagePartV0"
          }
        }
      ]
    },
    {
      "name": "sendNativeMessageV0",
      "accounts": [
        {
          "name": "chat",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "chatPermissions",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sender",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "MessagePartV0"
          }
        }
      ]
    },
    {
      "name": "approveChatIdentifierV0",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "namespaces",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "chatNamespace",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "claimRequest",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "entry",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "caseInsensitiveMarker",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "certificateMintMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "namespacesProgram",
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
        }
      ],
      "args": []
    },
    {
      "name": "approveUserIdentifierV0",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "namespaces",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userNamespace",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "claimRequest",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "entry",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "caseInsensitiveMarker",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "certificateMintMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "namespacesProgram",
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
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "NamespacesV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "chatNamespace",
            "type": "publicKey"
          },
          {
            "name": "userNamespace",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "ChatV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "chatType",
            "type": {
              "defined": "ChatType"
            }
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "imageUrl",
            "type": "string"
          },
          {
            "name": "metadataUrl",
            "type": "string"
          },
          {
            "name": "postMessageProgramId",
            "type": "publicKey"
          },
          {
            "name": "admin",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "identifierCertificateMint",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "ChatPermissionsV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "chat",
            "type": "publicKey"
          },
          {
            "name": "postPermissionType",
            "type": {
              "defined": "PermissionType"
            }
          },
          {
            "name": "readPermissionType",
            "type": {
              "defined": "PermissionType"
            }
          },
          {
            "name": "postPermissionKey",
            "type": "publicKey"
          },
          {
            "name": "readPermissionKey",
            "type": "publicKey"
          },
          {
            "name": "postPermissionAmount",
            "type": "u64"
          },
          {
            "name": "defaultReadPermissionAmount",
            "type": "u64"
          },
          {
            "name": "postPermissionAction",
            "type": {
              "defined": "PostAction"
            }
          },
          {
            "name": "postPayDestination",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "ProfileV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "ownerWallet",
            "type": "publicKey"
          },
          {
            "name": "identifierCertificateMint",
            "type": "publicKey"
          },
          {
            "name": "imageUrl",
            "type": "string"
          },
          {
            "name": "metadataUrl",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "SettingsV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "ownerWallet",
            "type": "publicKey"
          },
          {
            "name": "encryptedDelegateWallet",
            "type": "string"
          },
          {
            "name": "encryptedSymmetricKey",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "DelegateWalletV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "ownerWallet",
            "type": "publicKey"
          },
          {
            "name": "delegateWallet",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "CaseInsensitiveMarkerV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "certificateMint",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "InitializeChatArgsV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "imageUrl",
            "type": "string"
          },
          {
            "name": "metadataUrl",
            "type": "string"
          },
          {
            "name": "postMessageProgramId",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "InitializeChatPermissionsArgsV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "postPermissionKey",
            "type": "publicKey"
          },
          {
            "name": "readPermissionKey",
            "type": "publicKey"
          },
          {
            "name": "postPermissionAmount",
            "type": "u64"
          },
          {
            "name": "defaultReadPermissionAmount",
            "type": "u64"
          },
          {
            "name": "postPermissionAction",
            "type": {
              "defined": "PostAction"
            }
          },
          {
            "name": "postPermissionType",
            "type": {
              "defined": "PermissionType"
            }
          },
          {
            "name": "readPermissionType",
            "type": {
              "defined": "PermissionType"
            }
          },
          {
            "name": "postPayDestination",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "InitializeNamespacesArgsV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "chatNamespaceName",
            "type": "string"
          },
          {
            "name": "userNamespaceName",
            "type": "string"
          },
          {
            "name": "chatNamespaceBump",
            "type": "u8"
          },
          {
            "name": "userNamespaceBump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "InitializeProfileArgsV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "imageUrl",
            "type": "string"
          },
          {
            "name": "metadataUrl",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "InitializeSettingsArgsV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "encryptedDelegateWallet",
            "type": "string"
          },
          {
            "name": "encryptedSymmetricKey",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "MessagePartV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "string"
          },
          {
            "name": "totalParts",
            "type": "u16"
          },
          {
            "name": "currentPart",
            "type": "u16"
          },
          {
            "name": "readPermissionAmount",
            "type": "u64"
          },
          {
            "name": "encryptedSymmetricKey",
            "type": "string"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "conditionVersion",
            "type": "u8"
          },
          {
            "name": "messageType",
            "type": {
              "defined": "MessageType"
            }
          },
          {
            "name": "referenceMessageId",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "readPermissionKey",
            "type": "publicKey"
          },
          {
            "name": "readPermissionType",
            "type": {
              "defined": "PermissionType"
            }
          }
        ]
      }
    },
    {
      "name": "MessageType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Text"
          },
          {
            "name": "Html"
          },
          {
            "name": "Gify"
          },
          {
            "name": "Image"
          },
          {
            "name": "React"
          }
        ]
      }
    },
    {
      "name": "PostAction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Hold"
          },
          {
            "name": "Burn"
          },
          {
            "name": "Pay"
          }
        ]
      }
    },
    {
      "name": "PermissionType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Token"
          },
          {
            "name": "NFT"
          },
          {
            "name": "Native"
          }
        ]
      }
    },
    {
      "name": "ChatType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Identified"
          },
          {
            "name": "Unidentified"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "MessagePartEventV0",
      "fields": [
        {
          "name": "chat",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "sender",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "signer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "message",
          "type": {
            "defined": "MessagePartV0"
          },
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidStringLength",
      "msg": "Invalid string length, your string was likely too long"
    },
    {
      "code": 6001,
      "name": "PermissionDenied",
      "msg": "You do not have enough tokens to post here"
    },
    {
      "code": 6002,
      "name": "StringNotAlphanumeric",
      "msg": "The string was not alphanumeric"
    },
    {
      "code": 6003,
      "name": "IncorrectSender",
      "msg": "The sender must either be a delegate or owner wallet"
    },
    {
      "code": 6004,
      "name": "InvalidPermissionType",
      "msg": "The permission type was invalid"
    },
    {
      "code": 6005,
      "name": "InvalidDataIncrease",
      "msg": "The realloc increase was too large"
    }
  ],
  "metadata": {
    "address": "chatGL6yNgZT2Z3BeMYGcgdMpcBKdmxko4C5UhEX4To"
  }
};
export type ChatIDL = {"version":"3.9.2","name":"chat","instructions":[{"name":"initializeNamespacesV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"namespaces","isMut":true,"isSigner":false},{"name":"namespacesProgram","isMut":false,"isSigner":false},{"name":"chatNamespace","isMut":true,"isSigner":false},{"name":"userNamespace","isMut":true,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeNamespacesArgsV0"}}]},{"name":"claimAdminV0","accounts":[{"name":"chat","isMut":false,"isSigner":false},{"name":"identifierCertificateMintAccount","isMut":false,"isSigner":false},{"name":"ownerWallet","isMut":false,"isSigner":true}],"args":[]},{"name":"initializeChatV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"chat","isMut":true,"isSigner":false},{"name":"namespaces","isMut":false,"isSigner":false},{"name":"entry","isMut":false,"isSigner":false},{"name":"identifierCertificateMint","isMut":false,"isSigner":false},{"name":"identifierCertificateMintAccount","isMut":false,"isSigner":false},{"name":"ownerWallet","isMut":false,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeChatArgsV0"}}]},{"name":"initializeUnidentifiedChatV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"chat","isMut":true,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeChatArgsV0"}},{"name":"admin","type":{"option":"publicKey"}}]},{"name":"closeChatV0","accounts":[{"name":"refund","isMut":true,"isSigner":false},{"name":"chat","isMut":true,"isSigner":false},{"name":"admin","isMut":false,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[]},{"name":"closeChatPermissionsV0","accounts":[{"name":"refund","isMut":true,"isSigner":false},{"name":"chat","isMut":false,"isSigner":false},{"name":"chatPermissions","isMut":true,"isSigner":false},{"name":"admin","isMut":false,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[]},{"name":"initializeChatPermissionsV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"chat","isMut":false,"isSigner":false},{"name":"chatPermissions","isMut":true,"isSigner":false},{"name":"admin","isMut":false,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeChatPermissionsArgsV0"}}]},{"name":"initializeSettingsV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"settings","isMut":true,"isSigner":false},{"name":"ownerWallet","isMut":false,"isSigner":true},{"name":"rent","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeSettingsArgsV0"}}]},{"name":"initializeProfileV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"walletProfile","isMut":true,"isSigner":false},{"name":"namespaces","isMut":false,"isSigner":false},{"name":"entry","isMut":false,"isSigner":false},{"name":"identifierCertificateMint","isMut":false,"isSigner":false},{"name":"identifierCertificateMintAccount","isMut":false,"isSigner":false},{"name":"ownerWallet","isMut":false,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeProfileArgsV0"}}]},{"name":"initializeDelegateWalletV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"delegateWallet","isMut":true,"isSigner":false},{"name":"owner","isMut":false,"isSigner":true},{"name":"delegate","isMut":false,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[]},{"name":"sendTokenMessageV0","accounts":[{"name":"chat","isMut":false,"isSigner":false},{"name":"chatPermissions","isMut":false,"isSigner":false},{"name":"signer","isMut":false,"isSigner":true},{"name":"postPermissionAccount","isMut":true,"isSigner":false},{"name":"postPermissionMint","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"MessagePartV0"}}]},{"name":"sendNativeMessageV0","accounts":[{"name":"chat","isMut":false,"isSigner":false},{"name":"chatPermissions","isMut":false,"isSigner":false},{"name":"sender","isMut":false,"isSigner":false},{"name":"signer","isMut":false,"isSigner":true}],"args":[{"name":"args","type":{"defined":"MessagePartV0"}}]},{"name":"approveChatIdentifierV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"namespaces","isMut":false,"isSigner":false},{"name":"chatNamespace","isMut":false,"isSigner":false},{"name":"claimRequest","isMut":true,"isSigner":false},{"name":"entry","isMut":true,"isSigner":false},{"name":"caseInsensitiveMarker","isMut":true,"isSigner":false},{"name":"certificateMintMetadata","isMut":true,"isSigner":false},{"name":"namespacesProgram","isMut":false,"isSigner":false},{"name":"tokenMetadataProgram","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[]},{"name":"approveUserIdentifierV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"namespaces","isMut":false,"isSigner":false},{"name":"userNamespace","isMut":false,"isSigner":false},{"name":"claimRequest","isMut":true,"isSigner":false},{"name":"entry","isMut":true,"isSigner":false},{"name":"caseInsensitiveMarker","isMut":true,"isSigner":false},{"name":"certificateMintMetadata","isMut":true,"isSigner":false},{"name":"namespacesProgram","isMut":false,"isSigner":false},{"name":"tokenMetadataProgram","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[]}],"accounts":[{"name":"namespacesV0","type":{"kind":"struct","fields":[{"name":"bump","type":"u8"},{"name":"chatNamespace","type":"publicKey"},{"name":"userNamespace","type":"publicKey"}]}},{"name":"chatV0","type":{"kind":"struct","fields":[{"name":"bump","type":"u8"},{"name":"chatType","type":{"defined":"ChatType"}},{"name":"name","type":"string"},{"name":"imageUrl","type":"string"},{"name":"metadataUrl","type":"string"},{"name":"postMessageProgramId","type":"publicKey"},{"name":"admin","type":{"option":"publicKey"}},{"name":"identifierCertificateMint","type":{"option":"publicKey"}}]}},{"name":"chatPermissionsV0","type":{"kind":"struct","fields":[{"name":"bump","type":"u8"},{"name":"chat","type":"publicKey"},{"name":"postPermissionType","type":{"defined":"PermissionType"}},{"name":"readPermissionType","type":{"defined":"PermissionType"}},{"name":"postPermissionKey","type":"publicKey"},{"name":"readPermissionKey","type":"publicKey"},{"name":"postPermissionAmount","type":"u64"},{"name":"defaultReadPermissionAmount","type":"u64"},{"name":"postPermissionAction","type":{"defined":"PostAction"}},{"name":"postPayDestination","type":{"option":"publicKey"}}]}},{"name":"profileV0","type":{"kind":"struct","fields":[{"name":"bump","type":"u8"},{"name":"ownerWallet","type":"publicKey"},{"name":"identifierCertificateMint","type":"publicKey"},{"name":"imageUrl","type":"string"},{"name":"metadataUrl","type":"string"}]}},{"name":"settingsV0","type":{"kind":"struct","fields":[{"name":"bump","type":"u8"},{"name":"ownerWallet","type":"publicKey"},{"name":"encryptedDelegateWallet","type":"string"},{"name":"encryptedSymmetricKey","type":"string"}]}},{"name":"delegateWalletV0","type":{"kind":"struct","fields":[{"name":"ownerWallet","type":"publicKey"},{"name":"delegateWallet","type":"publicKey"}]}},{"name":"caseInsensitiveMarkerV0","type":{"kind":"struct","fields":[{"name":"bump","type":"u8"},{"name":"certificateMint","type":"publicKey"}]}}],"types":[{"name":"InitializeChatArgsV0","type":{"kind":"struct","fields":[{"name":"name","type":"string"},{"name":"imageUrl","type":"string"},{"name":"metadataUrl","type":"string"},{"name":"postMessageProgramId","type":"publicKey"}]}},{"name":"InitializeChatPermissionsArgsV0","type":{"kind":"struct","fields":[{"name":"postPermissionKey","type":"publicKey"},{"name":"readPermissionKey","type":"publicKey"},{"name":"postPermissionAmount","type":"u64"},{"name":"defaultReadPermissionAmount","type":"u64"},{"name":"postPermissionAction","type":{"defined":"PostAction"}},{"name":"postPermissionType","type":{"defined":"PermissionType"}},{"name":"readPermissionType","type":{"defined":"PermissionType"}},{"name":"postPayDestination","type":{"option":"publicKey"}}]}},{"name":"InitializeNamespacesArgsV0","type":{"kind":"struct","fields":[{"name":"chatNamespaceName","type":"string"},{"name":"userNamespaceName","type":"string"},{"name":"chatNamespaceBump","type":"u8"},{"name":"userNamespaceBump","type":"u8"}]}},{"name":"InitializeProfileArgsV0","type":{"kind":"struct","fields":[{"name":"imageUrl","type":"string"},{"name":"metadataUrl","type":"string"}]}},{"name":"InitializeSettingsArgsV0","type":{"kind":"struct","fields":[{"name":"encryptedDelegateWallet","type":"string"},{"name":"encryptedSymmetricKey","type":"string"}]}},{"name":"MessagePartV0","type":{"kind":"struct","fields":[{"name":"id","type":"string"},{"name":"totalParts","type":"u16"},{"name":"currentPart","type":"u16"},{"name":"readPermissionAmount","type":"u64"},{"name":"encryptedSymmetricKey","type":"string"},{"name":"content","type":"string"},{"name":"conditionVersion","type":"u8"},{"name":"messageType","type":{"defined":"MessageType"}},{"name":"referenceMessageId","type":{"option":"string"}},{"name":"readPermissionKey","type":"publicKey"},{"name":"readPermissionType","type":{"defined":"PermissionType"}}]}},{"name":"MessageType","type":{"kind":"enum","variants":[{"name":"Text"},{"name":"Html"},{"name":"Gify"},{"name":"Image"},{"name":"React"}]}},{"name":"PostAction","type":{"kind":"enum","variants":[{"name":"Hold"},{"name":"Burn"},{"name":"Pay"}]}},{"name":"PermissionType","type":{"kind":"enum","variants":[{"name":"Token"},{"name":"NFT"},{"name":"Native"}]}},{"name":"ChatType","type":{"kind":"enum","variants":[{"name":"Identified"},{"name":"Unidentified"}]}}],"events":[{"name":"MessagePartEventV0","fields":[{"name":"chat","type":"publicKey","index":false},{"name":"sender","type":"publicKey","index":false},{"name":"signer","type":"publicKey","index":false},{"name":"message","type":{"defined":"MessagePartV0"},"index":false}]}],"errors":[{"code":6000,"name":"InvalidStringLength","msg":"Invalid string length, your string was likely too long"},{"code":6001,"name":"PermissionDenied","msg":"You do not have enough tokens to post here"},{"code":6002,"name":"StringNotAlphanumeric","msg":"The string was not alphanumeric"},{"code":6003,"name":"IncorrectSender","msg":"The sender must either be a delegate or owner wallet"},{"code":6004,"name":"InvalidPermissionType","msg":"The permission type was invalid"},{"code":6005,"name":"InvalidDataIncrease","msg":"The realloc increase was too large"}],"metadata":{"address":"chatGL6yNgZT2Z3BeMYGcgdMpcBKdmxko4C5UhEX4To"}};

export type MessageType = Record<string, Record<string, any>>
export const MessageType = {
  Text: { text: {} },
  Html: { html: {} },
  Gify: { gify: {} },
  Image: { image: {} },
  React: { react: {} }
}
    

export type PostAction = Record<string, Record<string, any>>
export const PostAction = {
  Hold: { hold: {} },
  Burn: { burn: {} },
  Pay: { pay: {} }
}
    

export type PermissionType = Record<string, Record<string, any>>
export const PermissionType = {
  Token: { token: {} },
  NFT: { nft: {} },
  Native: { native: {} }
}
    

export type ChatType = Record<string, Record<string, any>>
export const ChatType = {
  Identified: { identified: {} },
  Unidentified: { unidentified: {} }
}
    

  

export type NamespacesV0 = IdlAccounts<ChatIDL>["namespacesV0"]

export type ChatV0 = IdlAccounts<ChatIDL>["chatV0"]

export type ChatPermissionsV0 = IdlAccounts<ChatIDL>["chatPermissionsV0"]

export type ProfileV0 = IdlAccounts<ChatIDL>["profileV0"]

export type SettingsV0 = IdlAccounts<ChatIDL>["settingsV0"]

export type DelegateWalletV0 = IdlAccounts<ChatIDL>["delegateWalletV0"]

export type CaseInsensitiveMarkerV0 = IdlAccounts<ChatIDL>["caseInsensitiveMarkerV0"]
  
          