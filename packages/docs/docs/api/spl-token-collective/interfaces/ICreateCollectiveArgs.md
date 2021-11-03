---
id: "ICreateCollectiveArgs"
title: "Interface: ICreateCollectiveArgs"
sidebar_label: "ICreateCollectiveArgs"
sidebar_position: 0
custom_edit_url: null
---

## Properties

### authority

• `Optional` **authority**: `PublicKey`

The authority of this collective

#### Defined in

[index.ts:43](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L43)

___

### bonding

• `Optional` **bonding**: `ICreateTokenBondingArgs`

If `mint` is not provided, create a bonding curve automatically for this collective.

#### Defined in

[index.ts:37](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L37)

___

### config

• **config**: [`ICollectiveConfig`](ICollectiveConfig)

The configs around what is and isn't allowed in the collective

#### Defined in

[index.ts:45](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L45)

___

### metadata

• `Optional` **metadata**: `ICreateArweaveUrlArgs` & { `uploadUrl?`: `string`  }

Token metadata that, if provided, will create metaplex spl-token-metadata for this collective.

Reccommended to always fill this out so that your token displays with a name, symbol, and image.

#### Defined in

[index.ts:30](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L30)

___

### mint

• `Optional` **mint**: `PublicKey`

The mint to base this collective around. It is recommended for compatability that all collectives be on a bonding curve, so it's easy to make user interfaces that can buy in and out of your social tokens

#### Defined in

[index.ts:39](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L39)

___

### mintAuthority

• `Optional` **mintAuthority**: `PublicKey`

*Default:** Fetch from mint. This may not be possible if the mint is being created in the same transaction as the collective.

#### Defined in

[index.ts:41](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L41)

___

### payer

• `Optional` **payer**: `PublicKey`

Payer for this transaction

#### Defined in

[index.ts:24](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L24)
