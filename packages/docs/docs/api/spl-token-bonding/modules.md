---
id: "modules"
title: "@strata-foundation/spl-token-bonding"
sidebar_label: "Exports"
sidebar_position: 0.5
custom_edit_url: null
---

## Classes

- [ExponentialCurve](classes/ExponentialCurve)
- [ExponentialCurveConfig](classes/ExponentialCurveConfig)
- [SplTokenBonding](classes/SplTokenBonding)
- [TimeCurveConfig](classes/TimeCurveConfig)

## Interfaces

- [Curve](interfaces/Curve)
- [IBuyArgs](interfaces/IBuyArgs)
- [ICreateTokenBondingArgs](interfaces/ICreateTokenBondingArgs)
- [IInitializeCurveArgs](interfaces/IInitializeCurveArgs)
- [ISellArgs](interfaces/ISellArgs)
- [IUpdateTokenBondingArgs](interfaces/IUpdateTokenBondingArgs)

## Type aliases

### CurveV0

Ƭ **CurveV0**: `IdlAccounts`<[`SplTokenBondingIDL`](modules#spltokenbondingidl)\>[``"curveV0"``]

#### Defined in

[packages/spl-token-bonding/src/generated/spl-token-bonding.ts:1133](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/generated/spl-token-bonding.ts#L1133)

___

### ExponentialCurveV0

Ƭ **ExponentialCurveV0**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `b` | `BN` |
| `c` | `BN` |
| `frac` | `number` |
| `pow` | `number` |

#### Defined in

[packages/spl-token-bonding/src/curves.ts:5](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L5)

___

### PiecewiseCurve

Ƭ **PiecewiseCurve**: `Record`<`string`, `Record`<`string`, `any`\>\>

#### Defined in

[packages/spl-token-bonding/src/generated/spl-token-bonding.ts:1123](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/generated/spl-token-bonding.ts#L1123)

___

### PrimitiveCurve

Ƭ **PrimitiveCurve**: `Record`<`string`, `Record`<`string`, `any`\>\>

#### Defined in

[packages/spl-token-bonding/src/generated/spl-token-bonding.ts:1117](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/generated/spl-token-bonding.ts#L1117)

___

### ProgramStateV0

Ƭ **ProgramStateV0**: `IdlAccounts`<[`SplTokenBondingIDL`](modules#spltokenbondingidl)\>[``"programStateV0"``]

#### Defined in

[packages/spl-token-bonding/src/generated/spl-token-bonding.ts:1131](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/generated/spl-token-bonding.ts#L1131)

___

### SplTokenBondingIDL

Ƭ **SplTokenBondingIDL**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `accounts` | [{ `name`: ``"programStateV0"`` ; `type`: { `fields`: [{ `name`: ``"wrappedSolMint"`` ; `type`: ``"publicKey"``  }, { `name`: ``"solStorage"`` ; `type`: ``"publicKey"``  }, { `name`: ``"mintAuthorityBumpSeed"`` ; `type`: ``"u8"``  }, { `name`: ``"solStorageBumpSeed"`` ; `type`: ``"u8"``  }, { `name`: ``"bumpSeed"`` ; `type`: ``"u8"``  }] ; `kind`: ``"struct"``  }  }, { `name`: ``"curveV0"`` ; `type`: { `fields`: [{ `name`: ``"definition"`` ; `type`: { `defined`: ``"PiecewiseCurve"``  }  }] ; `kind`: ``"struct"``  }  }, { `name`: ``"tokenBondingV0"`` ; `type`: { `fields`: [{ `name`: ``"baseMint"`` ; `type`: ``"publicKey"``  }, { `name`: ``"targetMint"`` ; `type`: ``"publicKey"``  }, { `name`: ``"authority"`` ; `type`: { `option`: ``"publicKey"``  }  }, { `name`: ``"baseStorage"`` ; `type`: ``"publicKey"``  }, { `name`: ``"buyBaseRoyalties"`` ; `type`: ``"publicKey"``  }, { `name`: ``"buyTargetRoyalties"`` ; `type`: ``"publicKey"``  }, { `name`: ``"sellBaseRoyalties"`` ; `type`: ``"publicKey"``  }, { `name`: ``"sellTargetRoyalties"`` ; `type`: ``"publicKey"``  }, { `name`: ``"buyBaseRoyaltyPercentage"`` ; `type`: ``"u32"``  }, { `name`: ``"buyTargetRoyaltyPercentage"`` ; `type`: ``"u32"``  }, { `name`: ``"sellBaseRoyaltyPercentage"`` ; `type`: ``"u32"``  }, { `name`: ``"sellTargetRoyaltyPercentage"`` ; `type`: ``"u32"``  }, { `name`: ``"curve"`` ; `type`: ``"publicKey"``  }, { `name`: ``"mintCap"`` ; `type`: { `option`: ``"u64"``  }  }, { `name`: ``"purchaseCap"`` ; `type`: { `option`: ``"u64"``  }  }, { `name`: ``"goLiveUnixTime"`` ; `type`: ``"i64"``  }, { `name`: ``"freezeBuyUnixTime"`` ; `type`: { `option`: ``"i64"``  }  }, { `name`: ``"createdAtUnixTime"`` ; `type`: ``"i64"``  }, { `name`: ``"buyFrozen"`` ; `type`: ``"bool"``  }, { `name`: ``"sellFrozen"`` ; `type`: ``"bool"``  }, { `name`: ``"index"`` ; `type`: ``"u16"``  }, { `name`: ``"bumpSeed"`` ; `type`: ``"u8"``  }, { `name`: ``"baseStorageBumpSeed"`` ; `type`: ``"u8"``  }, { `name`: ``"targetMintAuthorityBumpSeed"`` ; `type`: ``"u8"``  }, { `name`: ``"baseStorageAuthorityBumpSeed"`` ; `type`: { `option`: ``"u8"``  }  }] ; `kind`: ``"struct"``  }  }] |
| `errors` | [{ `code`: ``300`` ; `msg`: ``"Target mint must have an authority"`` ; `name`: ``"NoMintAuthority"``  }, { `code`: ``301`` ; `msg`: ``"Target mint must have an authority that is a pda of this program"`` ; `name`: ``"InvalidMintAuthority"``  }, { `code`: ``302`` ; `msg`: ``"Invalid base storage authority pda or seed did not match canonical seed for base storage authority"`` ; `name`: ``"InvalidBaseStorageAuthority"``  }, { `code`: ``303`` ; `msg`: ``"Token bonding does not have an authority"`` ; `name`: ``"NoAuthority"``  }, { `code`: ``304`` ; `msg`: ``"Error in precise number arithmetic"`` ; `name`: ``"ArithmeticError"``  }, { `code`: ``305`` ; `msg`: ``"Buy price was higher than the maximum buy price. Try increasing max_price or slippage configuration"`` ; `name`: ``"PriceTooHigh"``  }, { `code`: ``306`` ; `msg`: ``"Sell price was lower than the minimum sell price. Try decreasing min_price or increasing slippage configuration"`` ; `name`: ``"PriceTooLow"``  }, { `code`: ``307`` ; `msg`: ``"Cannot sell more than the target mint currently has in supply"`` ; `name`: ``"MintSupplyTooLow"``  }, { `code`: ``308`` ; `msg`: ``"Sell is not enabled on this bonding curve"`` ; `name`: ``"SellDisabled"``  }, { `code`: ``309`` ; `msg`: ``"This bonding curve is not live yet"`` ; `name`: ``"NotLiveYet"``  }, { `code`: ``310`` ; `msg`: ``"Passed the mint cap"`` ; `name`: ``"PassedMintCap"``  }, { `code`: ``311`` ; `msg`: ``"Cannot purchase that many tokens because of purchase cap"`` ; `name`: ``"OverPurchaseCap"``  }, { `code`: ``312`` ; `msg`: ``"Buy is frozen on this bonding curve, purchases not allowed"`` ; `name`: ``"BuyFrozen"``  }, { `code`: ``313`` ; `msg`: ``"Use token bonding wrapped sol via buy_wrapped_sol, sell_wrapped_sol commands. We may one day provide liquid staking rewards on this stored sol."`` ; `name`: ``"WrappedSolNotAllowed"``  }] |
| `instructions` | [{ `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"state"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"solStorage"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"wrappedSolMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"mintAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"rent"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeSolStorageV0Args"``  }  }] ; `name`: ``"initializeSolStorageV0"``  }, { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"state"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"wrappedSolMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"mintAuthority"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"solStorage"``  }, { `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"source"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"destination"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"BuyWrappedSolV0Args"``  }  }] ; `name`: ``"buyWrappedSolV0"``  }, { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"state"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"wrappedSolMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"solStorage"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"source"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"owner"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"destination"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"SellWrappedSolV0Args"``  }  }] ; `name`: ``"sellWrappedSolV0"``  }, { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"rent"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"CreateCurveV0Args"``  }  }] ; `name`: ``"createCurveV0"``  }, { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"buyBaseRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"buyTargetRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"sellBaseRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"sellTargetRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"rent"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"clock"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeTokenBondingV0Args"``  }  }] ; `name`: ``"initializeTokenBondingV0"``  }, { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"refund"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"authority"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMintAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseStorageAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }] ; `args`: [] ; `name`: ``"closeTokenBondingV0"``  }, { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"authority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"buyBaseRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"buyTargetRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"sellBaseRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"sellTargetRoyalties"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"UpdateTokenBondingV0Args"``  }  }] ; `name`: ``"updateTokenBondingV0"``  }, { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMintAuthority"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"buyBaseRoyalties"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"buyTargetRoyalties"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"source"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"sourceAuthority"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"destination"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"clock"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"BuyV0Args"``  }  }] ; `name`: ``"buyV0"``  }, { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"sellBaseRoyalties"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"sellTargetRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseStorageAuthority"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"source"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"sourceAuthority"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"destination"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"clock"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"SellV0Args"``  }  }] ; `name`: ``"sellV0"``  }] |
| `metadata` | `Object` |
| `metadata.address` | ``"TBondz6ZwSM5fs4v2GpnVBMuwoncPkFLFR9S422ghhN"`` |
| `name` | ``"spl_token_bonding"`` |
| `types` | [{ `name`: ``"InitializeTokenBondingV0Args"`` ; `type`: { `fields`: [{ `name`: ``"buyBaseRoyaltyPercentage"`` ; `type`: ``"u32"``  }, { `name`: ``"buyTargetRoyaltyPercentage"`` ; `type`: ``"u32"``  }, { `name`: ``"sellBaseRoyaltyPercentage"`` ; `type`: ``"u32"``  }, { `name`: ``"sellTargetRoyaltyPercentage"`` ; `type`: ``"u32"``  }, { `name`: ``"goLiveUnixTime"`` ; `type`: ``"i64"``  }, { `name`: ``"freezeBuyUnixTime"`` ; `type`: { `option`: ``"i64"``  }  }, { `name`: ``"mintCap"`` ; `type`: { `option`: ``"u64"``  }  }, { `name`: ``"purchaseCap"`` ; `type`: { `option`: ``"u64"``  }  }, { `name`: ``"tokenBondingAuthority"`` ; `type`: { `option`: ``"publicKey"``  }  }, { `name`: ``"baseStorageAuthority"`` ; `type`: { `option`: ``"publicKey"``  }  }, { `name`: ``"buyFrozen"`` ; `type`: ``"bool"``  }, { `name`: ``"index"`` ; `type`: ``"u16"``  }, { `name`: ``"bumpSeed"`` ; `type`: ``"u8"``  }, { `name`: ``"targetMintAuthorityBumpSeed"`` ; `type`: ``"u8"``  }, { `name`: ``"baseStorageAuthorityBumpSeed"`` ; `type`: { `option`: ``"u8"``  }  }] ; `kind`: ``"struct"``  }  }, { `name`: ``"UpdateTokenBondingV0Args"`` ; `type`: { `fields`: [{ `name`: ``"tokenBondingAuthority"`` ; `type`: { `option`: ``"publicKey"``  }  }, { `name`: ``"buyBaseRoyaltyPercentage"`` ; `type`: ``"u32"``  }, { `name`: ``"buyTargetRoyaltyPercentage"`` ; `type`: ``"u32"``  }, { `name`: ``"sellBaseRoyaltyPercentage"`` ; `type`: ``"u32"``  }, { `name`: ``"sellTargetRoyaltyPercentage"`` ; `type`: ``"u32"``  }, { `name`: ``"buyFrozen"`` ; `type`: ``"bool"``  }] ; `kind`: ``"struct"``  }  }, { `name`: ``"BuyWithBaseV0Args"`` ; `type`: { `fields`: [{ `name`: ``"baseAmount"`` ; `type`: ``"u64"``  }, { `name`: ``"minimumTargetAmount"`` ; `type`: ``"u64"``  }] ; `kind`: ``"struct"``  }  }, { `name`: ``"BuyTargetAmountV0Args"`` ; `type`: { `fields`: [{ `name`: ``"targetAmount"`` ; `type`: ``"u64"``  }, { `name`: ``"maximumPrice"`` ; `type`: ``"u64"``  }] ; `kind`: ``"struct"``  }  }, { `name`: ``"BuyV0Args"`` ; `type`: { `fields`: [{ `name`: ``"buyWithBase"`` ; `type`: { `option`: { `defined`: ``"BuyWithBaseV0Args"``  }  }  }, { `name`: ``"buyTargetAmount"`` ; `type`: { `option`: { `defined`: ``"BuyTargetAmountV0Args"``  }  }  }, { `name`: ``"rootEstimates"`` ; `type`: { `option`: { `array`: [``"u128"``, ``2``]  }  }  }] ; `kind`: ``"struct"``  }  }, { `name`: ``"SellV0Args"`` ; `type`: { `fields`: [{ `name`: ``"targetAmount"`` ; `type`: ``"u64"``  }, { `name`: ``"minimumPrice"`` ; `type`: ``"u64"``  }, { `name`: ``"rootEstimates"`` ; `type`: { `option`: { `array`: [``"u128"``, ``2``]  }  }  }] ; `kind`: ``"struct"``  }  }, { `name`: ``"InitializeSolStorageV0Args"`` ; `type`: { `fields`: [{ `name`: ``"mintAuthorityBumpSeed"`` ; `type`: ``"u8"``  }, { `name`: ``"solStorageBumpSeed"`` ; `type`: ``"u8"``  }, { `name`: ``"bumpSeed"`` ; `type`: ``"u8"``  }] ; `kind`: ``"struct"``  }  }, { `name`: ``"BuyWrappedSolV0Args"`` ; `type`: { `fields`: [{ `name`: ``"amount"`` ; `type`: ``"u64"``  }] ; `kind`: ``"struct"``  }  }, { `name`: ``"SellWrappedSolV0Args"`` ; `type`: { `fields`: [{ `name`: ``"amount"`` ; `type`: ``"u64"``  }, { `name`: ``"all"`` ; `type`: ``"bool"``  }] ; `kind`: ``"struct"``  }  }, { `name`: ``"CreateCurveV0Args"`` ; `type`: { `fields`: [{ `name`: ``"definition"`` ; `type`: { `defined`: ``"PiecewiseCurve"``  }  }] ; `kind`: ``"struct"``  }  }, { `name`: ``"TimeCurveV0"`` ; `type`: { `fields`: [{ `name`: ``"offset"`` ; `type`: ``"i64"``  }, { `name`: ``"curve"`` ; `type`: { `defined`: ``"PrimitiveCurve"``  }  }] ; `kind`: ``"struct"``  }  }, { `name`: ``"PrimitiveCurve"`` ; `type`: { `kind`: ``"enum"`` ; `variants`: [{ `fields`: [{ `name`: ``"c"`` ; `type`: ``"u128"``  }, { `name`: ``"b"`` ; `type`: ``"u128"``  }, { `name`: ``"pow"`` ; `type`: ``"u8"``  }, { `name`: ``"frac"`` ; `type`: ``"u8"``  }] ; `name`: ``"ExponentialCurveV0"``  }]  }  }, { `name`: ``"PiecewiseCurve"`` ; `type`: { `kind`: ``"enum"`` ; `variants`: [{ `fields`: [{ `name`: ``"curves"`` ; `type`: { `vec`: { `defined`: ``"TimeCurveV0"``  }  }  }] ; `name`: ``"TimeV0"``  }]  }  }] |
| `version` | ``"0.0.0"`` |

#### Defined in

[packages/spl-token-bonding/src/generated/spl-token-bonding.ts:1115](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/generated/spl-token-bonding.ts#L1115)

___

### TokenBondingV0

Ƭ **TokenBondingV0**: `IdlAccounts`<[`SplTokenBondingIDL`](modules#spltokenbondingidl)\>[``"tokenBondingV0"``]

#### Defined in

[packages/spl-token-bonding/src/generated/spl-token-bonding.ts:1135](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/generated/spl-token-bonding.ts#L1135)

## Variables

### PiecewiseCurve

• **PiecewiseCurve**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `TimeV0` | `Object` |
| `TimeV0.timev0` | `Object` |

#### Defined in

[packages/spl-token-bonding/src/generated/spl-token-bonding.ts:1124](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/generated/spl-token-bonding.ts#L1124)

___

### PrimitiveCurve

• **PrimitiveCurve**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `ExponentialCurveV0` | `Object` |
| `ExponentialCurveV0.exponentialcurvev0` | `Object` |

#### Defined in

[packages/spl-token-bonding/src/generated/spl-token-bonding.ts:1118](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/generated/spl-token-bonding.ts#L1118)

___

### SplTokenBondingIDLJson

• **SplTokenBondingIDLJson**: `Idl` & { `metadata?`: { `address`: `string`  }  }

#### Defined in

[packages/spl-token-bonding/src/generated/spl-token-bonding.ts:2](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/generated/spl-token-bonding.ts#L2)

## Functions

### amountAsNum

▸ **amountAsNum**(`amount`, `mint`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `amount` | `u64` |
| `mint` | `MintInfo` |

#### Returns

`number`

#### Defined in

[packages/spl-token-bonding/src/curves.ts:20](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L20)

___

### asDecimal

▸ **asDecimal**(`percent`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `percent` | `number` |

#### Returns

`number`

#### Defined in

[packages/spl-token-bonding/src/curves.ts:16](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L16)

___

### fromCurve

▸ **fromCurve**(`curve`, `baseStorage`, `baseMint`, `targetMint`): [`Curve`](interfaces/Curve)

#### Parameters

| Name | Type |
| :------ | :------ |
| `curve` | `any` |
| `baseStorage` | `AccountInfo` |
| `baseMint` | `MintInfo` |
| `targetMint` | `MintInfo` |

#### Returns

[`Curve`](interfaces/Curve)

#### Defined in

[packages/spl-token-bonding/src/curves.ts:26](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L26)

___

### supplyAsNum

▸ **supplyAsNum**(`mint`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `mint` | `MintInfo` |

#### Returns

`number`

#### Defined in

[packages/spl-token-bonding/src/curves.ts:12](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L12)

___

### toU128

▸ **toU128**(`num`): `BN`

Convert a number to a 12 decimal fixed precision u128

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `num` | `number` \| `BN` | Number to convert to a 12 decimal fixed precision BN |

#### Returns

`BN`

#### Defined in

[packages/spl-token-bonding/src/index.ts:42](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L42)
