import { IdlAccounts, Idl } from "@project-serum/anchor";
export const SplBondingPresaleIDLJson: Idl & {
  metadata?: { address: string };
} = {
  version: "0.0.0",
  name: "spl_bonding_presale",
  instructions: [
    {
      name: "initializeTokenBondingPresaleV0",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "presale",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenBonding",
          isMut: false,
          isSigner: false,
        },
        {
          name: "presaleTokenBonding",
          isMut: false,
          isSigner: false,
        },
        {
          name: "baseStorage",
          isMut: false,
          isSigner: false,
        },
        {
          name: "postTokenBonding",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
        {
          name: "clock",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "args",
          type: {
            defined: "InitializeTokenBondingPresaleV0Args",
          },
        },
      ],
    },
    {
      name: "launchV0",
      accounts: [
        {
          name: "refund",
          isMut: true,
          isSigner: false,
        },
        {
          name: "presale",
          isMut: true,
          isSigner: false,
        },
        {
          name: "presaleTokenBonding",
          isMut: true,
          isSigner: false,
        },
        {
          name: "presaleTokenBondingAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "presaleBaseStorage",
          isMut: true,
          isSigner: false,
        },
        {
          name: "presaleBaseStorageAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "presaleTargetMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "presaleTargetMintAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "postTokenBonding",
          isMut: false,
          isSigner: false,
        },
        {
          name: "postBaseStorage",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenBonding",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenBondingAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "sellBaseRoyalties",
          isMut: false,
          isSigner: false,
        },
        {
          name: "sellTargetRoyalties",
          isMut: false,
          isSigner: false,
        },
        {
          name: "curve",
          isMut: false,
          isSigner: false,
        },
        {
          name: "baseMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "targetMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "targetMintAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "baseStorage",
          isMut: true,
          isSigner: false,
        },
        {
          name: "buyBaseRoyalties",
          isMut: true,
          isSigner: false,
        },
        {
          name: "buyTargetRoyalties",
          isMut: true,
          isSigner: false,
        },
        {
          name: "splTokenBondingProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "clock",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "args",
          type: {
            defined: "LaunchV0Args",
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: "TokenBondingPresaleV0",
      type: {
        kind: "struct",
        fields: [
          {
            name: "tokenBonding",
            type: "publicKey",
          },
          {
            name: "presaleTokenBonding",
            type: "publicKey",
          },
          {
            name: "postTokenBonding",
            type: "publicKey",
          },
          {
            name: "postLaunchTokenBondingAuthority",
            type: "publicKey",
          },
          {
            name: "goLiveUnixTime",
            type: "i64",
          },
          {
            name: "launched",
            type: "bool",
          },
          {
            name: "bumpSeed",
            type: "u8",
          },
          {
            name: "tokenBondingAuthorityBumpSeed",
            type: "u8",
          },
          {
            name: "baseStorageAuthorityBumpSeed",
            type: "u8",
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "InitializeTokenBondingPresaleV0Args",
      type: {
        kind: "struct",
        fields: [
          {
            name: "postLaunchTokenBondingAuthority",
            type: "publicKey",
          },
          {
            name: "bumpSeed",
            type: "u8",
          },
          {
            name: "tokenBondingAuthorityBumpSeed",
            type: "u8",
          },
          {
            name: "baseStorageAuthorityBumpSeed",
            type: "u8",
          },
        ],
      },
    },
    {
      name: "LaunchV0Args",
      type: {
        kind: "struct",
        fields: [
          {
            name: "rootEstimates",
            type: {
              option: {
                array: ["u128", 2],
              },
            },
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 300,
      name: "NoAuthority",
      msg: "Provided account does not have an authority",
    },
    {
      code: 301,
      name: "InvalidBump",
      msg: "The bump provided did not match the canonical bump",
    },
    {
      code: 302,
      name: "InvalidAuthority",
      msg: "Invalid authority passed",
    },
    {
      code: 303,
      name: "PresaleMustFreeze",
      msg: "Presale token bonding must freeze when token bonding opens",
    },
    {
      code: 304,
      name: "ArithmeticError",
      msg: "Error in precise number arithmetic",
    },
  ],
  metadata: {
    address: "7qjwGzGaQshSgD1QiNRrVtxBfqrsBAXwPfoHHN58v4oG",
  },
};
export type SplBondingPresaleIDL = {
  version: "0.0.0";
  name: "spl_bonding_presale";
  instructions: [
    {
      name: "initializeTokenBondingPresaleV0";
      accounts: [
        { name: "payer"; isMut: true; isSigner: true },
        { name: "presale"; isMut: true; isSigner: false },
        { name: "tokenBonding"; isMut: false; isSigner: false },
        { name: "presaleTokenBonding"; isMut: false; isSigner: false },
        { name: "baseStorage"; isMut: false; isSigner: false },
        { name: "postTokenBonding"; isMut: false; isSigner: false },
        { name: "systemProgram"; isMut: false; isSigner: false },
        { name: "rent"; isMut: false; isSigner: false },
        { name: "clock"; isMut: false; isSigner: false }
      ];
      args: [
        {
          name: "args";
          type: { defined: "InitializeTokenBondingPresaleV0Args" };
        }
      ];
    },
    {
      name: "launchV0";
      accounts: [
        { name: "refund"; isMut: true; isSigner: false },
        { name: "presale"; isMut: true; isSigner: false },
        { name: "presaleTokenBonding"; isMut: true; isSigner: false },
        { name: "presaleTokenBondingAuthority"; isMut: false; isSigner: false },
        { name: "presaleBaseStorage"; isMut: true; isSigner: false },
        { name: "presaleBaseStorageAuthority"; isMut: false; isSigner: false },
        { name: "presaleTargetMint"; isMut: true; isSigner: false },
        { name: "presaleTargetMintAuthority"; isMut: false; isSigner: false },
        { name: "postTokenBonding"; isMut: false; isSigner: false },
        { name: "postBaseStorage"; isMut: true; isSigner: false },
        { name: "tokenBonding"; isMut: true; isSigner: false },
        { name: "tokenBondingAuthority"; isMut: false; isSigner: false },
        { name: "sellBaseRoyalties"; isMut: false; isSigner: false },
        { name: "sellTargetRoyalties"; isMut: false; isSigner: false },
        { name: "curve"; isMut: false; isSigner: false },
        { name: "baseMint"; isMut: false; isSigner: false },
        { name: "targetMint"; isMut: true; isSigner: false },
        { name: "targetMintAuthority"; isMut: false; isSigner: false },
        { name: "baseStorage"; isMut: true; isSigner: false },
        { name: "buyBaseRoyalties"; isMut: true; isSigner: false },
        { name: "buyTargetRoyalties"; isMut: true; isSigner: false },
        { name: "splTokenBondingProgram"; isMut: false; isSigner: false },
        { name: "tokenProgram"; isMut: false; isSigner: false },
        { name: "clock"; isMut: false; isSigner: false }
      ];
      args: [{ name: "args"; type: { defined: "LaunchV0Args" } }];
    }
  ];
  accounts: [
    {
      name: "tokenBondingPresaleV0";
      type: {
        kind: "struct";
        fields: [
          { name: "tokenBonding"; type: "publicKey" },
          { name: "presaleTokenBonding"; type: "publicKey" },
          { name: "postTokenBonding"; type: "publicKey" },
          { name: "postLaunchTokenBondingAuthority"; type: "publicKey" },
          { name: "goLiveUnixTime"; type: "i64" },
          { name: "launched"; type: "bool" },
          { name: "bumpSeed"; type: "u8" },
          { name: "tokenBondingAuthorityBumpSeed"; type: "u8" },
          { name: "baseStorageAuthorityBumpSeed"; type: "u8" }
        ];
      };
    }
  ];
  types: [
    {
      name: "InitializeTokenBondingPresaleV0Args";
      type: {
        kind: "struct";
        fields: [
          { name: "postLaunchTokenBondingAuthority"; type: "publicKey" },
          { name: "bumpSeed"; type: "u8" },
          { name: "tokenBondingAuthorityBumpSeed"; type: "u8" },
          { name: "baseStorageAuthorityBumpSeed"; type: "u8" }
        ];
      };
    },
    {
      name: "LaunchV0Args";
      type: {
        kind: "struct";
        fields: [
          { name: "rootEstimates"; type: { option: { array: ["u128", 2] } } }
        ];
      };
    }
  ];
  errors: [
    {
      code: 300;
      name: "NoAuthority";
      msg: "Provided account does not have an authority";
    },
    {
      code: 301;
      name: "InvalidBump";
      msg: "The bump provided did not match the canonical bump";
    },
    { code: 302; name: "InvalidAuthority"; msg: "Invalid authority passed" },
    {
      code: 303;
      name: "PresaleMustFreeze";
      msg: "Presale token bonding must freeze when token bonding opens";
    },
    {
      code: 304;
      name: "ArithmeticError";
      msg: "Error in precise number arithmetic";
    }
  ];
  metadata: { address: "7qjwGzGaQshSgD1QiNRrVtxBfqrsBAXwPfoHHN58v4oG" };
};

export type TokenBondingPresaleV0 =
  IdlAccounts<SplBondingPresaleIDL>["tokenBondingPresaleV0"];
