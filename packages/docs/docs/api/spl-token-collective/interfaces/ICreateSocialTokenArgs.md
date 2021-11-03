---
id: "ICreateSocialTokenArgs"
title: "Interface: ICreateSocialTokenArgs"
sidebar_label: "ICreateSocialTokenArgs"
sidebar_position: 0
custom_edit_url: null
---

## Properties

### collective

• `Optional` **collective**: `PublicKey`

The collective to create this social token under. **Default:**: the Open Collective

#### Defined in

[index.ts:85](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L85)

___

### ignoreIfExists

• `Optional` **ignoreIfExists**: `boolean`

If this social token already exists, don't throw an error. **Default:** false

#### Defined in

[index.ts:81](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L81)

___

### isPrimary

• `Optional` **isPrimary**: `boolean`

Is this the primary social token for this wallet? **Default:** true

A primary social token is the social token people should see when they look up your wallet. While it's possible to belong to many
collectives, generally most people will have one social token.

#### Defined in

[index.ts:79](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L79)

___

### metadata

• **metadata**: `ICreateArweaveUrlArgs` & { `uploadUrl?`: `string` ; `useCollectiveDefaultUri?`: `boolean`  }

Token metadata that, if provided, will create metaplex spl-token-metadata for this collective.

Reccommended to fill this out so that your token displays with a name, symbol, and image.

#### Defined in

[index.ts:97](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L97)

___

### name

• `Optional` **name**: `PublicKey`

The spl-name-service name to associate with this account. Will create an unclaimed social token.

#### Defined in

[index.ts:87](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L87)

___

### nameClass

• `Optional` **nameClass**: `PublicKey`

The spl-name-service name class associated with name above, if provided

#### Defined in

[index.ts:89](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L89)

___

### nameParent

• `Optional` **nameParent**: `PublicKey`

The spl-name-service name paent associated with name above, if provided

#### Defined in

[index.ts:91](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L91)

___

### owner

• `Optional` **owner**: `PublicKey`

The wallet to create this social token under, defaults to `provider.wallet`

#### Defined in

[index.ts:113](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L113)

___

### payer

• `Optional` **payer**: `PublicKey`

The payer for this account and txn

#### Defined in

[index.ts:83](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L83)

___

### targetMintKeypair

• `Optional` **targetMintKeypair**: `Keypair`

**Default:** New generated keypair

Pass in the keypair to use for the mint. Useful if you want a vanity keypair

#### Defined in

[index.ts:119](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L119)

___

### tokenBondingParams

• **tokenBondingParams**: [`ITokenBondingParams`](ITokenBondingParams)

Params for the bonding curve

#### Defined in

[index.ts:121](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L121)
