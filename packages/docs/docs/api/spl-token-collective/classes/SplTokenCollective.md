---
id: "SplTokenCollective"
title: "Class: SplTokenCollective"
sidebar_label: "SplTokenCollective"
sidebar_position: 0
custom_edit_url: null
---

## Constructors

### constructor

• **new SplTokenCollective**(`opts`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts` | `Object` |
| `opts.program` | `Program`<[`SplTokenCollectiveIDL`](../modules#spltokencollectiveidl)\> |
| `opts.provider` | `default` |
| `opts.splTokenBondingProgram` | `SplTokenBonding` |
| `opts.splTokenMetadata` | `SplTokenMetadata` |

#### Defined in

[index.ts:309](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L309)

## Properties

### program

• **program**: `Program`<[`SplTokenCollectiveIDL`](../modules#spltokencollectiveidl)\>

#### Defined in

[index.ts:285](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L285)

___

### provider

• **provider**: `default`

#### Defined in

[index.ts:288](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L288)

___

### splTokenBondingProgram

• **splTokenBondingProgram**: `SplTokenBonding`

#### Defined in

[index.ts:286](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L286)

___

### splTokenMetadata

• **splTokenMetadata**: `SplTokenMetadata`

#### Defined in

[index.ts:287](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L287)

___

### ID

▪ `Static` **ID**: `PublicKey`

#### Defined in

[index.ts:290](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L290)

___

### OPEN\_COLLECTIVE\_BONDING\_ID

▪ `Static` **OPEN\_COLLECTIVE\_BONDING\_ID**: `PublicKey`

#### Defined in

[index.ts:292](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L292)

___

### OPEN\_COLLECTIVE\_ID

▪ `Static` **OPEN\_COLLECTIVE\_ID**: `PublicKey`

#### Defined in

[index.ts:291](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L291)

___

### OPEN\_COLLECTIVE\_MINT\_ID

▪ `Static` **OPEN\_COLLECTIVE\_MINT\_ID**: `PublicKey`

#### Defined in

[index.ts:293](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L293)

## Accessors

### account

• `get` **account**(): `AccountNamespace`<[`SplTokenCollectiveIDL`](../modules#spltokencollectiveidl)\>

#### Returns

`AccountNamespace`<[`SplTokenCollectiveIDL`](../modules#spltokencollectiveidl)\>

#### Defined in

[index.ts:337](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L337)

___

### errors

• `get` **errors**(): `Map`<`number`, `string`\>

#### Returns

`Map`<`number`, `string`\>

#### Defined in

[index.ts:341](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L341)

___

### instruction

• `get` **instruction**(): `InstructionNamespace`<[`SplTokenCollectiveIDL`](../modules#spltokencollectiveidl), { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"mint"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"mintAuthority"``  }, { `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"rent"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeCollectiveV0Args"``  }  }] ; `name`: ``"initializeCollectiveV0"``  } \| { `accounts`: [{ `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenMetadata"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }] ; `name`: ``"initializeArgs"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"authority"``  }, { `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeSocialTokenV0Args"``  }  }] ; `name`: ``"initializeOwnedSocialTokenV0"``  } \| { `accounts`: [{ `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenMetadata"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }] ; `name`: ``"initializeArgs"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"authority"``  }, { `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeSocialTokenV0Args"``  }  }] ; `name`: ``"initializeUnclaimedSocialTokenV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenRef"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"newTokenRef"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"reverseTokenRef"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"ClaimSocialTokenV0Args"``  }  }] ; `name`: ``"claimSocialTokenV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"authority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"reverseTokenRef"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBondingAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"owner"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"UpdateTokenBondingV0ArgsWrapper"``  }  }] ; `name`: ``"updateTokenBondingV0"``  }\>

#### Returns

