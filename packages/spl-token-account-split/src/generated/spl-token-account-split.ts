import { IdlAccounts, Idl } from '@wum.bo/anchor';
export const SplTokenAccountSplitIDLJson: Idl & { metadata?: { address: string } } = {
  "version": "0.0.0",
  "name": "spl_token_account_split",
  "instructions": [
    {
      "name": "initializeTokenAccountSplitV0",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "tokenAccountSplit",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenStaking",
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
            "defined": "InitializeTokenAccountSplitV0Args"
          }
        }
      ]
    },
    {
      "name": "collectTokensV0",
      "accounts": [
        {
          "name": "tokenAccountSplit",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccountAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenStaking",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "targetMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakingRewardsSource",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakingRewardsAuthority",
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
            "defined": "CollectTokensV0Args"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "TokenAccountSplitV0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenAccount",
            "type": "publicKey"
          },
          {
            "name": "tokenStaking",
            "type": "publicKey"
          },
          {
            "name": "slotNumber",
            "type": "u16"
          },
          {
            "name": "bumpSeed",
            "type": "u8"
          },
          {
            "name": "tokenAccountAuthorityBumpSeed",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "InitializeTokenAccountSplitV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "slotNumber",
            "type": "u16"
          },
          {
            "name": "bumpSeed",
            "type": "u8"
          },
          {
            "name": "tokenAccountAuthorityBumpSeed",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "CollectTokensV0Args",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "stakingRewardsAmount",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 300,
      "name": "InvalidTokenAccountAuthority",
      "msg": "Invalid token accountn authority"
    },
    {
      "code": 301,
      "name": "ArithmeticError",
      "msg": "Overflow or other checked arithmetic error"
    }
  ]
};
export type SplTokenAccountSplitIDL = {"version":"0.0.0","name":"spl_token_account_split","instructions":[{"name":"initializeTokenAccountSplitV0","accounts":[{"name":"payer","isMut":true,"isSigner":true},{"name":"tokenAccountSplit","isMut":true,"isSigner":false},{"name":"tokenAccount","isMut":false,"isSigner":false},{"name":"tokenStaking","isMut":false,"isSigner":false},{"name":"systemProgram","isMut":false,"isSigner":false},{"name":"rent","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"InitializeTokenAccountSplitV0Args"}}]},{"name":"collectTokensV0","accounts":[{"name":"tokenAccountSplit","isMut":false,"isSigner":false},{"name":"tokenAccount","isMut":true,"isSigner":false},{"name":"tokenAccountAuthority","isMut":false,"isSigner":false},{"name":"tokenStaking","isMut":false,"isSigner":false},{"name":"targetMint","isMut":true,"isSigner":false},{"name":"stakingRewardsSource","isMut":true,"isSigner":false},{"name":"stakingRewardsAuthority","isMut":false,"isSigner":true},{"name":"destination","isMut":true,"isSigner":false},{"name":"tokenProgram","isMut":false,"isSigner":false},{"name":"clock","isMut":false,"isSigner":false}],"args":[{"name":"args","type":{"defined":"CollectTokensV0Args"}}]}],"accounts":[{"name":"tokenAccountSplitV0","type":{"kind":"struct","fields":[{"name":"tokenAccount","type":"publicKey"},{"name":"tokenStaking","type":"publicKey"},{"name":"slotNumber","type":"u16"},{"name":"bumpSeed","type":"u8"},{"name":"tokenAccountAuthorityBumpSeed","type":"u8"}]}}],"types":[{"name":"InitializeTokenAccountSplitV0Args","type":{"kind":"struct","fields":[{"name":"slotNumber","type":"u16"},{"name":"bumpSeed","type":"u8"},{"name":"tokenAccountAuthorityBumpSeed","type":"u8"}]}},{"name":"CollectTokensV0Args","type":{"kind":"struct","fields":[{"name":"stakingRewardsAmount","type":"u64"}]}}],"errors":[{"code":300,"name":"InvalidTokenAccountAuthority","msg":"Invalid token accountn authority"},{"code":301,"name":"ArithmeticError","msg":"Overflow or other checked arithmetic error"}]};



  

export type TokenAccountSplitV0 = IdlAccounts<SplTokenAccountSplitIDL>["tokenAccountSplitV0"]
  
          