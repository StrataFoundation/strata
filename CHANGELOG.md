# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.11.2](https://github.com/StrataFoundation/strata/compare/v3.11.1...v3.11.2) (2022-09-16)

**Note:** Version bump only for package @strata-foundation/strata





## [3.11.1](https://github.com/StrataFoundation/strata/compare/v3.10.1...v3.11.1) (2022-09-12)

**Note:** Version bump only for package @strata-foundation/strata





# [3.11.0](https://github.com/StrataFoundation/strata/compare/v3.10.1...v3.11.0) (2022-09-12)

**Note:** Version bump only for package @strata-foundation/strata





## [3.10.3](https://github.com/StrataFoundation/strata/compare/v3.9.12...v3.10.3) (2022-08-23)

**Note:** Version bump only for package @strata-foundation/strata





## [3.10.2](https://github.com/StrataFoundation/strata/compare/v3.10.1...v3.10.2) (2022-08-10)

Upgrade to tsc as our build system from rollup. Should fix most of the build issues we've been having


# [3.10.0](https://github.com/StrataFoundation/strata/compare/v3.9.12...v3.10.0) (2022-08-04)

# Changed
  * Massively reduce bundle size by bundling everything with rollup, using proper side effect free esm.
  * Remove barrel style exports to help with tree shaking

# Breaking

  * StrataProviders no longer includes TokenListProvider. Manually include this if you would like token list fallback.

## [3.9.5](https://github.com/StrataFoundation/strata/compare/v3.9.4...v3.9.5) (2022-07-26)

**Note:** Version bump only for package @strata-foundation/strata

### Fixed

  * Bug in submitting multiple transactions with empty transaction groups


## [3.9.4](https://github.com/StrataFoundation/strata/compare/v3.9.3...v3.9.4) (2022-07-26)

**Note:** Version bump only for package @strata-foundation/strata

### Fixed

  * Make react a peer dep in chat-ui and marketplace-ui packages


## [3.9.3](https://github.com/StrataFoundation/strata/compare/v3.9.2...v3.9.3) (2022-07-25)

### Changed

  * Better light mode for MintedNftNotification
  * Remove "NFTs" as symbol from intermediary tokens on candymachine mints.


## [3.9.2](https://github.com/StrataFoundation/strata/compare/v3.9.1...v3.9.2) (2022-07-12)

### Fixed
 
  * Disburse funds and transfer on both token bonding and fungible entangler could, under some circumstances, transer to an ata of an ata

## [3.9.1](https://github.com/StrataFoundation/strata/compare/v3.9.0...v3.9.1) (2022-07-12)

## Fixed

  * Remove compute budget changes that cause bonding tx not to run


# [3.9.0](https://github.com/StrataFoundation/strata/compare/v3.8.2...v3.9.0) (2022-07-11)

## Breaking

  * Move `HolaplexGraphqlProvider` to `react` package
  * Move `useEndpoint` from `marketplace-ui` to `react` package
  * Switch to fungible entangler for token offerings (selling a token without giving mint authority)
    * Legacy implementations (system of two bonding curves, one sell only) are still supported. But deprecated
  * `Swap` component now takes `id=` `mint` or `child entangler` public key

## Added

  * Fungible entangler is now officially in use. Pre-release instructions have changed.
  * Chat packages now published for experimentation. These interfaces are subject to change, and `chat` program is not yet under governance.


## [3.8.2](https://github.com/StrataFoundation/strata/compare/v3.8.1...v3.8.2) (2022-06-19)

### Fixed

  * Multiple account fetch caches floating around causing updates not to propegate

## [3.8.1](https://github.com/StrataFoundation/strata/compare/v3.8.0...v3.8.1) (2022-06-18)

### Fixed

   * Not passing commitment to connection constructor could cause issues with accountFetchCache
   * BigNumber overflow on BondingPlot

### Changed

  * DEFAULT_COMMITMENT to "confirmed"


# [3.8.0](https://github.com/StrataFoundation/strata/compare/v3.7.1...v3.8.0) (2022-06-17)

### Added

   * marketplace-ui bonding plots now show price changes over time that weren't from buys, but rather the curve characteristics.


