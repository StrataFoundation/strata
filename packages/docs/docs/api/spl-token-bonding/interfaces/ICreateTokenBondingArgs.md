---
id: "ICreateTokenBondingArgs"
title: "Interface: ICreateTokenBondingArgs"
sidebar_label: "ICreateTokenBondingArgs"
sidebar_position: 0
custom_edit_url: null
---

## Properties

### authority

• `Optional` **authority**: `PublicKey`

#### Defined in

[packages/spl-token-bonding/src/index.ts:217](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L217)

___

### baseMint

• **baseMint**: `PublicKey`

The base mint that the `targetMint` will be priced in terms of. `baseMint` tokens will fill the bonding curve reserves

#### Defined in

[packages/spl-token-bonding/src/index.ts:160](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L160)

___

### baseStorage

• `Optional` **baseStorage**: `PublicKey`

The reserves of the bonding curve. When [SplTokenBonding.buy](../classes/SplTokenBonding#buy) is called, `baseMint` tokens are stored here.
When [SplTokenBonding.sell](../classes/SplTokenBonding#sell) is called, `baseMint` tokens are returned to the callee from this account

Optionally, this account can have an authority _not_ owned by the spl-token-bonding program. In this case, a bonding curve
is created with [SplTokenBonding.sell](../classes/SplTokenBonding#sell) disabled. This allows the bonding curve contract to be used like a
marketplace to sell a new token

**Default:** creates this account for you, owned by the token bonding program

#### Defined in

[packages/spl-token-bonding/src/index.ts:228](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L228)

___

### buyBaseRoyalties

• `Optional` **buyBaseRoyalties**: `PublicKey`

Account to store royalties in terms of `baseMint` tokens when the [SplTokenBonding.buy](../classes/SplTokenBonding#buy) command is issued

If not provided, will create an Associated Token Account with `buyBaseRoyaltiesOwner`

#### Defined in

[packages/spl-token-bonding/src/index.ts:190](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L190)

___

### buyBaseRoyaltiesOwner

• `Optional` **buyBaseRoyaltiesOwner**: `PublicKey`

Only required when `buyBaseRoyalties` is undefined. The owner of the `buyBaseRoyalties` account. **Default:** `provider.wallet`

#### Defined in

[packages/spl-token-bonding/src/index.ts:192](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L192)

___

### buyBaseRoyaltyPercentage

• **buyBaseRoyaltyPercentage**: `number`

Number from 0 to 100

#### Defined in

[packages/spl-token-bonding/src/index.ts:230](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L230)

___

### buyFrozen

• `Optional` **buyFrozen**: `boolean`

Should this bonding curve be frozen initially? It can be unfrozen using [SplTokenBonding.updateTokenBonding](../classes/SplTokenBonding#updatetokenbonding). **Default:** false

#### Defined in

[packages/spl-token-bonding/src/index.ts:246](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L246)

___

### buyTargetRoyalties

• `Optional` **buyTargetRoyalties**: `PublicKey`

Account to store royalties in terms of `targetMint` tokens when the [SplTokenBonding.buy](../classes/SplTokenBonding#buy) command is issued

If not provided, will create an Associated Token Account with `buyTargetRoyaltiesOwner`

#### Defined in

[packages/spl-token-bonding/src/index.ts:198](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L198)

___

### buyTargetRoyaltiesOwner

• `Optional` **buyTargetRoyaltiesOwner**: `PublicKey`

Only required when `buyTargetRoyalties` is undefined. The owner of the `buyTargetRoyalties` account. **Default:** `provider.wallet`

#### Defined in

[packages/spl-token-bonding/src/index.ts:200](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L200)

___

### buyTargetRoyaltyPercentage

• **buyTargetRoyaltyPercentage**: `number`

Number from 0 to 100

#### Defined in

[packages/spl-token-bonding/src/index.ts:232](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L232)

___

### curve

• **curve**: `PublicKey`

The shape of the bonding curve. Must be created using [SplTokenBonding.initializeCurve](../classes/SplTokenBonding#initializecurve)

#### Defined in

[packages/spl-token-bonding/src/index.ts:158](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L158)

___

### freezeBuyDate

• `Optional` **freezeBuyDate**: `Date`

The date this bonding curve will shut down. After this date, [SplTokenBonding.buy](../classes/SplTokenBonding#buy) and [SplTokenBonding.sell](../classes/SplTokenBonding#sell) are disabled. **Default:** null

#### Defined in

[packages/spl-token-bonding/src/index.ts:244](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L244)

___

### goLiveDate

• `Optional` **goLiveDate**: `Date`

The date this bonding curve will go live. Before this date, [SplTokenBonding.buy](../classes/SplTokenBonding#buy) and [SplTokenBonding.sell](../classes/SplTokenBonding#sell) are disabled. **Default:** 1 second ago

#### Defined in

[packages/spl-token-bonding/src/index.ts:242](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L242)

___

### index

• `Optional` **index**: `number`

Multiple bonding curves can exist for a given target mint.
0 is reserved for the one where the program owns mint authority and can mint new tokens. All other curves may exist as
markeplace curves

#### Defined in

[packages/spl-token-bonding/src/index.ts:252](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L252)

___

### mintCap

• `Optional` **mintCap**: `BN`

Maximum `targetMint` tokens this bonding curve will mint before disabling [SplTokenBonding.buy](../classes/SplTokenBonding#buy). **Default:** infinite

#### Defined in

[packages/spl-token-bonding/src/index.ts:238](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L238)

___

### payer

• `Optional` **payer**: `PublicKey`

The payer to create this token bonding, defaults to provider.wallet

#### Defined in

[packages/spl-token-bonding/src/index.ts:156](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L156)

___

### purchaseCap

• `Optional` **purchaseCap**: `BN`

Maximum `targetMint` tokens that can be purchased in a single call to [SplTokenBonding.buy](../classes/SplTokenBonding#buy). Useful for limiting volume. **Default:** 0

#### Defined in

[packages/spl-token-bonding/src/index.ts:240](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L240)

___

### sellBaseRoyalties

• `Optional` **sellBaseRoyalties**: `PublicKey`

Account to store royalties in terms of `baseMint` tokens when the [SplTokenBonding.sell](../classes/SplTokenBonding#sell) command is issued

If not provided, will create an Associated Token Account with `sellBaseRoyaltiesOwner`

#### Defined in

[packages/spl-token-bonding/src/index.ts:206](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L206)

___

### sellBaseRoyaltiesOwner

• `Optional` **sellBaseRoyaltiesOwner**: `PublicKey`

Only required when `sellBaseRoyalties` is undefined. The owner of the `sellBaseRoyalties` account. **Default:** `provider.wallet`

#### Defined in

[packages/spl-token-bonding/src/index.ts:208](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L208)

___

### sellBaseRoyaltyPercentage

• **sellBaseRoyaltyPercentage**: `number`

Number from 0 to 100

#### Defined in

[packages/spl-token-bonding/src/index.ts:234](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L234)

___

### sellTargetRoyalties

• `Optional` **sellTargetRoyalties**: `PublicKey`

Account to store royalties in terms of `targetMint` tokens when the [SplTokenBonding.sell](../classes/SplTokenBonding#sell) command is issued

If not provided, will create an Associated Token Account with `sellTargetRoyaltiesOwner`

#### Defined in

[packages/spl-token-bonding/src/index.ts:214](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L214)

___

### sellTargetRoyaltiesOwner

• `Optional` **sellTargetRoyaltiesOwner**: `PublicKey`

Only required when `sellTargetRoyalties` is undefined. The owner of the `sellTargetRoyalties` account. **Default:** `provider.wallet`

#### Defined in

[packages/spl-token-bonding/src/index.ts:216](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L216)

___

### sellTargetRoyaltyPercentage

• **sellTargetRoyaltyPercentage**: `number`

Number from 0 to 100

#### Defined in

[packages/spl-token-bonding/src/index.ts:236](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L236)

___

### targetMint

• `Optional` **targetMint**: `PublicKey`

The mint this bonding curve will create on `buy`. If not provided, specify `targetMintDecimals` and it will create one for you

It can be useful to pass the mint in if you're creating a bonding curve for an existing mint. Keep in mind,
the authority on this mint will need to be set to:
```js
PublicKey.findProgramAddress(
[
Buffer.from("target-authority", "utf-8"),
targetMint!.toBuffer()
],
this.programId
)
```

#### Defined in

[packages/spl-token-bonding/src/index.ts:176](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L176)

___

### targetMintDecimals

• `Optional` **targetMintDecimals**: `number`

If `targetMint` is not defined, will create a mint with this number of decimals

#### Defined in

[packages/spl-token-bonding/src/index.ts:184](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L184)

___

### targetMintKeypair

• `Optional` **targetMintKeypair**: `Keypair`

**Default:** New generated keypair

Pass in the keypair to use for the mint. Useful if you want a vanity keypair

#### Defined in

[packages/spl-token-bonding/src/index.ts:182](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L182)
