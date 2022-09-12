//@ts-ignore
import BrowserOnly from "@docusaurus/BrowserOnly";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  useWalletModal
} from "@solana/wallet-adapter-react-ui";
import {
  truncatePubkey, useBondingPricing,
  useCollective, useEndpoint, useErrorHandler,
  usePublicKey,
  useSolanaUnixTime,
  useStrataSdks,
  useUserTokensWithMeta,
  useRentExemptAmount
} from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import React, { useCallback, useEffect, useMemo, useState } from "react";
//@ts-ignore
import {
  Alert, AlertDescription, AlertIcon, AlertTitle, Avatar, Box, Button, SimpleGrid, Stack,
  Text, VStack
} from "@chakra-ui/react";
import { NATIVE_MINT } from "@solana/spl-token";
import { ITokenWithMetaAndAccount } from "@strata-foundation/spl-token-collective";
import { truthy } from "@strata-foundation/spl-utils";
import { closeOutWumboSubmit } from "./closeOutWumboSubmit";
import styles from "./styles.module.css";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

const OPEN_COLLECTIVE = "3cYa5WvT2bgXSLxxu9XDJSHV3x5JZGM91Nc3B7jYhBL7";

const MainnetGuard = ({ children = null as any }) => {
  const { endpoint, setClusterOrEndpoint } = useEndpoint();

  if (endpoint.includes("devnet")) {
    return (
      <div className={styles.container}>
        <h3>Recoup SOL from Wumbo</h3>
        <button
          onClick={() => {
            setClusterOrEndpoint(WalletAdapterNetwork.Mainnet);
          }}
          className="white button button--primary"
        >
          Switch to Mainnet
        </button>
      </div>
    );
  }

  return children;
};

interface ITokenHandlerProps {
  token: ITokenWithMetaAndAccount;
  setAmountByToken: (arg0: ITokenWithMetaAndAccount, arg1: number) => void;
}

export const TokenHandler = React.memo<ITokenHandlerProps>(
  ({ token, setAmountByToken }) => {
    const { publicKey: tokenBondingKey, targetMint } = token.tokenBonding;

    const unixTime = useSolanaUnixTime();
    const { pricing, loading: loadingPricing } =
      useBondingPricing(tokenBondingKey);

    const solAmount = pricing?.swap(
      toNumber(token.account.amount, token.mint),
      targetMint,
      NATIVE_MINT,
      true,
      unixTime
    );

    useEffect(() => {
      if (solAmount) {
        setAmountByToken(token, solAmount);
      }
    }, [solAmount, setAmountByToken]);

    return (
      <Box>
        <Stack direction={"row"} spacing={4} align={"center"}>
          <Avatar src={token.image} size="sm" />
          <Stack direction={"column"} spacing={0} fontSize={"sm"}>
            <Text fontWeight={600}>{token.metadata?.data?.name}</Text>
            <Text color={"gray.500"}>{solAmount} SOL</Text>
          </Stack>
        </Stack>
      </Box>
    );
  }
);

