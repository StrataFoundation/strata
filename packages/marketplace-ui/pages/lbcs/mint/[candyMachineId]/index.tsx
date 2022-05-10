import { DisburseFunds } from "@/components/DisburseFunds";
import {
  CandyMachineAccount,
  CANDY_MACHINE_PROGRAM, mintOneToken
} from "@/components/lbc/mint/candy-machine";
import { MintedNftNotification } from "@/components/lbc/mint/MintedNftNotification";
import { toDate } from "@/components/lbc/mint/utils";
import { useIsBountyAdmin } from "@/hooks/useIsBountyAdmin";
import {
  Box,
  Center,
  Container,
  DarkMode,
  Heading, Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs, useColorModeValue,
  VStack
} from "@chakra-ui/react";
import { GatewayProvider } from "@civic/solana-gateway-react";
import * as anchor from "@project-serum/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  Notification, usePublicKey,
  useTokenBondingFromMint
} from "@strata-foundation/react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import toast from "react-hot-toast";
import {
  BondingPlot,
  Branding, CandyMachineInfo, IMintArgs,
  LbcInfo,
  LbcStatus,
  MintButton,
  TransactionHistory,
  useCandyMachineInfo,
  useLivePrice,
  WalletModalButton
} from "../../../../src";

export interface HomeProps {
  candyMachineId?: anchor.web3.PublicKey;
}

