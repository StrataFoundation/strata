import { HStack, Spinner, StackDivider, VStack, Text, Center } from "@chakra-ui/react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { OnCreatorClick, Creator, useTokenAccount, useMint, useTokenMetadata, roundToDecimals } from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import { useAsync } from "react-async-hook";
import { numberWithCommas } from "utils/numberWithCommas";

const onCreatorClick: OnCreatorClick = (c, t, tokenRef, handle) => {
  window.open(tokenRef
    ? `https://wum.bo/app/profile/view/${tokenRef.mint.toBase58()}`
    : handle
    ? `https://twitter.com/${handle}`
    : `https://explorer.solana.com/address/${c.toBase58()}`, "_blank");
};

async function getLargestTokenAccounts(
  connection: Connection,
  mint: PublicKey | undefined
): Promise<{ publicKey: PublicKey; amount: number }[]> {
  if (mint) {
    const accounts = (await connection.getTokenLargestAccounts(mint)).value;
    return accounts
      .filter((a) => a.uiAmount)
      .map((account) => ({
        publicKey: account.address,
        amount: account.uiAmount!,
      }));
  }

  return []
}

export const TopHolders = ({ mintKey }: { mintKey: PublicKey | undefined }) => {
  const { connection } = useConnection();
  const { result: accounts, loading } = useAsync(getLargestTokenAccounts, [
    connection,
    mintKey,
  ]);

  if (loading) {
    return <Spinner />;
  }

  return <VStack w="full" spacing={2} divider={<StackDivider borderColor="gray.200" />}>
    {accounts?.map((account, index) => (
      <LeaderboardItem rank={index + 1} key={account.publicKey.toBase58()} {...account} />
    ))}
  </VStack>;
};

const LeaderboardItem = ({
  publicKey,
  rank
}: {
  publicKey: PublicKey;
  rank: number;
}) => {
  const { info: account, loading } = useTokenAccount(publicKey);
  const mint = useMint(account?.mint);

  if (loading || !account) {
    return <Spinner />;
  }

  return (
    <HStack align="center" w="full" padding={2} justify="space-between">
      <HStack align="center" spacing={8}>
        <Text fontWeight={500} color="gray.500">
          {rank}
        </Text>
        <Creator creator={account.owner} onClick={onCreatorClick} />
      </HStack>
      <Text fontWeight={700} color="gray.600" marginLeft="auto">
        {mint &&
          numberWithCommas(
            roundToDecimals(toNumber(account.amount, mint), mint.decimals)
          )}
      </Text>
    </HStack>
  );
};
