---
id: "ExponentialCurveConfig"
title: "Class: ExponentialCurveConfig"
sidebar_label: "ExponentialCurveConfig"
sidebar_position: 0
custom_edit_url: null
---

Curve configuration for c(S^(pow/frac)) + b

## Implements

- `ICurveConfig`
- `IPrimitiveCurve`

## Constructors

### constructor

• **new ExponentialCurveConfig**(`__namedParameters`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `__namedParameters` | `Object` |
| `__namedParameters.b?` | `number` \| `BN` |
| `__namedParameters.c?` | `number` \| `BN` |
| `__namedParameters.frac?` | `number` |
| `__namedParameters.pow?` | `number` |

#### Defined in

[packages/spl-token-bonding/src/index.ts:64](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L64)

## Properties

### b

• **b**: `BN`

#### Defined in

[packages/spl-token-bonding/src/index.ts:60](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L60)

___

### c

• **c**: `BN`

#### Defined in

[packages/spl-token-bonding/src/index.ts:59](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L59)

___

### frac

• **frac**: `number`

#### Defined in

[packages/spl-token-bonding/src/index.ts:62](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L62)

___

### pow

• **pow**: `number`

#### Defined in

[packages/spl-token-bonding/src/index.ts:61](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L61)

## Methods

### toRawConfig

▸ **toRawConfig**(): `TypeDef`<`never` & { `name`: ``"curveV0"`` ; `type`: { `fields`: [{ `name`: ``"definition"`` ; `type`: { `defined`: ``"PiecewiseCurve"``  }  }] ; `kind`: ``"struct"``  }  } & { `name`: ``"curveV0"``  } & `never`, `Record`<`string`, `never`\>\>

#### Returns

`TypeDef`<`never` & { `name`: ``"curveV0"`` ; `type`: { `fields`: [{ `name`: ``"definition"`` ; `type`: { `defined`: ``"PiecewiseCurve"``  }  }] ; `kind`: ``"struct"``  }  } & { `name`: ``"curveV0"``  } & `never`, `Record`<`string`, `never`\>\>

#### Implementation of

ICurveConfig.toRawConfig

#### Defined in

[packages/spl-token-bonding/src/index.ts:96](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L96)

___

### toRawPrimitiveConfig

▸ **toRawPrimitiveConfig**(): `any`

#### Returns

`any`

#### Implementation of

IPrimitiveCurve.toRawPrimitiveConfig

#### Defined in

[packages/spl-token-bonding/src/index.ts:81](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L81)
