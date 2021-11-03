---
id: "ExponentialCurve"
title: "Class: ExponentialCurve"
sidebar_label: "ExponentialCurve"
sidebar_position: 0
custom_edit_url: null
---

## Implements

- [`Curve`](../interfaces/Curve)

## Constructors

### constructor

• **new ExponentialCurve**(`curve`, `baseStorage`, `baseMint`, `targetMint`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `curve` | [`ExponentialCurveV0`](../modules#exponentialcurvev0) |
| `baseStorage` | `AccountInfo` |
| `baseMint` | `MintInfo` |
| `targetMint` | `MintInfo` |

#### Defined in

[packages/spl-token-bonding/src/curves.ts:56](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L56)

## Properties

### b

• **b**: `number`

#### Defined in

[packages/spl-token-bonding/src/curves.ts:48](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L48)

___

### baseMint

• **baseMint**: `MintInfo`

#### Defined in

[packages/spl-token-bonding/src/curves.ts:53](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L53)

___

### baseStorage

• **baseStorage**: `AccountInfo`

#### Defined in

[packages/spl-token-bonding/src/curves.ts:52](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L52)

___

### c

• **c**: `number`

#### Defined in

[packages/spl-token-bonding/src/curves.ts:47](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L47)

___

### frac

• **frac**: `number`

#### Defined in

[packages/spl-token-bonding/src/curves.ts:51](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L51)

___

### k

• **k**: `number`

#### Defined in

[packages/spl-token-bonding/src/curves.ts:49](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L49)

___

### pow

• **pow**: `number`

#### Defined in

[packages/spl-token-bonding/src/curves.ts:50](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L50)

___

### targetMint

• **targetMint**: `MintInfo`

#### Defined in

[packages/spl-token-bonding/src/curves.ts:54](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L54)

## Methods

### buyTargetAmount

▸ **buyTargetAmount**(`targetAmountNum`, `baseRoyaltiesPercent`, `targetRoyaltiesPercent`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetAmountNum` | `number` |
| `baseRoyaltiesPercent` | `number` |
| `targetRoyaltiesPercent` | `number` |

#### Returns

`number`

#### Implementation of

[Curve](../interfaces/Curve).[buyTargetAmount](../interfaces/Curve#buytargetamount)

#### Defined in

[packages/spl-token-bonding/src/curves.ts:133](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L133)

___

### buyTargetAmountRootEstimates

▸ **buyTargetAmountRootEstimates**(`targetAmountNum`, `targetRoyaltiesPercent`): `number`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetAmountNum` | `number` |
| `targetRoyaltiesPercent` | `number` |

#### Returns

`number`[]

#### Implementation of

[Curve](../interfaces/Curve).[buyTargetAmountRootEstimates](../interfaces/Curve#buytargetamountrootestimates)

#### Defined in

[packages/spl-token-bonding/src/curves.ts:85](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L85)

___

### buyWithBaseAmount

▸ **buyWithBaseAmount**(`baseAmountNum`, `baseRoyaltiesPercent`, `targetRoyaltiesPercent`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `baseAmountNum` | `number` |
| `baseRoyaltiesPercent` | `number` |
| `targetRoyaltiesPercent` | `number` |

#### Returns

`number`

#### Implementation of

[Curve](../interfaces/Curve).[buyWithBaseAmount](../interfaces/Curve#buywithbaseamount)

#### Defined in

[packages/spl-token-bonding/src/curves.ts:137](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L137)

___

### buyWithBaseRootEstimates

▸ **buyWithBaseRootEstimates**(`baseAmountNum`, `baseRoyaltiesPercent`): `number`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `baseAmountNum` | `number` |
| `baseRoyaltiesPercent` | `number` |

#### Returns

`number`[]

#### Implementation of

[Curve](../interfaces/Curve).[buyWithBaseRootEstimates](../interfaces/Curve#buywithbaserootestimates)

#### Defined in

[packages/spl-token-bonding/src/curves.ts:69](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L69)

___

### changeInTargetAmount

▸ **changeInTargetAmount**(`targetAmountNum`, `baseRoyaltiesPercent`, `targetRoyaltiesPercent`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetAmountNum` | `number` |
| `baseRoyaltiesPercent` | `number` |
| `targetRoyaltiesPercent` | `number` |

#### Returns

`number`

#### Defined in

[packages/spl-token-bonding/src/curves.ts:113](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L113)

___

### current

▸ **current**(): `number`

#### Returns

`number`

#### Implementation of

[Curve](../interfaces/Curve).[current](../interfaces/Curve#current)

#### Defined in

[packages/spl-token-bonding/src/curves.ts:105](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L105)

___

### locked

▸ **locked**(): `number`

#### Returns

`number`

#### Implementation of

[Curve](../interfaces/Curve).[locked](../interfaces/Curve#locked)

#### Defined in

[packages/spl-token-bonding/src/curves.ts:109](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L109)

___

### sellTargetAmount

▸ **sellTargetAmount**(`targetAmountNum`, `baseRoyaltiesPercent`, `targetRoyaltiesPercent`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetAmountNum` | `number` |
| `baseRoyaltiesPercent` | `number` |
| `targetRoyaltiesPercent` | `number` |

#### Returns

`number`

#### Implementation of

[Curve](../interfaces/Curve).[sellTargetAmount](../interfaces/Curve#selltargetamount)

#### Defined in

[packages/spl-token-bonding/src/curves.ts:129](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L129)
