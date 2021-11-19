# Strata

View the live documentation [here](https://strataprotocol.com/docs)

This series of smart contracts serves to standardizing and indexing all social tokens.

Docs are located in `packages/docs`

# Development

## Install Submodules

Pull the deps

```
git submodule init
git submodule update
```

## Lerna Setup

Strata uses Lerna to make it easier to develope on our JS SDKs.

```
lerna bootstrap
```

## Build the deps

```
anchor run build-deps
```

## Test

```
anchor test
```

## Bootstrap the Open Collective

If you wish to use this on devnet, first the open collective needs to be created. This has already been run for devent, but putting it here for the sake of completeness

```
env ANCHOR_WALLET=~/.config/solana/id.json ANCHOR_PROVIDER_URL=https://api.devnet.solana.com yarn run bootstrap
```


## Development Philosophy: On Initializing vs Passing

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

## Contribution

Thank you for your interest in contributing to Strata! All contributions are welcome no
matter how big or small. This includes (but is not limited to) filing issues,
adding documentation, fixing bugs, creating examples, and implementing features.

If you'd like to contribute, please claim an issue by commenting, forking, and
opening a pull request, even if empty. This allows the maintainers to track who
is working on what issue as to not overlap work.

For simple documentation changes, feel free to just open a pull request.

If you're considering larger changes or self motivated features, please file an issue
and engage with the maintainers in [Discord](https://discord.gg/XQhCFg77WM).
