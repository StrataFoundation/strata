import { IdlAccounts, Idl } from '@wum.bo/anchor';
export const SplWumboIDLJson: Idl & { metadata?: { address: string } } = {
  "version": "0.0.0",
  "name": "spl_wumbo",
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
            "defined": "InitializeCollectiveArgs"
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
          "name": "authority",
          "isMut": false,
          "isSigner": true
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
          "name": "collective",
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
          "name": "tokenMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBondingAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataUpdateAuthority",
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
          "name": "tokenBondingProgram",
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
            "name": "isOpen",
            "type": "bool"
          },
          {
            "name": "authority",
            "type": {
              "option": "publicKey"
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
            "name": "tokenRefBumpSeed",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "InitializeCollectiveArgs",
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
            "name": "isOpen",
            "type": "bool"
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
            "name": "collectiveBumpSeed",
            "type": "u8"
          },
          {
            "name": "tokenBondingAuthorityBumpSeed",
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
    }
  ],
  "metadata": {
    "address": "WumbodN8t7wcDPCY2nGszs4x6HRtL5mJcTR519Qr6m7"
  }
};
export type SplWumboIDL = {"version":"0.0.0","name":"spl_wumbo","instructions":[{"name":"initializeCollectiveV0","accounts":[{"name":"collective","isMut":true,"isSigner":false},{"name":"mint","isMut":false,"isSigner":false},{"name":"mintAuthority","isMut":false,"isSigner":true},{"name":"payer","isMut":true,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeCollectiveArgs"}}]},{"name":"initializeOwnedSocialTokenV0","accounts":[{"name":"initializeArgs","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"collective","isMut":false,"isSigner":false},{"name":"tokenBonding","isMut":false,"isSigner":false},{"name":"tokenMetadata","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}]},{"name":"authority","isMut":false,"isSigner":false},{"name":"payer","isMut":true,"isSigner":true},{"name":"tokenRef","isMut":true,"isSigner":false},{"name":"reverseTokenRef","isMut":true,"isSigner":false},{"name":"owner","isMut":false,"isSigner":true},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeSocialTokenV0Args"}}]},{"name":"initializeUnclaimedSocialTokenV0","accounts":[{"name":"initializeArgs","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"collective","isMut":false,"isSigner":false},{"name":"tokenBonding","isMut":false,"isSigner":false},{"name":"tokenMetadata","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}]},{"name":"authority","isMut":false,"isSigner":true},{"name":"payer","isMut":true,"isSigner":true},{"name":"tokenRef","isMut":true,"isSigner":false},{"name":"reverseTokenRef","isMut":true,"isSigner":false},{"name":"name","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeSocialTokenV0Args"}}]},{"name":"claimSocialTokenV0","accounts":[{"name":"collective","isMut":false,"isSigner":false},{"name":"tokenRef","isMut":true,"isSigner":false},{"name":"newTokenRef","isMut":true,"isSigner":false},{"name":"reverseTokenRef","isMut":true,"isSigner":false},{"name":"tokenBonding","isMut":true,"isSigner":false},{"name":"tokenMetadata","isMut":true,"isSigner":false},{"name":"tokenBondingAuthority","isMut":false,"isSigner":false},{"name":"metadataUpdateAuthority","isMut":false,"isSigner":false},{"name":"name","isMut":false,"isSigner":false},{"name":"owner","isMut":false,"isSigner":true},{"name":"baseMint","isMut":false,"isSigner":false},{"name":"targetMint","isMut":false,"isSigner":false},{"name":"buyBaseRoyalties","isMut":false,"isSigner":false},{"name":"buyTargetRoyalties","isMut":false,"isSigner":false},{"name":"sellBaseRoyalties","isMut":false,"isSigner":false},{"name":"sellTargetRoyalties","isMut":false,"isSigner":false},{"name":"tokenBondingProgram","isMut":false,"isSigner":false},{"name":"tokenMetadataProgram","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"ClaimSocialTokenV0Args"}}]}],"accounts":[{"name":"collectiveV0","type":{"kind":"struct","fields":[{"name":"mint","type":"publicKey"},{"name":"isOpen","type":"bool"},{"name":"authority","type":{"option":"publicKey"}},{"name":"bumpSeed","type":"u8"}]}},{"name":"tokenRefV0","type":{"kind":"struct","fields":[{"name":"collective","type":"publicKey"},{"name":"tokenMetadata","type":"publicKey"},{"name":"mint","type":"publicKey"},{"name":"tokenBonding","type":"publicKey"},{"name":"name","type":{"option":"publicKey"}},{"name":"owner","type":{"option":"publicKey"}},{"name":"isClaimed","type":"bool"},{"name":"bumpSeed","type":"u8"},{"name":"tokenBondingAuthorityBumpSeed","type":"u8"},{"name":"targetRoyaltiesOwnerBumpSeed","type":"u8"},{"name":"tokenMetadataUpdateAuthorityBumpSeed","type":"u8"}]}}],"types":[{"name":"ClaimSocialTokenV0Args","type":{"kind":"struct","fields":[{"name":"tokenRefBumpSeed","type":"u8"}]}},{"name":"InitializeCollectiveArgs","type":{"kind":"struct","fields":[{"name":"bumpSeed","type":"u8"},{"name":"authority","type":{"option":"publicKey"}},{"name":"isOpen","type":"bool"}]}},{"name":"InitializeSocialTokenV0Args","type":{"kind":"struct","fields":[{"name":"nameParent","type":{"option":"publicKey"}},{"name":"nameClass","type":{"option":"publicKey"}},{"name":"collectiveBumpSeed","type":"u8"},{"name":"tokenBondingAuthorityBumpSeed","type":"u8"},{"name":"tokenRefBumpSeed","type":"u8"},{"name":"reverseTokenRefBumpSeed","type":"u8"},{"name":"tokenMetadataUpdateAuthorityBumpSeed","type":"u8"}]}},{"name":"UpdateMetadataAccountArgs","type":{"kind":"struct","fields":[{"name":"name","type":"string"},{"name":"symbol","type":"string"},{"name":"uri","type":"string"}]}}],"errors":[{"code":300,"name":"NoAuthority","msg":"Provided account does not have an authority"},{"code":301,"name":"InvalidBump","msg":"The bump provided did not match the canonical bump"},{"code":302,"name":"InvalidAuthority","msg":"Invalid authority passed"}],"metadata":{"address":"WumbodN8t7wcDPCY2nGszs4x6HRtL5mJcTR519Qr6m7"}};



  

export type CollectiveV0 = IdlAccounts<SplWumboIDL>["collectiveV0"]

export type TokenRefV0 = IdlAccounts<SplWumboIDL>["tokenRefV0"]
  
          