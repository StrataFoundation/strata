---
id: "IRoyaltySetting"
title: "Interface: IRoyaltySetting"
sidebar_label: "IRoyaltySetting"
sidebar_position: 0
custom_edit_url: null
---

## Properties

### address

• `Optional` **address**: `number`

A static address such that all curves must have this as the royalty address.

#### Defined in

[index.ts:170](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L170)

___

### ownedByName

• `Optional` **ownedByName**: `boolean`

In the case of an unclaimed token, is this royalty account required to be owned by the name account.

If `true`, when the token is claimed, the owner of the name that's claiming it will receive all of the funds in the royalty account

#### Defined in

[index.ts:166](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L166)
