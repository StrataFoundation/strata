#!/bin/bash
set -e
anchor idl init TBondz6ZwSM5fs4v2GpnVBMuwoncPkFLFR9S422ghhN --filepath target/idl/spl_token_bonding.json --provider.cluster localnet
anchor idl init TCo1sP6RwuCuyHPHjxgzcrq4dX4BKf9oRQ3aJMcdFry --filepath target/idl/spl_token_collective.json --provider.cluster localnet
env OPEN_MINT_PATH=$HOME/.config/solana/open-mint-id.json env ANCHOR_WALLET=$HOME/.config/solana/id.json ANCHOR_PROVIDER_URL=http://127.0.0.1:8899 yarn run bootstrap
