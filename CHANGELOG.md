# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.1.3](https://github.com/ChewingGlassFund/wumbo-programs/compare/v2.1.2...v2.1.3) (2022-01-18)

Temporary endpoint to upgrade social token curves

## [2.1.2](https://github.com/ChewingGlassFund/wumbo-programs/compare/v2.1.1...v2.1.2) (2022-01-17)

Downgrade @metaplex/arweave-cost since 2.x.x results in errors

## [2.1.1](https://github.com/ChewingGlassFund/wumbo-programs/compare/v2.1.0...v2.1.1) (2022-01-12)

### Fixed

  * Account fetch cache synchronization after running a txn on a writable account

### Removed

  * Deprecated useWalletTokensWithMeta as it fetches too much data and leads to laggy interfaces

# [2.1.0](https://github.com/ChewingGlassFund/wumbo-programs/compare/v2.0.6...v2.1.0) (2022-01-11)

This release contains logic to limit go live dates for officially going live on mainnet, starting with OPEN collective.

### Added

  * Handle go live date in swap form

### Added

  * Handle go live date in swap form

### Fixed

  * Awaiting approval flag on provider would only go to false after finished txn
  * Pricing didn't update when target mint supply changed
## [2.0.6](https://github.com/ChewingGlassFund/wumbo-programs/compare/v2.0.5...v2.0.6) (2021-12-30)
  * Fix account fetch cache to output parsed data when a parser is provided for something cached
  * Add more options to bonding parameters to social token
  * Account fetch cache bugfixes


## [2.0.5](https://github.com/ChewingGlassFund/wumbo-programs/compare/v2.0.4...v2.0.5) (2021-12-30)

**Note:** Version bump only for package @strata-foundation/strata

### Fixed

  * CI/CD publish did not build first


## [2.0.4](https://github.com/ChewingGlassFund/wumbo-programs/compare/v2.0.3-test...v2.0.4) (2021-12-29)

### Added

  * Ability to add transition fees to piecewise time curves, making for a less bottable fair launch.

### Changed

 * Max pow or frac on exponential curves to 10. Any more than that risks blowing compute.

### Fixed

 * `targetMintDecimals: 0` no longer throws an error.

## [2.0.3](https://github.com/ChewingGlassFund/wumbo-programs/compare/v2.0.2...v2.0.3) (2021-12-24)

**Note:** Version bump only for package @strata-foundation/strata

Testing deploy for governance hookup


## [2.0.2](https://github.com/ChewingGlassFund/wumbo-programs/compare/v2.0.1...v2.0.2) (2021-12-24)

**Note:** Version bump only for package @strata-foundation/strata

Testing deploy for governance hookup


# [2.0.0](https://github.com/ChewingGlassFund/wumbo-programs/compare/v1.3.2...v2.0.0) (2021-12-24)


### Changed
  * Change bonding and collective to new program ids in preparation for mainnet launch

## [1.3.4](https://github.com/StrataFoundation/strata/compare/v1.3.2...v1.3.4) (2021-12-22)

**Note:** Version bump only for package @strata-foundation/strata

### Fixed

 * usePriceInSol broken for wrappedSolMint
 * Use wrappedSolMint from token bonding state instead of global variable, as it is different for every environment. It's too late to fix this as there's already a wrapped sol in prod.
 * baseMint would not show up in swap interface after changing the base once because of a useMemo

## Added

 * unixTime to pricing so we can price the curve at a given point in time


## [1.3.3](https://github.com/StrataFoundation/strata/compare/v1.3.2...v1.3.3) (2021-12-22)

**Note:** Version bump only for package @strata-foundation/strata

* never released

## [1.3.2](https://github.com/ChewingGlassFund/wumbo-programs/compare/v0.7.0...v1.3.2) (2021-12-15)

### Fixed
  * Swap form would show loading when you had zero balance

**Note:** Version bump only for package @strata-foundation/strata

#[1.3.1]

### Fixed
  * Updates to bonding curve were validated against unclaimed collective settings, always.
  * No authority on primary token refs. **NOTE**: To update, rerun set_as_primary_v0

#[1.3.0]
### Changed
  * getPricing -> getPricingCurve in favor of a new getPricing that can price bonding in terms of any token in the hierarchy.
  * useBondingPricing now returns the above
  * usePrice hooks changed to usePriceInUsd and usePriceInSol. These will recursively traverse a social token hierarchy to get its usd price
  * Almost all hooks in tokenRef pertaining to twitter have been changed to be generic name references.

### Added
  * Ability to opt out
  * Ability to swap to any token on the bonding hierarchy.

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
  - Token collective now lives at TCo1sfSr2nCudbeJPykbif64rG9K1JNMGzrtzvPmp3y

### Removed
  - ["token-ref", owner, Pubkey::default] as the primary token ref



## [0.3.9] - 2017-06-20

This is the start of the changelog

### Added

### Changed

### Removed
