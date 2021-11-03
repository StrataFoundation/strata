---
id: "ICollectiveConfig"
title: "Interface: ICollectiveConfig"
sidebar_label: "ICollectiveConfig"
sidebar_position: 0
custom_edit_url: null
---

## Properties

### claimedTokenBondingSettings

• `Optional` **claimedTokenBondingSettings**: [`ITokenBondingSettings`](ITokenBondingSettings)

Settings for bonding curves on claimed tokens

#### Defined in

[index.ts:213](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L213)

___

### isOpen

• **isOpen**: `boolean`

A collective can either be open or closed. A closed collective must sign on the creation of _any_ social token
within the collective. An open collective allows any social tokens to bind themself to the collective token, so long
as they follow the CollectiveConfig settings

#### Defined in

[index.ts:209](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L209)

___

### unclaimedTokenBondingSettings

• `Optional` **unclaimedTokenBondingSettings**: [`ITokenBondingSettings`](ITokenBondingSettings)

Settings for bonding curves on unclaimed tokens

#### Defined in

[index.ts:211](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L211)

___

### unclaimedTokenMetadataSettings

• `Optional` **unclaimedTokenMetadataSettings**: [`ITokenMetadataSettings`](ITokenMetadataSettings)

Settings for token metadata of unclaimed tokens

#### Defined in

[index.ts:215](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L215)
