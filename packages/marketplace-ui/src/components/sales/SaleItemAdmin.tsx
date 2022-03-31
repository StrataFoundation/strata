import React from "react";
import { HStack } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import {
  useMint,
  useStrataSdks,
  useTokenAccount,
  useTokenBonding,
  useTokenMetadata,
} from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import { AsyncButton } from "../AsyncButton";

export const SaleItemAdmin = ({
  tokenBondingKey,
}: {
  tokenBondingKey: PublicKey;
}) => {
  const { tokenBondingSdk } = useStrataSdks();
  const { info: tokenBonding, loading: bondingLoading } =
    useTokenBonding(tokenBondingKey);
  const account = useTokenAccount(tokenBonding?.baseStorage);
  const mint = useMint(tokenBonding?.baseMint);
  const { metadata, loading: metadataLoading } = useTokenMetadata(
    tokenBonding?.baseMint
  );
  const amount = account?.info && mint && toNumber(account.info.amount, mint);

  return (
    <HStack spacing={2} borderBottom={1} borderBottomColor={"gray.300"}>
      <AsyncButton
        w="full"
        variant="outline"
        colorScheme="primary"
        isDisabled={!tokenBondingSdk || !amount}
        action={() =>
          tokenBondingSdk!.transferReserves({
            tokenBonding: tokenBondingKey,
            amount: amount!,
          })
        }
      >
        Collect{" "}
        {account &&
          !(bondingLoading || metadataLoading) &&
          `${amount?.toFixed(2)} ${metadata?.data.symbol}`}
      </AsyncButton>
      <AsyncButton
        w="full"
        colorScheme="red"
        isDisabled={!tokenBondingSdk || amount != 0}
        title={
          amount != 0
            ? "Must have no remaning balance to close, run collect first"
            : undefined
        }
        action={() =>
          tokenBondingSdk!.close({
            tokenBonding: tokenBondingKey,
          })
        }
      >
        Delete Listing
      </AsyncButton>
    </HStack>
  );
};
