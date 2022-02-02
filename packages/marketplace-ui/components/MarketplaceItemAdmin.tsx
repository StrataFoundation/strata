import { Button, ButtonProps, Heading, HStack, Spinner } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { useErrorHandler, useMint, useProvider, useStrataSdks, useTokenAccount, useTokenBonding, useTokenMetadata } from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import { useAsyncCallback } from "react-async-hook";

const AsyncButton = ({ action, children, ...props }: { children: React.ReactNode, action: () => Promise<void> | undefined } & ButtonProps) => {
  const { awaitingApproval } = useProvider();
  const { execute, loading, error } = useAsyncCallback(action);
  const { handleErrors } = useErrorHandler();

  handleErrors(error);

  return <Button
    isLoading={loading}
    loadingText={awaitingApproval ? "Awaiting Approval" : "Loading"}
    onClick={execute}
    {...props}
  >
    {children}
  </Button>
}

export const MarketplaceItemAdmin = ({
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
        colorScheme="green"
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
