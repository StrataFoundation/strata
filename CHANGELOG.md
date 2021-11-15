# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
