---
id: "ITokenBondingParams"
title: "Interface: ITokenBondingParams"
sidebar_label: "ITokenBondingParams"
sidebar_position: 0
custom_edit_url: null
---

See [InitializeTokenBondingArgs](/docs/api/spl-token-bonding/interfaces/ICreateTokenBondingArgs)

## Properties

### buyBaseRoyalties

• `Optional` **buyBaseRoyalties**: `PublicKey`

#### Defined in

[index.ts:61](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L61)

___

### buyBaseRoyaltiesOwner

• `Optional` **buyBaseRoyaltiesOwner**: `PublicKey`

#### Defined in

[index.ts:62](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L62)

___

### buyBaseRoyaltyPercentage

• **buyBaseRoyaltyPercentage**: `number`

#### Defined in

[index.ts:54](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L54)

___

### buyTargetRoyalties

• `Optional` **buyTargetRoyalties**: `PublicKey`

#### Defined in

[index.ts:63](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L63)

___

### buyTargetRoyaltiesOwner

• `Optional` **buyTargetRoyaltiesOwner**: `PublicKey`

#### Defined in

[index.ts:64](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L64)

___

### buyTargetRoyaltyPercentage

• **buyTargetRoyaltyPercentage**: `number`

#### Defined in

[index.ts:55](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L55)

___

### curve

• `Optional` **curve**: `PublicKey`

The curve to create this social token on. **Default:** Curve from the collective's config

#### Defined in

[index.ts:52](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L52)

___

### sellBaseRoyalties

• `Optional` **sellBaseRoyalties**: `PublicKey`

#### Defined in

[index.ts:65](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L65)

___

### sellBaseRoyaltiesOwner

• `Optional` **sellBaseRoyaltiesOwner**: `PublicKey`

#### Defined in

[index.ts:66](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L66)

___

### sellBaseRoyaltyPercentage

• **sellBaseRoyaltyPercentage**: `number`

#### Defined in

[index.ts:56](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L56)

___

### sellTargetRoyalties

• `Optional` **sellTargetRoyalties**: `PublicKey`

#### Defined in

[index.ts:67](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L67)

___

### sellTargetRoyaltiesOwner

• `Optional` **sellTargetRoyaltiesOwner**: `PublicKey`

#### Defined in

[index.ts:68](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L68)

___

### sellTargetRoyaltyPercentage

• **sellTargetRoyaltyPercentage**: `number`

#### Defined in

[index.ts:57](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L57)

___

### targetMintDecimals

• `Optional` **targetMintDecimals**: `number`

*Default:** uses decimals from collective config, or 9

#### Defined in

[index.ts:60](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L60)
