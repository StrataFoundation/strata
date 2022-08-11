# Strata

What is strata? Check out our [Hello World](https://blog.strataprotocol.com/welcome)

View the live documentation [here](https://docs.strataprotocol.com)

This series of smart contracts serves to standardizing and indexing all social tokens.

Docs are located in `packages/docs`

# Development

We recommend using [localnet](https://docs.solana.com/developing/test-validator) for working on Strata.

## Install Submodules

Pull the deps

```
git submodule init
git submodule update
```

## Lerna Setup

Strata uses Lerna to make it easier to develope on our JS SDKs.

```
npx lerna bootstrap
```

## Build the deps

```
anchor run build-deps
```

To watch for changes,

```
yarn idl // generated idl changes
yarn watch // code changes
```

## Build the Strata packages

```
yarn build
```

## Test

```
anchor test --provider.cluster localnet
```

## Bootstrap the Open Collective

If you wish to use this on devnet, first the open collective needs to be created. This has already been run for devent, but putting it here for the sake of completeness

```
env ANCHOR_WALLET=~/.config/solana/id.json ANCHOR_PROVIDER_URL=https://api.devnet.solana.com yarn run bootstrap
```

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
