---
id: "Curve"
title: "Interface: Curve"
sidebar_label: "Curve"
sidebar_position: 0
custom_edit_url: null
---

## Implemented by

- [`ExponentialCurve`](../classes/ExponentialCurve)

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

#### Defined in

[packages/spl-token-bonding/src/curves.ts:40](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L40)

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

#### Defined in

[packages/spl-token-bonding/src/curves.ts:43](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L43)

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

#### Defined in

[packages/spl-token-bonding/src/curves.ts:41](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L41)

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

#### Defined in

[packages/spl-token-bonding/src/curves.ts:42](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L42)

___

### current

▸ **current**(): `number`

#### Returns

`number`

#### Defined in

[packages/spl-token-bonding/src/curves.ts:37](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L37)

___

### locked

▸ **locked**(): `number`

#### Returns

`number`

#### Defined in

[packages/spl-token-bonding/src/curves.ts:38](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L38)

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

#### Defined in

[packages/spl-token-bonding/src/curves.ts:39](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/curves.ts#L39)