export const Recoup = () => {
  const { connected, publicKey } = useWallet();
  const { tokenBondingSdk, loading: sdkLoading } = useStrataSdks();
  const [txError, setError] = useState<Error>();
  const { handleErrors } = useErrorHandler();
  const [amountsByToken, setAmountsByToken] = useState<{
    [key: string]: number;
  }>({});
  const [status, setStatus] = useState<string | null>(null);
  const [isCalculatingTokens, setIsCalculatingTokens] = useState(true);
  const { setVisible } = useWalletModal();
  const openCollectiveKey = usePublicKey(OPEN_COLLECTIVE);
  const { info: openCollective } = useCollective(openCollectiveKey);
  const { amount: rentAmount } = useRentExemptAmount(165)

  const {
    data: tokens,
    loading: loading1,
    error,
  } = useUserTokensWithMeta(publicKey || undefined);

  const setAmountByToken = useCallback(
    (token: ITokenWithMetaAndAccount, amount: number) => {
      if (token && amount) {
        setAmountsByToken((old) => ({
          ...old,
          [token.publicKey.toBase58()]: amount + (rentAmount || 0),
        }));
      }
    },
    []
  );

  const open = useMemo(
    () =>
      tokens.find(({ account }) => account.mint.equals(openCollective.mint)),
    [tokens]
  );

  const hasOpenAmount = useMemo(
    () => open && toNumber(open.account.amount, open.mint) > 0,
    [open]
  );

  const openCollectiveTokens = useMemo(
    () =>
      tokens.filter(
        (token) =>
          !!token.tokenRef &&
          token.tokenRef.collective &&
          token.tokenRef.collective.equals(openCollectiveKey) &&
          toNumber(token.account.amount, token.mint) > 0
      ),
    [tokens]
  );

  useEffect(() => {
    if (
      Object.values(amountsByToken).length ===
      openCollectiveTokens?.length + (hasOpenAmount ? 1 : 0)
    ) {
      setIsCalculatingTokens(false);
    }
  }, [amountsByToken, hasOpenAmount, openCollectiveTokens]);

  handleErrors(error, txError);

  const handleSubmit = useCallback(async () => {
    try {
      await closeOutWumboSubmit({
        tokenBondingSdk,
        tokens: openCollectiveTokens.filter(truthy),
        expectedOutputAmountByToken: amountsByToken,
        setStatus,
      });
    } catch (err: any) {
      console.error(err);
      setStatus(null);
      setError(err);
    }
  }, [open, hasOpenAmount, openCollectiveTokens, amountsByToken]);

  const loading = sdkLoading || loading1 || isCalculatingTokens;
  const connectedLoading = connected && publicKey && loading;
  const connectedNotLoading = !loading && connected && publicKey;
  const isSuccessful = status == "successful";
  const isOrphaned = status == "orphaned";

  return (
      <VStack w="full" align="stretch" className={styles.container}>
        <h3>Recoup SOL from Wumbo</h3>

        {connectedLoading && <span>Loading...</span>}
        {connectedNotLoading &&
          !(hasOpenAmount || openCollectiveTokens.length) && (
            <span>
              No tokens relating to Wumbo/OPEN found. Make sure you have the
              wallet that you used with Wumbo/OPEN, then refresh this page.
            </span>
          )}
        {error && <span style={{ color: "red" }}>{error.toString()}</span>}
        {connectedNotLoading && !isSuccessful && !isOrphaned && (
          <>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
              {hasOpenAmount && (
                <TokenHandler
                  token={open}
                  setAmountByToken={setAmountByToken}
                />
              )}
              {openCollectiveTokens.map((token) => (
                <TokenHandler
                  key={token.publicKey.toBase58()}
                  token={token}
                  setAmountByToken={setAmountByToken}
                />
              ))}
            </SimpleGrid>
            <Stack mt={4} gap={2}>
              <Alert
                status="info"
                variant="subtle"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                height="200px"
              >
                <AlertIcon boxSize="30px" mr={0} />
                <AlertTitle mt={4} mb={1} fontSize="lg">
                  {Object.values(amountsByToken).reduce(
                    (acc, amount) => acc + amount,
                    0
                  )}{" "}
                  SOL
                </AlertTitle>
                <AlertDescription maxWidth="sm">
                  Ready to be Recouped. Thanks for giving Wumbo a try. Our team
                  greatly appreciates you and your early support!
                </AlertDescription>
              </Alert>
              <Button
                size="lg"
                colorScheme="orange"
                disabled={loading || status !== null}
                isLoading={status !== null}
                loadingText={status}
                onClick={handleSubmit}
                _hover={{ cursor: "pointer" }}
              >
                Recoup SOL
              </Button>
            </Stack>
          </>
        )}
        {connectedNotLoading && isSuccessful && (
          <Alert
            status="success"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
          >
            <AlertIcon boxSize="30px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              SOL Recouped
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              Thanks for giving Wumbo a try. Our team greatly appreciates you
              and your early support!
            </AlertDescription>
          </Alert>
        )}
        {connectedNotLoading && isOrphaned && (
          <Alert
            status="warning"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
          >
            <AlertIcon boxSize="30px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Something went wrong
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              I looks like we were unable to recoup the full amount of SOL, one
              or multiple of the transactions may have failed. Please refresh
              and try again.
            </AlertDescription>
          </Alert>
        )}
        <Button onClick={() => setVisible(true)} colorScheme="orange" variant="outline">{ publicKey ? truncatePubkey(publicKey) : "Select Wallet" }</Button>
      </VStack>
  );
};

export const CloseOutWumbo: React.FC = () => (
  <BrowserOnly fallback={<div>...</div>}>
    {() => (
      <MainnetGuard>
        <Recoup />
      </MainnetGuard>
    )}
  </BrowserOnly>
);
