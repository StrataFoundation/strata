# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.htmlq).

#[Unreleased]
### Changed
  * getPricing -> getPricingCurve in favor of a new getPricing that can price bonding in terms of any token in the hierarchy.
  * useBondingPricing now returns the above
  * usePrice hooks changed to usePriceInUsd and usePriceInSol. These will recursively traverse a social token hierarchy to get its usd price
  * Almost all hooks in tokenRef pertaining to twitter have been changed to be generic name references.

### Added
  * Ability to opt out

[1.2.0-3]

Testing builds. Do not use

## [1.1.1]
### Changed
- `prepPayForFilesInstructions` => `prePayForFilesInstructions`

## [1.1.0]
### Added

  - nullable params for hooks

## [1.0.0]
### Added

  - Token ref now has an authority set on it. This controls change to the bonding curve, separate from the owner. This allows a token ref to be associated with a wallet, but controlled by governance.

### Changed

  - Social tokens (tokenRefs) may now have no collective
  - Social tokens (tokenRefs) may now have no bonding curve (supporting binding yourself) to another type of token in future iterations
  - Token refs PDAs are now based on the base mint of their bonding curve, instead of the collective
  - **Switch from token-ref to owner-token-ref, and reverse-token-ref to mint-token-ref. This affects all pdas, and API naming semantics.** 
  - Switch all authorities to concrete accounts. For example, token bonding's mint authority is now the token bonding itself. This makes for easier lookups, and makes the on chain data more descriptive.


## [0.7.0]
### Added
 - Ability to update TokenBonding directly from SplTokenCollective

## [0.6.0]

Minor version bumping it because the below changes included some interface changes, and should have been at least a minor bump

### Added
  - React components, starting with `Swap` to `react` package

## [0.5.5]

### Added
  - Ability to update metadata

### Removed

  - Ability to upload to arweave directly from SplTokenCollective. This should be done separately, and passed via the `metadata.uri` field.

## [0.5.4]
### Changed

  - Pass `metadata.uri` instead of `metadataUri` to bypass arweave uploads
  - Use the newest arweave upload url. Does not currently work in devnet so:
  - Bypass arweave upload in all tutorials


## [0.5.0]
### Added
  - `AnchorSdk` abstract class to remove boilerplate rom sdks

### Changed

  - `createTokenBonding` now returns an object with multiple keys, instead of just the bonding instance

### Removed

  - spl-token-account-split. Working on a proper fanout wallet.


## [0.4.1]

### Added
  - A new token ref at pda "token-ref", owner as the primary token ref
  - SetAsPrimaryV0 endpoint and related sdk updates
  - `curveAuthority` and `reserveAuthority` on token bonding instances that will in the future allow changes to the curve and changes to the reserves account, respectively.
  - Ability to `updateCollective` to change both the config and authority.

### Changed
  - Token collective now lives at TCo1sP6RwuCuyHPHjxgzcrq4dX4BKf9oRQ3aJMcdFry

### Removed
  - ["token-ref", owner, Pubkey::default] as the primary token ref



## [0.3.9] - 2017-06-20

This is the start of the changelog

### Added

### Changed

### Removed
