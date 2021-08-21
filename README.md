# wumbo-programs

## TODO

We should probably eventually change from @wum.bo/anchor, which is using code from https://github.com/project-serum/anchor/pull/537.


# On Initializing vs Passing

In Solana programs, you can either

  * (a) Pass a fully initialized account to your contract, and verify that it looks the way you expect it to
  * (b) Pass an empty account to the program and have it initialize it as a PDA.

Let's take token bonding as an example. Token bonding bonds a base mint to a target mint. We could either

  * (a) Pass in a target mint that is already initialized and verify it has supply 0 and authority set to token bonding program. 
  * (b) Pass an empty account and have token bonding initialize it with the authority set to itself

### Benefits of Passing:

When we pass the target mint to token bonding, someone could have done something with the mint _before_ it got to token bonding. This is useful in that decorators around the mint will often use the mint authority to give permission for decoration. For example, the Metaplex token metadata contract requires the mint authorities approval. If token bonding initializes the mint, every call to every decorator must go through token bonding

### Detriments of Passing:

Someone could have done something nefarious _before_ it got to token bonding. In the case of a token account, they could have placed a nefarious delegate. You have to be very careful about verifying the pased in account. Additionally, if the smart contract changes to support more fields that could be nefarious, you need to update your own smart contract code to blacklist these fields. 

### Benefits of Initializing

  * **PDAs** - You can only have a PDA of a value that is being initialized by the program. PDAs are useful for quick hash lookups. 
  * **Safety** You can guarentee the object fits the spec of your program and is not nefarious

### Detriments of Initializing

You cannot do anything that requires authority on the account without having to pass through your contract.

## When to use Both

### Passing

Use passing when the account has utility outside of this contract. For example a Mint.

### Initializing

Use initializing for actual program data. For example, for the bonding curve or for the Wumbo token ref. This way users can directly lookup the account via PDA. 

You should also use initializing on Token accounts that are exclusively for the program, for example a holding account in token staking. 

# Wumbo

The Wumbo contract serves as a way of standardizing and indexing all social tokens. A social token is made up of

  * A token mint
  * Token metadata for that mint (picture, name, etc)
  * A bonding curve against that mint to WUM
  * A staking instance of that mint --> Creator Credits
  * A profit share of bonding curve WUM royalties amongst Creator Credits

These should all be initialized and passed to the WUM program; which will verify they fit the standards specified in the WumboInstance. Wumbo should not initialize any of these itself, but should retain authority over

  * The bonding curve
    * The bonding curve has authority over the mint
  * The token metadata
  * The staking instance
  * The profit share

In this way, wumbo ensures all Social Tokens behave the same, and will utilize its authority to ensure they stay the same going forward in time.
