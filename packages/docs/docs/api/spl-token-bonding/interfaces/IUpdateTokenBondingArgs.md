---
id: "IUpdateTokenBondingArgs"
title: "Interface: IUpdateTokenBondingArgs"
sidebar_label: "IUpdateTokenBondingArgs"
sidebar_position: 0
custom_edit_url: null
---

## Properties

### authority

• `Optional` **authority**: ``null`` \| `PublicKey`

#### Defined in

[packages/spl-token-bonding/src/index.ts:274](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L274)

___

### buyBaseRoyalties

• `Optional` **buyBaseRoyalties**: `PublicKey`

A new account to store royalties. **Default:** current

#### Defined in

[packages/spl-token-bonding/src/index.ts:267](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L267)

___

### buyBaseRoyaltyPercentage

• `Optional` **buyBaseRoyaltyPercentage**: `number`

Number from 0 to 100. **Default:** current

#### Defined in

[packages/spl-token-bonding/src/index.ts:259](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L259)

___

### buyFrozen

• `Optional` **buyFrozen**: `boolean`

Should this bonding curve be frozen, disabling buy and sell? It can be unfrozen using [SplTokenBonding.updateTokenBonding](../classes/SplTokenBonding#updatetokenbonding). **Default:** current

#### Defined in

[packages/spl-token-bonding/src/index.ts:276](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L276)

___

### buyTargetRoyalties

• `Optional` **buyTargetRoyalties**: `PublicKey`

A new account to store royalties. **Default:** current

#### Defined in

[packages/spl-token-bonding/src/index.ts:269](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L269)

___

### buyTargetRoyaltyPercentage

• `Optional` **buyTargetRoyaltyPercentage**: `number`

Number from 0 to 100. **Default:** current

#### Defined in

[packages/spl-token-bonding/src/index.ts:261](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L261)

___

### sellBaseRoyalties

• `Optional` **sellBaseRoyalties**: `PublicKey`

A new account to store royalties. **Default:** current

#### Defined in

[packages/spl-token-bonding/src/index.ts:271](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L271)

___

### sellBaseRoyaltyPercentage

• `Optional` **sellBaseRoyaltyPercentage**: `number`

Number from 0 to 100. **Default:** current

#### Defined in

[packages/spl-token-bonding/src/index.ts:263](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L263)

___

### sellTargetRoyalties

• `Optional` **sellTargetRoyalties**: `PublicKey`

A new account to store royalties. **Default:** current

#### Defined in

[packages/spl-token-bonding/src/index.ts:273](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L273)

___

### sellTargetRoyaltyPercentage

• `Optional` **sellTargetRoyaltyPercentage**: `number`

Number from 0 to 100. **Default:** current

#### Defined in

[packages/spl-token-bonding/src/index.ts:265](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L265)

___

### tokenBonding

• **tokenBonding**: `PublicKey`

The bonding curve to update

#### Defined in

[packages/spl-token-bonding/src/index.ts:257](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L257)