const Home = (props: HomeProps) => {
  const { connection } = useConnection();
  const { publicKey, connected, signTransaction } = useWallet();

  const cmState = useCandyMachineInfo(props.candyMachineId);
  const {
    candyMachine,
    isWhitelistUser,
    refreshCandyMachineState,
    isActive,
    isPresale,
  } = cmState;

  const mintKey = candyMachine?.state.tokenMint;
  const {
    info: tokenBonding,
    loading,
    error,
  } = useTokenBondingFromMint(mintKey);
  const { price } = useLivePrice(tokenBonding?.publicKey);

  const { isAdmin } = useIsBountyAdmin(
    publicKey || undefined,
    tokenBonding?.publicKey
  );
 
  const onMint = async (args: IMintArgs) => {
    try {
      document.getElementById("#identity")?.click();
      if (connected && candyMachine?.program && publicKey) {
        const mint = await mintOneToken(candyMachine, publicKey, args);
        toast.custom(
          (t) => (
            <MintedNftNotification
              mint={mint}
              onDismiss={() => toast.dismiss(t.id)}
            />
          ),
          {
            duration: Infinity,
          }
        );
      }
    } catch (error: any) {
      let message =
        error.msg || error.toString() || "Minting failed! Please try again!";
      let heading = "Transaction Failed";
      if (!error.msg) {
        if (!error.message) {
          message = "Transaction Timeout! Please try again.";
        } else if (error.message.indexOf("0x137") != -1) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135") != -1) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          window.location.reload();
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        } else if (error.code === 6005 || error.code === 6006) {
          heading = "Transaction Cancelled";
          message =
            "The price moved unfavorably by more than the configured slippage. Change slippage by clicking Advanced Settings";
        } else {
          message = error.toString();
        }
      }

      console.error(error)

      toast.custom(
        (t) => (
          <Notification
            show={t.visible}
            type="error"
            heading={heading}
            message={message}
            onDismiss={() => toast.dismiss(t.id)}
          />
        ),
        {
          duration: 120 * 1000,
        }
      );
      // updates the candy machine state to reflect the lastest
      // information on chain
      refreshCandyMachineState();
    }
  };

  useEffect(() => {
    refreshCandyMachineState();
  }, [
    publicKey,
    props.candyMachineId,
    connection,
    refreshCandyMachineState,
  ]);

  const selectedProps = {
    borderBottom: "3px solid #F07733",
  };

  return (
    <Box
      color={useColorModeValue("black", "white")}
      w="full"
      backgroundColor="black.500"
      height="100vh"
      overflow="auto"
      paddingBottom="200px"
    >
      <Container mt={"35px"} justifyItems="stretch" maxW="600px">
        <Tabs varaint="unstyled" isLazy>
          <TabList borderBottom="none">
            <Tab _selected={selectedProps} fontWeight={600}>
              Mint
            </Tab>
            {tokenBonding && (
              <Tab _selected={selectedProps} fontWeight={600}>
                Transactions
              </Tab>
            )}
          </TabList>
          <TabPanels>
            <TabPanel p={0} pt={4}>
              <LbcStatus tokenBondingKey={tokenBonding?.publicKey} />
              <Box
                zIndex={1}
                shadow="xl"
                rounded="lg"
                p="16px"
                pb="29px"
                minH="300px"
                bg="black.300"
              >
                {isAdmin && tokenBonding && (
                  <Box
                    p={4}
                    borderBottom="3px solid"
                    borderRadius="lg"
                    borderColor="gray.300"
                  >
                    <Heading size="md">Disburse Funds</Heading>
                    <DisburseFunds
                      tokenBondingKey={tokenBonding?.publicKey}
                      includeRetrievalCurve
                    />
                  </Box>
                )}
                {connected && (
                  <>
                    {(loading || !candyMachine) && (
                      <Center>
                        <Spinner />
                      </Center>
                    )}
                    {!(loading || !candyMachine) && (
                      <VStack align="stretch" spacing={8}>
                        {tokenBonding && (
                          <LbcInfo
                            price={price}
                            tokenBondingKey={tokenBonding.publicKey}
                          />
                        )}

                        {!tokenBonding && <CandyMachineInfo {...cmState} /> }

                        {candyMachine?.state.isActive &&
                        candyMachine?.state.gatekeeper &&
                        publicKey &&
                        signTransaction ? (
                          <GatewayProvider
                            wallet={{
                              publicKey:
                                publicKey ||
                                new PublicKey(CANDY_MACHINE_PROGRAM),
                              //@ts-ignore
                              signTransaction: wallet.signTransaction,
                            }}
                            gatekeeperNetwork={
                              candyMachine?.state?.gatekeeper?.gatekeeperNetwork
                            }
                            // @ts-ignore
                            clusterUrl={connection._rpcEndpoint}
                            options={{ autoShowModal: false }}
                          >
                            <MintButton
                              price={price}
                              onMint={onMint}
                              tokenBondingKey={tokenBonding?.publicKey}
                              isDisabled={
                                !isActive && (!isPresale || !isWhitelistUser)
                              }
                              disabledText={`Mint launches ${getCountdownDate(
                                candyMachine
                              )?.toLocaleTimeString()}`}
                            />
                          </GatewayProvider>
                        ) : (
                          <MintButton
                            price={price}
                            onMint={onMint}
                            tokenBondingKey={tokenBonding?.publicKey}
                            isDisabled={
                              !isActive && (!isPresale || !isWhitelistUser)
                            }
                            disabledText={
                              candyMachine &&
                              `Mint launches ${getCountdownDate(
                                candyMachine
                              )?.toLocaleTimeString()}`
                            }
                          />
                        )}
                        <Branding />
                      </VStack>
                    )}
                  </>
                )}
                {!connected && (
                  <Center>
                    <WalletModalButton>Connect Wallet</WalletModalButton>
                  </Center>
                )}
              </Box>
            </TabPanel>
            <TabPanel p={0} pt={4}>
              <Box
                zIndex={1}
                shadow="xl"
                rounded="lg"
                p="16px"
                pb="29px"
                minH="300px"
                bg="black.300"
              >
                {loading && (
                  <Center>
                    <Spinner />
                  </Center>
                )}
                {!loading && tokenBonding && (
                  <VStack align="stretch" spacing={8}>
                    <BondingPlot tokenBondingKey={tokenBonding.publicKey} />
                    <TransactionHistory
                      tokenBondingKey={tokenBonding.publicKey}
                    />
                  </VStack>
                )}
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Box>
  );
};

const getCountdownDate = (
  candyMachine: CandyMachineAccount
): Date | undefined => {
  if (
    candyMachine.state.isActive &&
    candyMachine.state.endSettings?.endSettingType.date
  ) {
    return toDate(candyMachine.state.endSettings.number);
  }

  return toDate(
    candyMachine.state.goLiveDate
      ? candyMachine.state.goLiveDate
      : candyMachine.state.isPresale
      ? new anchor.BN(new Date().getTime() / 1000)
      : undefined
  );
};

export const DarkModeDisplay: NextPage = (props) => {
  const router = useRouter();
  const { candyMachineId: candyMachineIdRaw } = router.query;
  const candyMachineId = usePublicKey(candyMachineIdRaw as string);

  return (
    <DarkMode>
      <Home candyMachineId={candyMachineId} {...props} />
    </DarkMode>
  );
};

export default DarkModeDisplay;
