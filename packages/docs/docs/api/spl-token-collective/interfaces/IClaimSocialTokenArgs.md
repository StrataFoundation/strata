---
id: "IClaimSocialTokenArgs"
title: "Interface: IClaimSocialTokenArgs"
sidebar_label: "IClaimSocialTokenArgs"
sidebar_position: 0
custom_edit_url: null
---

## Properties

### buyBaseRoyalties

• `Optional` **buyBaseRoyalties**: `PublicKey`

The buy base royalties destination. **Default:** ATA of owner

#### Defined in

[index.ts:143](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L143)

___

### buyTargetRoyalties

• `Optional` **buyTargetRoyalties**: `PublicKey`

The buy target royalties destination. **Default:** ATA of owner

#### Defined in

[index.ts:145](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L145)

___

### ignoreMissingName

• `Optional` **ignoreMissingName**: `boolean`

Ignore missing name account. Useful if you're creating the name in the same txn.

Otherwise, the sdk checks to make sure the name account exists before claiming to provide a more useful error

**Default:** false

#### Defined in

[index.ts:157](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L157)

___

### isPrimary

• `Optional` **isPrimary**: `boolean`

Is this the primary social token for this wallet? **Default:** true

A primary social token is the social token people should see when they look up your wallet. While it's possible to belong to many
collectives, generally most people will have one social token.

#### Defined in

[index.ts:131](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L131)

___

### owner

• `Optional` **owner**: `PublicKey`

The owning wallet of this social token. **Default:**: `provider.wallet`

#### Defined in

[index.ts:135](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L135)

___

### payer

• `Optional` **payer**: `PublicKey`

The payer for this txn

#### Defined in

[index.ts:133](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L133)

___

### sellBaseRoyalties

• `Optional` **sellBaseRoyalties**: `PublicKey`

The sell base royalties destination. **Default:** ATA of owner

#### Defined in

[index.ts:147](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L147)

___

### sellTargetRoyalties

• `Optional` **sellTargetRoyalties**: `PublicKey`

The sell target royalties destination. **Default:** ATA of owner

#### Defined in

[index.ts:149](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L149)

___

### symbol

• `Optional` **symbol**: `string`

Change the smart-contract level symbol for this token without changing the url. To do a full update to token metadata, directly use SplTokenMetadata after a claim

#### Defined in

[index.ts:141](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L141)

___

### tokenName

• `Optional` **tokenName**: `string`

Change the smart-contract level name for this token without changing the url. To do a full update to token metadata, directly use SplTokenMetadata after a claim

#### Defined in

[index.ts:139](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L139)

___

### tokenRef

• **tokenRef**: `PublicKey`

The token ref of the token we are claiming

#### Defined in

[index.ts:137](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L137)
