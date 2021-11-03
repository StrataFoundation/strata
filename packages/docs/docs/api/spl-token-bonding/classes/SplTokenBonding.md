---
id: "SplTokenBonding"
title: "Class: SplTokenBonding"
sidebar_label: "SplTokenBonding"
sidebar_position: 0
custom_edit_url: null
---

## Constructors

### constructor

• **new SplTokenBonding**(`provider`, `program`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `provider` | `default` |
| `program` | `Program`<[`SplTokenBondingIDL`](../modules#spltokenbondingidl)\> |

#### Defined in

[packages/spl-token-bonding/src/index.ts:333](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L333)

## Properties

### program

• **program**: `Program`<[`SplTokenBondingIDL`](../modules#spltokenbondingidl)\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:320](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L320)

___

### provider

• **provider**: `default`

#### Defined in

[packages/spl-token-bonding/src/index.ts:321](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L321)

___

### state

• **state**: `undefined` \| `TypeDef`<{ `name`: ``"programStateV0"`` ; `type`: { `fields`: [{ `name`: ``"wrappedSolMint"`` ; `type`: ``"publicKey"``  }, { `name`: ``"solStorage"`` ; `type`: ``"publicKey"``  }, { `name`: ``"mintAuthorityBumpSeed"`` ; `type`: ``"u8"``  }, { `name`: ``"solStorageBumpSeed"`` ; `type`: ``"u8"``  }, { `name`: ``"bumpSeed"`` ; `type`: ``"u8"``  }] ; `kind`: ``"struct"``  }  } & { `name`: ``"programStateV0"``  } & `never` & `never`, `Record`<`string`, `never`\>\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:322](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L322)

___

### ID

▪ `Static` **ID**: `PublicKey`

#### Defined in

[packages/spl-token-bonding/src/index.ts:324](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L324)

## Accessors

### account

• `get` **account**(): `AccountNamespace`<[`SplTokenBondingIDL`](../modules#spltokenbondingidl)\>

#### Returns

`AccountNamespace`<[`SplTokenBondingIDL`](../modules#spltokenbondingidl)\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:354](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L354)

___

### errors

• `get` **errors**(): `Map`<`number`, `string`\>

#### Returns

`Map`<`number`, `string`\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:358](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L358)

___

### instruction

• `get` **instruction**(): `InstructionNamespace`<[`SplTokenBondingIDL`](../modules#spltokenbondingidl), { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"state"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"solStorage"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"wrappedSolMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"mintAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"rent"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeSolStorageV0Args"``  }  }] ; `name`: ``"initializeSolStorageV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"state"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"wrappedSolMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"mintAuthority"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"solStorage"``  }, { `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"source"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"destination"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"BuyWrappedSolV0Args"``  }  }] ; `name`: ``"buyWrappedSolV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"state"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"wrappedSolMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"solStorage"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"source"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"owner"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"destination"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"SellWrappedSolV0Args"``  }  }] ; `name`: ``"sellWrappedSolV0"``  } \| { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"rent"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"CreateCurveV0Args"``  }  }] ; `name`: ``"createCurveV0"``  } \| { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeTokenBondingV0Args"``  }  }] ; `name`: ``"initializeTokenBondingV0"``  } \| { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"refund"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"authority"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMintAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseStorageAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }] ; `args`: [] ; `name`: ``"closeTokenBondingV0"``  } \| { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"authority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"buyBaseRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"buyTargetRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"sellBaseRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"sellTargetRoyalties"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"UpdateTokenBondingV0Args"``  }  }] ; `name`: ``"updateTokenBondingV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMintAuthority"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"BuyV0Args"``  }  }] ; `name`: ``"buyV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"sellBaseRoyalties"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"SellV0Args"``  }  }] ; `name`: ``"sellV0"``  }\>

#### Returns

`InstructionNamespace`<[`SplTokenBondingIDL`](../modules#spltokenbondingidl), { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"state"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"solStorage"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"wrappedSolMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"mintAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"rent"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeSolStorageV0Args"``  }  }] ; `name`: ``"initializeSolStorageV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"state"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"wrappedSolMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"mintAuthority"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"solStorage"``  }, { `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"source"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"destination"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"BuyWrappedSolV0Args"``  }  }] ; `name`: ``"buyWrappedSolV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"state"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"wrappedSolMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"solStorage"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"source"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"owner"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"destination"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"SellWrappedSolV0Args"``  }  }] ; `name`: ``"sellWrappedSolV0"``  } \| { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"rent"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"CreateCurveV0Args"``  }  }] ; `name`: ``"createCurveV0"``  } \| { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeTokenBondingV0Args"``  }  }] ; `name`: ``"initializeTokenBondingV0"``  } \| { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"refund"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"authority"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMintAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseStorageAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }] ; `args`: [] ; `name`: ``"closeTokenBondingV0"``  } \| { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"authority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"buyBaseRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"buyTargetRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"sellBaseRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"sellTargetRoyalties"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"UpdateTokenBondingV0Args"``  }  }] ; `name`: ``"updateTokenBondingV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMintAuthority"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"BuyV0Args"``  }  }] ; `name`: ``"buyV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"sellBaseRoyalties"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"SellV0Args"``  }  }] ; `name`: ``"sellV0"``  }\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:346](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L346)

___

### programId

• `get` **programId**(): `PublicKey`

#### Returns

`PublicKey`

#### Defined in

[packages/spl-token-bonding/src/index.ts:338](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L338)

___

### rpc

• `get` **rpc**(): `RpcNamespace`<[`SplTokenBondingIDL`](../modules#spltokenbondingidl), { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"state"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"solStorage"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"wrappedSolMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"mintAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"rent"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeSolStorageV0Args"``  }  }] ; `name`: ``"initializeSolStorageV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"state"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"wrappedSolMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"mintAuthority"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"solStorage"``  }, { `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"source"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"destination"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"BuyWrappedSolV0Args"``  }  }] ; `name`: ``"buyWrappedSolV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"state"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"wrappedSolMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"solStorage"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"source"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"owner"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"destination"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"SellWrappedSolV0Args"``  }  }] ; `name`: ``"sellWrappedSolV0"``  } \| { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"rent"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"CreateCurveV0Args"``  }  }] ; `name`: ``"createCurveV0"``  } \| { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeTokenBondingV0Args"``  }  }] ; `name`: ``"initializeTokenBondingV0"``  } \| { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"refund"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"authority"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMintAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseStorageAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }] ; `args`: [] ; `name`: ``"closeTokenBondingV0"``  } \| { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"authority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"buyBaseRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"buyTargetRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"sellBaseRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"sellTargetRoyalties"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"UpdateTokenBondingV0Args"``  }  }] ; `name`: ``"updateTokenBondingV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMintAuthority"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"BuyV0Args"``  }  }] ; `name`: ``"buyV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"sellBaseRoyalties"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"SellV0Args"``  }  }] ; `name`: ``"sellV0"``  }\>

#### Returns

`RpcNamespace`<[`SplTokenBondingIDL`](../modules#spltokenbondingidl), { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"state"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"solStorage"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"wrappedSolMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"mintAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"rent"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeSolStorageV0Args"``  }  }] ; `name`: ``"initializeSolStorageV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"state"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"wrappedSolMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"mintAuthority"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"solStorage"``  }, { `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"source"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"destination"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"BuyWrappedSolV0Args"``  }  }] ; `name`: ``"buyWrappedSolV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"state"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"wrappedSolMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"solStorage"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"source"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"owner"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"destination"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"SellWrappedSolV0Args"``  }  }] ; `name`: ``"sellWrappedSolV0"``  } \| { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"systemProgram"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"rent"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"CreateCurveV0Args"``  }  }] ; `name`: ``"createCurveV0"``  } \| { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``true`` ; `name`: ``"payer"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"InitializeTokenBondingV0Args"``  }  }] ; `name`: ``"initializeTokenBondingV0"``  } \| { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"refund"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"authority"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMintAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseStorageAuthority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenProgram"``  }] ; `args`: [] ; `name`: ``"closeTokenBondingV0"``  } \| { `accounts`: [{ `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``true`` ; `name`: ``"authority"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"buyBaseRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"buyTargetRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"sellBaseRoyalties"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"sellTargetRoyalties"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"UpdateTokenBondingV0Args"``  }  }] ; `name`: ``"updateTokenBondingV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"targetMintAuthority"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"BuyV0Args"``  }  }] ; `name`: ``"buyV0"``  } \| { `accounts`: [{ `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"tokenBonding"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"curve"``  }, { `isMut`: ``false`` ; `isSigner`: ``false`` ; `name`: ``"baseMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"targetMint"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"baseStorage"``  }, { `isMut`: ``true`` ; `isSigner`: ``false`` ; `name`: ``"sellBaseRoyalties"``  }] ; `args`: [{ `name`: ``"args"`` ; `type`: { `defined`: ``"SellV0Args"``  }  }] ; `name`: ``"sellV0"``  }\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:342](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L342)

___

### wallet

• `get` **wallet**(): `Wallet`

#### Returns

`Wallet`

#### Defined in

[packages/spl-token-bonding/src/index.ts:350](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L350)

## Methods

### accountExists

▸ **accountExists**(`account`): `Promise`<`boolean`\>

General utility function to check if an account exists

#### Parameters

| Name | Type |
| :------ | :------ |
| `account` | `PublicKey` |

#### Returns

`Promise`<`boolean`\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:866](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L866)

___

### baseStorageAuthorityKey

▸ **baseStorageAuthorityKey**(`tokenBonding`): `Promise`<[`PublicKey`, `number`]\>

Get the PDA key of the account that should be the authority on the base storage (reserve) account of a bonding curve that doesn't have sell frozen.

#### Parameters

| Name | Type |
| :------ | :------ |
| `tokenBonding` | `PublicKey` |

#### Returns

`Promise`<[`PublicKey`, `number`]\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:560](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L560)

___

### buy

▸ **buy**(`args`): `Promise`<`void`\>

Runs [buy](SplTokenBonding#buy)

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`IBuyArgs`](../interfaces/IBuyArgs) |

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:1205](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L1205)

___

### buyInstructions

▸ **buyInstructions**(`param0`): `Promise`<`InstructionResult`<``null``\>\>

Issue a command to buy `targetMint` tokens with `baseMint` tokens.

#### Parameters

| Name | Type |
| :------ | :------ |
| `param0` | [`IBuyArgs`](../interfaces/IBuyArgs) |

#### Returns

`Promise`<`InstructionResult`<``null``\>\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:1049](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L1049)

___

### createTemporaryWSolAccount

▸ **createTemporaryWSolAccount**(`param0`): `Promise`<`Object`\>

Create a temporary account with `amount` twSOL, the token bonding wrapped sol mint.

#### Parameters

| Name | Type |
| :------ | :------ |
| `param0` | `Object` |
| `param0.amount` | `number` |
| `param0.owner` | `PublicKey` |
| `param0.payer` | `PublicKey` |

#### Returns

`Promise`<`Object`\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:954](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L954)

___

### createTokenBonding

▸ **createTokenBonding**(`args`): `Promise`<`PublicKey`\>

Runs {@link `createTokenBondingInstructions`}

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ICreateTokenBondingArgs`](../interfaces/ICreateTokenBondingArgs) |

#### Returns

`Promise`<`PublicKey`\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:876](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L876)

___

### createTokenBondingInstructions

▸ **createTokenBondingInstructions**(`param0`): `Promise`<`InstructionResult`<`Object`\>\>

Create a bonding curve

#### Parameters

| Name | Type |
| :------ | :------ |
| `param0` | [`ICreateTokenBondingArgs`](../interfaces/ICreateTokenBondingArgs) |

#### Returns

`Promise`<`InstructionResult`<`Object`\>\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:573](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L573)

___

### getCurve

▸ **getCurve**(`key`, `baseStorage`, `baseMint`, `targetMint`): `Promise`<[`Curve`](../interfaces/Curve)\>

Given some reserves and supply, get a pricing model for a curve at `key`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `PublicKey` |
| `baseStorage` | `AccountInfo` |
| `baseMint` | `MintInfo` |
| `targetMint` | `MintInfo` |

#### Returns

`Promise`<[`Curve`](../interfaces/Curve)\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:1390](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L1390)

___

### getPricing

▸ **getPricing**(`tokenBonding`): `Promise`<[`Curve`](../interfaces/Curve)\>

Get a class capable of displaying pricing information or this token bonding at its current reserve and supply

#### Parameters

| Name | Type |
| :------ | :------ |
| `tokenBonding` | `PublicKey` |

#### Returns

`Promise`<[`Curve`](../interfaces/Curve)\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:1372](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L1372)

___

### getState

▸ **getState**(): `Promise`<``null`` \| `TypeDef`<{ `name`: ``"programStateV0"`` ; `type`: { `fields`: [{ `name`: ``"wrappedSolMint"`` ; `type`: ``"publicKey"``  }, { `name`: ``"solStorage"`` ; `type`: ``"publicKey"``  }, { `name`: ``"mintAuthorityBumpSeed"`` ; `type`: ``"u8"``  }, { `name`: ``"solStorageBumpSeed"`` ; `type`: ``"u8"``  }, { `name`: ``"bumpSeed"`` ; `type`: ``"u8"``  }] ; `kind`: ``"struct"``  }  } & { `name`: ``"programStateV0"``  } & `never` & `never`, `Record`<`string`, `never`\>\>\>

#### Returns

`Promise`<``null`` \| `TypeDef`<{ `name`: ``"programStateV0"`` ; `type`: { `fields`: [{ `name`: ``"wrappedSolMint"`` ; `type`: ``"publicKey"``  }, { `name`: ``"solStorage"`` ; `type`: ``"publicKey"``  }, { `name`: ``"mintAuthorityBumpSeed"`` ; `type`: ``"u8"``  }, { `name`: ``"solStorageBumpSeed"`` ; `type`: ``"u8"``  }, { `name`: ``"bumpSeed"`` ; `type`: ``"u8"``  }] ; `kind`: ``"struct"``  }  } & { `name`: ``"programStateV0"``  } & `never` & `never`, `Record`<`string`, `never`\>\>\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:1210](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L1210)

___

### initializeCurve

▸ **initializeCurve**(`args`): `Promise`<`PublicKey`\>

See [initializeCurve](SplTokenBonding#initializecurve)

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`IInitializeCurveArgs`](../interfaces/IInitializeCurveArgs) |

#### Returns

`Promise`<`PublicKey`\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:523](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L523)

___

### initializeCurveInstructions

▸ **initializeCurveInstructions**(`param0`): `Promise`<`InstructionResult`<`Object`\>\>

Create a curve shape for use in a TokenBonding instance

#### Parameters

| Name | Type |
| :------ | :------ |
| `param0` | [`IInitializeCurveArgs`](../interfaces/IInitializeCurveArgs) |

#### Returns

`Promise`<`InstructionResult`<`Object`\>\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:487](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L487)

___

### initializeSolStorage

▸ **initializeSolStorage**(): `Promise`<`void`\>

Admin command run once to initialize the smart contract

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:471](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L471)

___

### initializeSolStorageInstructions

▸ **initializeSolStorageInstructions**(): `Promise`<`InstructionResult`<``null``\>\>

This is an admin function run once to initialize the smart contract.

#### Returns

`Promise`<`InstructionResult`<``null``\>\>

Instructions needed to create sol storage

#### Defined in

[packages/spl-token-bonding/src/index.ts:374](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L374)

___

### sell

▸ **sell**(`args`): `Promise`<`void`\>

Runs [sell](SplTokenBonding#sell)

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ISellArgs`](../interfaces/ISellArgs) |

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:1361](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L1361)

