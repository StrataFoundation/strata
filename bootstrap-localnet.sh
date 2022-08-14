#!/bin/bash
set -e
anchor idl init TBondmkCYxaPCKG4CHYfVTcwQ8on31xnJrPzk8F8WsS --filepath target/idl/spl_token_bonding.json --provider.cluster localnet
anchor idl init TCo1sfSr2nCudbeJPykbif64rG9K1JNMGzrtzvPmp3y --filepath target/idl/spl_token_collective.json --provider.cluster localnet
anchor idl init fent99TYZcj9PGbeooaZXEMQzMd7rz8vYFiudd8HevB --filepath target/idl/fungible_entangler.json --provider.cluster localnet
anchor idl init chatGL6yNgZT2Z3BeMYGcgdMpcBKdmxko4C5UhEX4To --filepath target/idl/chat.json --provider.cluster localnet
env WRAPPED_SOL_MINT_PATH=$HOME/.config/solana/twsol.json env OPEN_MINT_PATH=$HOME/.config/solana/open-mint-id.json env ANCHOR_WALLET=$HOME/.config/solana/id.json ANCHOR_PROVIDER_URL=http://127.0.0.1:8899 yarn run bootstrap
