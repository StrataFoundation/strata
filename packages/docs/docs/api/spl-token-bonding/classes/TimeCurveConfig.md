---
id: "TimeCurveConfig"
title: "Class: TimeCurveConfig"
sidebar_label: "TimeCurveConfig"
sidebar_position: 0
custom_edit_url: null
---

Curve configuration that allows the curve to change parameters at discrete time offsets from the go live date

## Implements

- `ICurveConfig`

## Constructors

### constructor

• **new TimeCurveConfig**()

## Properties

### curves

• **curves**: { `curve`: `IPrimitiveCurve` ; `offset`: `BN`  }[] = `[]`

#### Defined in

[packages/spl-token-bonding/src/index.ts:116](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L116)

## Methods

### addCurve

▸ **addCurve**(`timeOffset`, `curve`): [`TimeCurveConfig`](TimeCurveConfig)

#### Parameters

| Name | Type |
| :------ | :------ |
| `timeOffset` | `number` |
| `curve` | `IPrimitiveCurve` |

#### Returns

[`TimeCurveConfig`](TimeCurveConfig)

#### Defined in

[packages/spl-token-bonding/src/index.ts:118](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L118)

___

### toRawConfig

▸ **toRawConfig**(): `TypeDef`<`never` & { `name`: ``"curveV0"`` ; `type`: { `fields`: [{ `name`: ``"definition"`` ; `type`: { `defined`: ``"PiecewiseCurve"``  }  }] ; `kind`: ``"struct"``  }  } & { `name`: ``"curveV0"``  } & `never`, `Record`<`string`, `never`\>\>

#### Returns

`TypeDef`<`never` & { `name`: ``"curveV0"`` ; `type`: { `fields`: [{ `name`: ``"definition"`` ; `type`: { `defined`: ``"PiecewiseCurve"``  }  }] ; `kind`: ``"struct"``  }  } & { `name`: ``"curveV0"``  } & `never`, `Record`<`string`, `never`\>\>

#### Implementation of

ICurveConfig.toRawConfig

#### Defined in

[packages/spl-token-bonding/src/index.ts:131](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L131)
