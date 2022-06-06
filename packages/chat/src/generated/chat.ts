import { IdlAccounts, Idl } from '@project-serum/anchor';
export const ChatIDLJson: Idl & { metadata?: { address: string } } = {
  "version": "3.2.5",
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
          "name": "sender",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "profile",
          "isMut": false,
          "isSigner": false
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
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "MessageV0"
          }
        }
      ]
    },
    {
      "name": "approveChatIdentifierV0",
      "accounts": [
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
        }
      ],
      "args": []
    },
    {
      "name": "approveUserIdentifierV0",
      "accounts": [
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
            "name": "postPermissionMintOrCollection",
            "type": "publicKey"
          },
          {
            "name": "readPermissionMintOrCollection",
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
            "name": "identifierCertificateMint",
            "type": "publicKey"
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
    }
  ],
  "types": [
    {
      "name": "InitializeChatArgsV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "postPermissionMintOrCollection",
            "type": "publicKey"
          },
          {
            "name": "readPermissionMintOrCollection",
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
      "name": "MessageV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "string"
          },
          {
            "name": "encryptedSymmetricKey",
            "type": "string"
          },
          {
            "name": "readPermissionAmount",
            "type": "u64"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "nextId",
            "type": {
              "option": "string"
            }
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
    }
  ],
  "metadata": {
    "address": "chatGL6yNgZT2Z3BeMYGcgdMpcBKdmxko4C5UhEX4To"
  }
};
export type ChatIDL = {"version":"3.2.5","name":"chat","instructions":[{"name":"initializeNamespacesV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"namespaces","isMut":true,"isSigner":false},{"name":"namespacesProgram","isMut":false,"isSigner":false},{"name":"chatNamespace","isMut":true,"isSigner":false},{"name":"userNamespace","isMut":true,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeNamespacesArgsV0"}}]},{"name":"initializeChatV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"chat","isMut":true,"isSigner":false},{"name":"namespaces","isMut":false,"isSigner":false},{"name":"entry","isMut":false,"isSigner":false},{"name":"identifierCertificateMint","isMut":false,"isSigner":false},{"name":"identifierCertificateMintAccount","isMut":false,"isSigner":false},{"name":"ownerWallet","isMut":false,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeChatArgsV0"}}]},{"name":"initializeProfileV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"walletProfile","isMut":true,"isSigner":false},{"name":"namespaces","isMut":false,"isSigner":false},{"name":"entry","isMut":false,"isSigner":false},{"name":"identifierCertificateMint","isMut":false,"isSigner":false},{"name":"identifierCertificateMintAccount","isMut":false,"isSigner":false},{"name":"ownerWallet","isMut":false,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeProfileArgsV0"}}]},{"name":"initializeDelegateWalletV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"delegateWallet","isMut":true,"isSigner":false},{"name":"owner","isMut":false,"isSigner":true},{"name":"delegate","isMut":false,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false}],"args":[]},{"name":"sendTokenMessageV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"chat","isMut":false,"isSigner":false},{"name":"sender","isMut":false,"isSigner":true},{"name":"profile","isMut":false,"isSigner":false},{"name":"postPermissionAccount","isMut":true,"isSigner":false},{"name":"postPermissionMint","isMut":true,"isSigner":false},{"name":"namespaces","isMut":false,"isSigner":false},{"name":"userNamespace","isMut":false,"isSigner":false},{"name":"entry","isMut":false,"isSigner":false},{"name":"identifierCertificateMint","isMut":false,"isSigner":false},{"name":"identifierCertificateMintAccount","isMut":false,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"MessageV0"}}]},{"name":"approveChatIdentifierV0","accounts":[{"name":"namespaces","isMut":false,"isSigner":false},{"name":"chatNamespace","isMut":false,"isSigner":false},{"name":"claimRequest","isMut":true,"isSigner":false},{"name":"entry","isMut":true,"isSigner":false},{"name":"certificateMintMetadata","isMut":true,"isSigner":false},{"name":"namespacesProgram","isMut":false,"isSigner":false},{"name":"tokenMetadataProgram","isMut":false,"isSigner":false}],"args":[]},{"name":"approveUserIdentifierV0","accounts":[{"name":"namespaces","isMut":false,"isSigner":false},{"name":"userNamespace","isMut":false,"isSigner":false},{"name":"claimRequest","isMut":true,"isSigner":false},{"name":"entry","isMut":true,"isSigner":false},{"name":"certificateMintMetadata","isMut":true,"isSigner":false},{"name":"namespacesProgram","isMut":false,"isSigner":false},{"name":"tokenMetadataProgram","isMut":false,"isSigner":false}],"args":[]}],"accounts":[{"name":"namespacesV0","type":{"kind":"struct","fields":[{"name":"bump","type":"u8"},{"name":"chatNamespace","type":"publicKey"},{"name":"userNamespace","type":"publicKey"}]}},{"name":"chatV0","type":{"kind":"struct","fields":[{"name":"bump","type":"u8"},{"name":"postPermissionMintOrCollection","type":"publicKey"},{"name":"readPermissionMintOrCollection","type":"publicKey"},{"name":"postPermissionAmount","type":"u64"},{"name":"defaultReadPermissionAmount","type":"u64"},{"name":"postPermissionAction","type":{"defined":"PostAction"}},{"name":"identifierCertificateMint","type":"publicKey"},{"name":"name","type":"string"},{"name":"imageUrl","type":"string"},{"name":"metadataUrl","type":"string"},{"name":"postPayDestination","type":{"option":"publicKey"}}]}},{"name":"profileV0","type":{"kind":"struct","fields":[{"name":"bump","type":"u8"},{"name":"ownerWallet","type":"publicKey"},{"name":"identifierCertificateMint","type":"publicKey"},{"name":"imageUrl","type":"string"},{"name":"metadataUrl","type":"string"}]}},{"name":"delegateWalletV0","type":{"kind":"struct","fields":[{"name":"ownerWallet","type":"publicKey"},{"name":"delegateWallet","type":"publicKey"}]}}],"types":[{"name":"InitializeChatArgsV0","type":{"kind":"struct","fields":[{"name":"postPermissionMintOrCollection","type":"publicKey"},{"name":"readPermissionMintOrCollection","type":"publicKey"},{"name":"postPermissionAmount","type":"u64"},{"name":"defaultReadPermissionAmount","type":"u64"},{"name":"postPermissionAction","type":{"defined":"PostAction"}},{"name":"postPayDestination","type":{"option":"publicKey"}},{"name":"name","type":"string"},{"name":"imageUrl","type":"string"},{"name":"metadataUrl","type":"string"}]}},{"name":"InitializeNamespacesArgsV0","type":{"kind":"struct","fields":[{"name":"chatNamespaceName","type":"string"},{"name":"userNamespaceName","type":"string"},{"name":"chatNamespaceBump","type":"u8"},{"name":"userNamespaceBump","type":"u8"}]}},{"name":"InitializeProfileArgsV0","type":{"kind":"struct","fields":[{"name":"imageUrl","type":"string"},{"name":"metadataUrl","type":"string"}]}},{"name":"MessageV0","type":{"kind":"struct","fields":[{"name":"id","type":"string"},{"name":"encryptedSymmetricKey","type":"string"},{"name":"readPermissionAmount","type":"u64"},{"name":"content","type":"string"},{"name":"nextId","type":{"option":"string"}}]}},{"name":"PostAction","type":{"kind":"enum","variants":[{"name":"Hold"},{"name":"Burn"},{"name":"Pay"}]}}],"errors":[{"code":6000,"name":"InvalidStringLength","msg":"Invalid string length, your string was likely too long"},{"code":6001,"name":"PermissionDenied","msg":"You do not have enough tokens to post here"},{"code":6002,"name":"StringNotAlphanumeric","msg":"The string was not alphanumeric"},{"code":6003,"name":"IncorrectSender","msg":"The sender must either be a delegate or owner wallet"}],"metadata":{"address":"chatGL6yNgZT2Z3BeMYGcgdMpcBKdmxko4C5UhEX4To"}};

export type PostAction = Record<string, Record<string, any>>
export const PostAction = {
  Hold: { hold: {} },
  Burn: { burn: {} },
  Pay: { pay: {} }
}
    

  

export type NamespacesV0 = IdlAccounts<ChatIDL>["namespacesV0"]

export type ChatV0 = IdlAccounts<ChatIDL>["chatV0"]

export type ProfileV0 = IdlAccounts<ChatIDL>["profileV0"]

export type DelegateWalletV0 = IdlAccounts<ChatIDL>["delegateWalletV0"]
  
          