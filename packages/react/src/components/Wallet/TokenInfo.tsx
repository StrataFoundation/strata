import { Avatar, Button, Flex, HStack, Icon, Text } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { ITokenWithMetaAndAccount } from "@strata-foundation/spl-token-collective";
import { useOwnedAmount } from "../../hooks/bondingPricing";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { usePriceInUsd } from "../../hooks/usePriceInUsd";
import { useStrataSdks } from "../../hooks/useStrataSdks";
import { useTwWrappedSolMint } from "../../hooks/useTwWrappedSolMint";
import React from "react";
import { useAsyncCallback } from "react-async-hook";
import { RiCoinLine } from "react-icons/ri";

async function unwrapTwSol(
  tokenBondingSdk: SplTokenBonding | undefined,
  account: PublicKey | undefined
): Promise<void> {
  if (tokenBondingSdk) {
    await tokenBondingSdk.sellBondingWrappedSol({
      amount: 0, // ignored because of all
      all: true,
      source: account,
    });
  }
}

export const TokenInfo = React.memo(
  ({
    tokenWithMeta,
    onClick,
    highlighted,
  }: {
    highlighted?: boolean;
    tokenWithMeta: ITokenWithMetaAndAccount;
    onClick: (tokenWithMeta: ITokenWithMetaAndAccount) => void;
  }) => {
    const { metadata, image, account } = tokenWithMeta;
    const fiatPrice = usePriceInUsd(account?.mint);
    const ownedAmount = useOwnedAmount(account?.mint);
    const twSol = useTwWrappedSolMint();
    const { tokenBondingSdk } = useStrataSdks();
    const { execute: unwrap, loading, error } = useAsyncCallback(unwrapTwSol);

    const { handleErrors } = useErrorHandler();
    handleErrors(error);

    return (
      <HStack
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClick(tokenWithMeta)
        }}
        alignItems="center"
        justify="space-between"
        justifyItems="center"
        _hover={{ opacity: "0.5", cursor: "pointer" }}
        borderColor={highlighted ? "indigo.500" : undefined}
        borderWidth={highlighted ? "1px" : undefined}
        borderRadius={highlighted ? "4px" : undefined}
      >
        <HStack padding={4} spacing={3} align="center">
          <Avatar name={metadata?.data.symbol} src={image} />
          <Flex flexDir="column">
            <Text>{metadata?.data.name}</Text>
            <HStack align="center" spacing={1}>
              <Icon as={RiCoinLine} w="16px" h="16px" />
              <Text>
                {ownedAmount?.toFixed(2)} {metadata?.data.symbol}
              </Text>
              <Text color="gray.500">
                (~$
                {fiatPrice &&
                  ownedAmount &&
                  (fiatPrice * ownedAmount).toFixed(2)}
                )
              </Text>
            </HStack>
          </Flex>
        </HStack>
        {twSol && account && twSol.equals(account.mint) && (
          <Button
            isLoading={loading}
            onClick={() => unwrap(tokenBondingSdk, account?.address)}
            colorScheme="indigo"
            size="xs"
          >
            Unwrap
          </Button>
        )}
      </HStack>
    );
  }
);