___

### sellInstructions

▸ **sellInstructions**(`param0`): `Promise`<`InstructionResult`<``null``\>\>

Instructions to burn `targetMint` tokens in exchange for `baseMint` tokens

#### Parameters

| Name | Type |
| :------ | :------ |
| `param0` | [`ISellArgs`](../interfaces/ISellArgs) |

#### Returns

`Promise`<`InstructionResult`<``null``\>\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:1228](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L1228)

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

[packages/spl-token-bonding/src/index.ts:365](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L365)

___

### tokenBondingKey

▸ **tokenBondingKey**(`targetMint`, `index`): `Promise`<[`PublicKey`, `number`]\>

Get the PDA key of a TokenBonding given the target mint and index

`index` = 0 is the default bonding curve that can mint `targetMint`. All other curves are curves that allow burning of `targetMint` for some different base.

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetMint` | `PublicKey` |
| `index` | `number` |

#### Returns

`Promise`<[`PublicKey`, `number`]\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:546](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L546)

___

### updateTokenBonding

▸ **updateTokenBonding**(`args`): `Promise`<`void`\>

Runs [updateTokenBonding](SplTokenBonding#updatetokenbonding)

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`IUpdateTokenBondingArgs`](../interfaces/IUpdateTokenBondingArgs) |

#### Returns

`Promise`<`void`\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:943](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L943)

___

### updateTokenBondingInstructions

▸ **updateTokenBondingInstructions**(`param0`): `Promise`<`InstructionResult`<``null``\>\>

Update a bonding curve.

#### Parameters

| Name | Type |
| :------ | :------ |
| `param0` | [`IUpdateTokenBondingArgs`](../interfaces/IUpdateTokenBondingArgs) |

#### Returns

`Promise`<`InstructionResult`<``null``\>\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:892](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L892)

___

### init

▸ `Static` **init**(`provider`, `splTokenBondingProgramId?`): `Promise`<[`SplTokenBonding`](SplTokenBonding)\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `provider` | `default` | `undefined` |
| `splTokenBondingProgramId` | `PublicKey` | `SplTokenBonding.ID` |

#### Returns

`Promise`<[`SplTokenBonding`](SplTokenBonding)\>

#### Defined in

[packages/spl-token-bonding/src/index.ts:326](https://github.com/ChewingGlassFund/wumbo-programs/blob/2de409b/packages/spl-token-bonding/src/index.ts#L326)