## [3.7.1](https://github.com/StrataFoundation/strata/compare/v3.7.0...v3.7.1) (2022-06-14)

**Note:** Version bump only for package @strata-foundation/strata

### Fixed

  * Pricing updates on `useLivePrive` were not reactive to pricing changes, only `unixTime`

# [3.7.0](https://github.com/StrataFoundation/strata/compare/v3.5.5...v3.7.0) (2022-06-02)

### Changed
  
  * Use solana clock as the source of truth for pricing and timing

### Bug Fixes

* **CandyMachine:** add setCollectionDuringMint instruction to mintOneToken ([#246](https://github.com/StrataFoundation/strata/issues/246)) ([275c627](https://github.com/StrataFoundation/strata/commit/275c6274a50ac7fb7f35292fc34f5d03ee287396))
* **token-bonding:** use toArrayLike for compatibility ([#228](https://github.com/StrataFoundation/strata/issues/228)) ([b0e8cfa](https://github.com/StrataFoundation/strata/commit/b0e8cfa3d82e72c75534dae36e428a9b13b80664))
* **transactions:** remove subscription if available ([#230](https://github.com/StrataFoundation/strata/issues/230)) ([e99f05c](https://github.com/StrataFoundation/strata/commit/e99f05c02dd1f0176c8303608ea4859c68774cf4))






## [3.6.1](https://github.com/StrataFoundation/strata/compare/v3.6.0...v3.6.1) (2022-05-21)

**Note:** Version bump only for package @strata-foundation/strata



## Breaking
  * Stop defaulting to my wallet in `useSolOwnedAmount`, causes issues with params that were not originally passed but are passed later


# [3.6.0](https://github.com/StrataFoundation/strata/compare/v3.5.7...v3.6.0) (2022-05-13)

### Added

  * Documentation/admin page for Dynamic Pricing Mint

### Changed

  * Improvements to UI/UX of Swap Form, including dark mode support
  * Swap form recognizes when there are no tokens


## Breaking

  * Padding was removed on SwapForm so it can be more easily embedded


## [3.5.7](https://github.com/StrataFoundation/strata/compare/v3.5.5...v3.5.7) (2022-05-07)

### Changed

- **transactions:** remove subscription if available ([#230](https://github.com/StrataFoundation/strata/issues/230)) ([e99f05c](https://github.com/StrataFoundation/strata/commit/e99f05c02dd1f0176c8303608ea4859c68774cf4))

## [3.5.6](https://github.com/StrataFoundation/strata/compare/v3.5.5...v3.5.6) (2022-05-06)

### Bug Fixes

- **token-bonding:** use toArrayLike for compatibility ([#228](https://github.com/StrataFoundation/strata/issues/228)) ([b0e8cfa](https://github.com/StrataFoundation/strata/commit/b0e8cfa3d82e72c75534dae36e428a9b13b80664))

## [3.5.5](https://github.com/StrataFoundation/strata/compare/v3.5.4...v3.5.5) (2022-04-19)

### Added

- `useBondedTokenPrice` to get the price of a bonded token in terms of a `priceToken`. For example, to price a bonded token in usdc (where possible)
- `useJupiterPrice` use pricing information from jup.ag

### Changed

- Primary pricing goes through jup.ag instead of coingecko.

## [3.5.4](https://github.com/StrataFoundation/strata/compare/v3.5.2...v3.5.4) (2022-04-18)

### Added

- `ManyToOneSwap` so that you can use many tokens to purchase one token.
- Strata attribution on SwapForm

### Fixed

- Race condition on accountFetchCache could lead to unfetched missing accounts

## [3.5.3](https://github.com/StrataFoundation/strata/compare/v3.5.2...v3.5.3) (2022-04-18)

**Note:** Version bump only for package @strata-foundation/strata

## [3.5.2](https://github.com/StrataFoundation/strata/compare/v3.5.2-alpha.0...v3.5.2) (2022-04-16)

- Bugfix for when `baseAmount` is not passed to `tokenBondingSdk.swap`.

## [3.5.1](https://github.com/StrataFoundation/strata/compare/v3.5.0...v3.5.1) (2022-04-15)

**Note:** Version bump only for package @strata-foundation/strata

### Changed

- curve.ts uses .toString for frontend logic of large decimal numbers now (Number can only safely store up to 53 bits)

# [3.5.0](https://github.com/StrataFoundation/strata/compare/v3.4.7...v3.5.0) (2022-04-07)

### Remove

- Deprecated buy_v0 and sell_v0 endpoints

### Fixed

- useAccount public key merging only happens on pure objects

## [3.4.7](https://github.com/StrataFoundation/strata/compare/v3.4.6...v3.4.7) (2022-04-05)

### Changed

- Fix swap form and other re-rendering issues in react package due to new public keys being constructed on websocket changes.

## [3.4.6](https://github.com/StrataFoundation/strata/compare/v3.4.5...v3.4.6) (2022-04-04)

Add `web3-token-auth` package to auth against genesysgo endpoints

## [3.4.5](https://github.com/StrataFoundation/strata/compare/v3.4.1...v3.4.5) (2022-03-29)

**Note:** Version bump only for package @strata-foundation/strata

Drop support of nftstorage until we upgrade packages to webpack5

## [3.4.4](https://github.com/StrataFoundation/strata/compare/v3.4.3...v3.4.4) (2022-03-27)

Rectifying CI/CD issues. 3.4.3 does not exist.

## [3.4.3](https://github.com/StrataFoundation/strata/compare/v3.4.1...v3.4.3) (2022-03-26)

Rectifying build issue with @types/gtag

## [3.4.2](https://github.com/StrataFoundation/strata/compare/v3.4.1...v3.4.2) (2022-03-26)

Revert esm module import to fix CI/CD issues

## [3.4.1](https://github.com/StrataFoundation/strata/compare/v3.4.0...v3.4.1) (2022-03-25)

Rectifying CI/CD issues. 3.4.0 does not exist.

# [3.4.0](https://github.com/StrataFoundation/strata/compare/v3.3.6...v3.4.0) (2022-03-25)

### Changed

- TimeDecayExponentialCurves inside of TimeCurve now use their starting offset to calculate the time decay,
  instead of the offset from the bonding go live.

## [3.3.6](https://github.com/StrataFoundation/strata/compare/v3.3.4...v3.3.6) (2022-03-16)

**Note:** Version bump only for package @strata-foundation/strata

## [3.3.5](https://github.com/StrataFoundation/strata/compare/v3.3.4...v3.3.5) (2022-03-16)

**Note:** Version bump only for package @strata-foundation/strata

### Fixed

- Allow null royalties

## [3.3.4](https://github.com/StrataFoundation/strata/compare/v3.3.2...v3.3.4) (2022-03-16)

**Note:** Version bump only for package @strata-foundation/strata

### Fixed

- Build issue in Disclosures of marketplace-ui

## [3.3.3](https://github.com/StrataFoundation/strata/compare/v3.3.2...v3.3.3) (2022-03-16)

**Note:** Version bump only for package @strata-foundation/strata

### Added

- Launchpad for ease of spinning up curves
- protocolFee Add protocol level fees
- iAmAFreeloader Refuse to pay fees to the protocol maintainers

## [3.3.2]

### Breaking

- Moved `useCapInfo` to `react` package from `marketplace-ui`

### Added

- Disburse funds to token offering

## [3.3.1](https://github.com/StrataFoundation/strata/compare/v3.3.1-alpha.1...v3.3.1) (2022-03-09)

### Added

- Set a mint token ref as the authority on a bounty, and the owner of that social token can disburse the bounty
- Add `disburseBounty` to marketplace sdk
- Add ability to sell some initial supply of tokens using bonding curves without the need for bonding to take mint authority. Instead send the tokens to a second sell-only bonding curve. See `marketplaceSdk.createTokenBondingForSetSupply`
- Prices for any top level token that has its mpl or token list metadata.name set to its coingecko id (case insensitive)

### Changed

- Refactor BountyDetails UI, breaking into components

### Fixed

- Swallowed errors on `useClaimedTokenRefKey` and a version conflict in borsh that causes errors

# [3.3.0](https://github.com/StrataFoundation/strata/compare/v3.2.6...v3.3.0) (2022-03-04)

### Changed

- Upgrade to anchor 0.22 and refactor

### Added

- LBC/Dynamic mint UI

### Changed

- Bounties ui elements are now more extensible

## [3.2.4](https://github.com/StrataFoundation/strata/compare/v3.2.4-alpha.5...v3.2.4) (2022-02-12)

### Added

- Bounties UI
- Update reserve authority

## [3.2.3](https://github.com/StrataFoundation/strata/compare/v3.2.2...v3.2.3) (2022-02-09)

**Note:** Version bump only for package @strata-foundation/strata

### Fixed

- useMetaplexTokenMetadata hook always showing as loading if no metadata found
- Better tx errors

## [3.2.2](https://github.com/StrataFoundation/strata/compare/v3.2.1...v3.2.2) (2022-02-08)

### Fixed

- Social tokens can be created now with no collective. A recent change to the bonding contract broke this.

## [3.2.1](https://github.com/StrataFoundation/strata/compare/v3.2.0...v3.2.1) (2022-02-08)

### Changed

- Transactions executed via transactions.ts (this includes all sdks) now have candymachine retry logic. This should improve reliability
  when the network is congested

# [3.2.0](https://github.com/StrataFoundation/strata/compare/v3.1.0...v3.2.0) (2022-02-03)

- Push all native sol operations into the program layer, and remove wrapping from the client

### Added

- Swap form allows bottom amount
- Docs playground

# [3.1.0](https://github.com/StrataFoundation/strata/compare/v3.0.0...v3.1.0) (2022-01-29)

### Breaking

- `fromCurve` and all curve.ts signatures changed to expect numbers instead of mint accounts

### Changed

- SellFrozen curves, i.e. marketplace curves now are not adaptive with respect to reserves.
- Closing the bonding curve gives you back mint authority. This is better for liquidity bootstrapping

# [3.0.0](https://github.com/StrataFoundation/strata/compare/v2.2.0...v3.0.0) (2022-01-26)

This was a major version bump because of the upgrade to metaplex mpl-token-metadata and metadata v2. This removed several methods from spl-utils that were token-metadata related.

### Removed

- Remove the entirety of metadata.ts. Switch to @metaplex-foundation/mpl-token-metadata

### Changed

- Upgrade to metaplex metadata v2

# [2.2.0](https://github.com/StrataFoundation/strata/compare/v2.1.11...v2.2.0) (2022-01-25)

### Added

- Change Authority on Social Token
- Change Owner on Social Token

## [2.1.12]

Another attempt at fixing claim

## [2.1.10](https://github.com/StrataFoundation/strata/compare/v2.1.8...v2.1.10) (2022-01-20)

**Note:** Version bump only for package @strata-foundation/strata

Fix v2 for claiming already minted token

## [2.1.9](https://github.com/StrataFoundation/strata/compare/v2.1.8...v2.1.9) (2022-01-20)

**Note:** Version bump only for package @strata-foundation/strata

Fix for claiming already minted token

## [2.1.8](https://github.com/StrataFoundation/strata/compare/v2.1.7...v2.1.8) (2022-01-20)

**Note:** Version bump only for package @strata-foundation/strata

### Added

- Ability to opt out claimed tokens

## [2.1.7](https://github.com/StrataFoundation/strata/compare/v2.1.6...v2.1.7) (2022-01-20)

**Note:** Version bump only for package @strata-foundation/strata

### Fixed

- Go live dates before now get set to now in token bonding

### Removed

- Transaction lock on account fetch cache

## [2.1.6](https://github.com/StrataFoundation/strata/compare/v2.1.5...v2.1.6) (2022-01-19)

### Fixed

- useSolPrice now uses connection from context

## [2.1.5](https://github.com/StrataFoundation/strata/compare/v2.1.4...v2.1.5) (2022-01-19)

**Note:** Version bump only for package @strata-foundation/strata

## [2.1.4](https://github.com/StrataFoundation/strata/compare/v2.1.3...v2.1.4) (2022-01-19)

Temporary endpoint to upgrade social token royalties that were pointed incorrectly

## [2.1.3](https://github.com/StrataFoundation/strata/compare/v2.1.2...v2.1.3) (2022-01-18)

Temporary endpoint to upgrade social token curves

## [2.1.2](https://github.com/StrataFoundation/strata/compare/v2.1.1...v2.1.2) (2022-01-17)

Downgrade @metaplex/arweave-cost since 2.x.x results in errors

## [2.1.1](https://github.com/StrataFoundation/strata/compare/v2.1.0...v2.1.1) (2022-01-12)

### Fixed

- Account fetch cache synchronization after running a txn on a writable account

### Removed

- Deprecated useWalletTokensWithMeta as it fetches too much data and leads to laggy interfaces

# [2.1.0](https://github.com/StrataFoundation/strata/compare/v2.0.6...v2.1.0) (2022-01-11)

This release contains logic to limit go live dates for officially going live on mainnet, starting with OPEN collective.

### Added

- Handle go live date in swap form

### Added

- Handle go live date in swap form

### Fixed

- Awaiting approval flag on provider would only go to false after finished txn
- Pricing didn't update when target mint supply changed

## [2.0.6](https://github.com/StrataFoundation/strata/compare/v2.0.5...v2.0.6) (2021-12-30)

- Fix account fetch cache to output parsed data when a parser is provided for something cached
- Add more options to bonding parameters to social token
- Account fetch cache bugfixes

## [2.0.5](https://github.com/StrataFoundation/strata/compare/v2.0.4...v2.0.5) (2021-12-30)

**Note:** Version bump only for package @strata-foundation/strata

### Fixed

- CI/CD publish did not build first

## [2.0.4](https://github.com/StrataFoundation/strata/compare/v2.0.3-test...v2.0.4) (2021-12-29)

### Added

- Ability to add transition fees to piecewise time curves, making for a less bottable fair launch.

### Changed

- Max pow or frac on exponential curves to 10. Any more than that risks blowing compute.

### Fixed

- `targetMintDecimals: 0` no longer throws an error.

## [2.0.3](https://github.com/StrataFoundation/strata/compare/v2.0.2...v2.0.3) (2021-12-24)

**Note:** Version bump only for package @strata-foundation/strata

Testing deploy for governance hookup

## [2.0.2](https://github.com/StrataFoundation/strata/compare/v2.0.1...v2.0.2) (2021-12-24)

**Note:** Version bump only for package @strata-foundation/strata

Testing deploy for governance hookup

# [2.0.0](https://github.com/StrataFoundation/strata/compare/v1.3.2...v2.0.0) (2021-12-24)

### Changed

- Change bonding and collective to new program ids in preparation for mainnet launch

## [1.3.4](https://github.com/StrataFoundation/strata/compare/v1.3.2...v1.3.4) (2021-12-22)

**Note:** Version bump only for package @strata-foundation/strata

### Fixed

- usePriceInSol broken for wrappedSolMint
- Use wrappedSolMint from token bonding state instead of global variable, as it is different for every environment. It's too late to fix this as there's already a wrapped sol in prod.
- baseMint would not show up in swap interface after changing the base once because of a useMemo

## Added

- unixTime to pricing so we can price the curve at a given point in time

## [1.3.3](https://github.com/StrataFoundation/strata/compare/v1.3.2...v1.3.3) (2021-12-22)

**Note:** Version bump only for package @strata-foundation/strata

- never released

## [1.3.2](https://github.com/StrataFoundation/strata/compare/v0.7.0...v1.3.2) (2021-12-15)

### Fixed

- Swap form would show loading when you had zero balance

**Note:** Version bump only for package @strata-foundation/strata

#[1.3.1]

### Fixed

- Updates to bonding curve were validated against unclaimed collective settings, always.
- No authority on primary token refs. **NOTE**: To update, rerun set_as_primary_v0

#[1.3.0]

### Changed

- getPricing -> getPricingCurve in favor of a new getPricing that can price bonding in terms of any token in the hierarchy.
- useBondingPricing now returns the above
- usePrice hooks changed to usePriceInUsd and usePriceInSol. These will recursively traverse a social token hierarchy to get its usd price
- Almost all hooks in tokenRef pertaining to twitter have been changed to be generic name references.

### Added

- Ability to opt out
- Ability to swap to any token on the bonding hierarchy.

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