`InstructionNamespace`<[`SplTokenCollectiveIDL`](../modules#spltokencollectiveidl), { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"mint"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"mintAuthority"``  }, { `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"rent"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeCollectiveV0Args"``  }  }] ; `name`: ``"initializeCollectiveV0"``  } \| { `accounts`: [{ `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenMetadata"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }] ; `name`: ``"initializeArgs"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"authority"``  }, { `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeSocialTokenV0Args"``  }  }] ; `name`: ``"initializeOwnedSocialTokenV0"``  } \| { `accounts`: [{ `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenMetadata"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }] ; `name`: ``"initializeArgs"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"authority"``  }, { `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeSocialTokenV0Args"``  }  }] ; `name`: ``"initializeUnclaimedSocialTokenV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenRef"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"newTokenRef"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"reverseTokenRef"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"ClaimSocialTokenV0Args"``  }  }] ; `name`: ``"claimSocialTokenV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"authority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"reverseTokenRef"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBondingAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"owner"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"UpdateTokenBondingV0ArgsWrapper"``  }  }] ; `name`: ``"updateTokenBondingV0"``  }\>

#### Defined in

[index.ts:329](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L329)

___

### programId

• `get` **programId**(): `PublicKey`

#### Returns

`PublicKey`

#### Defined in

[index.ts:321](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L321)

___

### rpc

• `get` **rpc**(): `RpcNamespace`<[`SplTokenCollectiveIDL`](../modules#spltokencollectiveidl), { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"mint"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"mintAuthority"``  }, { `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"rent"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeCollectiveV0Args"``  }  }] ; `name`: ``"initializeCollectiveV0"``  } \| { `accounts`: [{ `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenMetadata"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }] ; `name`: ``"initializeArgs"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"authority"``  }, { `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeSocialTokenV0Args"``  }  }] ; `name`: ``"initializeOwnedSocialTokenV0"``  } \| { `accounts`: [{ `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenMetadata"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }] ; `name`: ``"initializeArgs"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"authority"``  }, { `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeSocialTokenV0Args"``  }  }] ; `name`: ``"initializeUnclaimedSocialTokenV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenRef"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"newTokenRef"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"reverseTokenRef"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"ClaimSocialTokenV0Args"``  }  }] ; `name`: ``"claimSocialTokenV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"authority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"reverseTokenRef"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBondingAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"owner"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"UpdateTokenBondingV0ArgsWrapper"``  }  }] ; `name`: ``"updateTokenBondingV0"``  }\>

#### Returns

`RpcNamespace`<[`SplTokenCollectiveIDL`](../modules#spltokencollectiveidl), { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"mint"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"mintAuthority"``  }, { `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"rent"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeCollectiveV0Args"``  }  }] ; `name`: ``"initializeCollectiveV0"``  } \| { `accounts`: [{ `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenMetadata"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }] ; `name`: ``"initializeArgs"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"authority"``  }, { `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeSocialTokenV0Args"``  }  }] ; `name`: ``"initializeOwnedSocialTokenV0"``  } \| { `accounts`: [{ `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenMetadata"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }] ; `name`: ``"initializeArgs"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"authority"``  }, { `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeSocialTokenV0Args"``  }  }] ; `name`: ``"initializeUnclaimedSocialTokenV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenRef"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"newTokenRef"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"reverseTokenRef"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"ClaimSocialTokenV0Args"``  }  }] ; `name`: ``"claimSocialTokenV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"collective"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"authority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"reverseTokenRef"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBondingAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"owner"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"UpdateTokenBondingV0ArgsWrapper"``  }  }] ; `name`: ``"updateTokenBondingV0"``  }\>

#### Defined in

[index.ts:325](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L325)

___

### wallet

• `get` **wallet**(): `Wallet`

#### Returns

`Wallet`

#### Defined in

[index.ts:333](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L333)

## Methods

### claimSocialToken

▸ **claimSocialToken**(`args`): `Promise`<`void`\>

Run [claimSocialTokenInstructions](SplTokenCollective#claimsocialtokeninstructions)

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`IClaimSocialTokenArgs`](../interfaces/IClaimSocialTokenArgs) |

#### Returns

`Promise`<`void`\>

#### Defined in

[index.ts:684](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L684)

___

### claimSocialTokenInstructions

▸ **claimSocialTokenInstructions**(`param0`): `Promise`<`InstructionResult`<``null``\>\>

Instructions to claim a social token

#### Parameters

| Name | Type |
| :------ | :------ |
| `param0` | [`IClaimSocialTokenArgs`](../interfaces/IClaimSocialTokenArgs) |

#### Returns

`Promise`<`InstructionResult`<``null``\>\>

#### Defined in

[index.ts:510](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L510)

___

### createCollective

▸ **createCollective**(`args`): `Promise`<`Object`\>

Run [createCollectiveInstructions](SplTokenCollective#createcollectiveinstructions)

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ICreateCollectiveArgs`](../interfaces/ICreateCollectiveArgs) |

#### Returns

`Promise`<`Object`\>

#### Defined in

[index.ts:493](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L493)

___

### createCollectiveInstructions

▸ **createCollectiveInstructions**(`param0`): `Promise`<`BigInstructionResult`<`Object`\>\>

Instructions to create a Collective

#### Parameters

| Name | Type |
| :------ | :------ |
| `param0` | [`ICreateCollectiveArgs`](../interfaces/ICreateCollectiveArgs) |

#### Returns

`Promise`<`BigInstructionResult`<`Object`\>\>

#### Defined in

[index.ts:358](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L358)

___

### createSocialToken

▸ **createSocialToken**(`args`): `Promise`<`Object`\>

Run [createSocialTokenInstructions](SplTokenCollective#createsocialtokeninstructions)

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ICreateSocialTokenArgs`](../interfaces/ICreateSocialTokenArgs) |

#### Returns

`Promise`<`Object`\>

#### Defined in

[index.ts:967](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L967)

___

### createSocialTokenInstructions

▸ **createSocialTokenInstructions**(`param0`): `Promise`<`BigInstructionResult`<`Object`\>\>

Instructions to create everything around a social token... metadata, bonding curves, etc.

#### Parameters

| Name | Type |
| :------ | :------ |
| `param0` | [`ICreateSocialTokenArgs`](../interfaces/ICreateSocialTokenArgs) |

#### Returns

`Promise`<`BigInstructionResult`<`Object`\>\>

#### Defined in

[index.ts:721](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L721)

___

### sendInstructions

▸ **sendInstructions**(`instructions`, `signers`, `payer?`): `Promise`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `instructions` | `TransactionInstruction`[] |
| `signers` | `Signer`[] |
| `payer?` | `PublicKey` |

#### Returns

`Promise`<`string`\>

#### Defined in

[index.ts:348](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L348)

___

### tokenRefSeeds

▸ **tokenRefSeeds**(`param0`): `Buffer`[]

Get the seeds for the PDA of a token ref given the various parameters.

#### Parameters

| Name | Type |
| :------ | :------ |
| `param0` | `Object` |
| `param0.collective?` | `PublicKey` |
| `param0.isPrimary` | `boolean` |
| `param0.name?` | `PublicKey` |
| `param0.owner?` | `PublicKey` |

#### Returns

`Buffer`[]

#### Defined in

[index.ts:698](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L698)

___

### init

▸ `Static` **init**(`provider`, `splCollectiveProgramId?`, `splTokenBondingProgramId?`): `Promise`<[`SplTokenCollective`](SplTokenCollective)\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `provider` | `default` | `undefined` |
| `splCollectiveProgramId` | `PublicKey` | `SplTokenCollective.ID` |
| `splTokenBondingProgramId` | `PublicKey` | `SplTokenBonding.ID` |

#### Returns

`Promise`<[`SplTokenCollective`](SplTokenCollective)\>

#### Defined in

[index.ts:295](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-collective/src/index.ts#L295)
