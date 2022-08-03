import {
  Box,
  Button,
  Center,
  Flex,
  Image,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { GatewayProvider } from "@civic/solana-gateway-react";
import * as anchor from "@project-serum/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  Notification,
  useTokenBondingFromMint,
} from "@strata-foundation/react";
import BN from "bn.js";
import React from "react";
import toast from "react-hot-toast";
import {
  CANDY_MACHINE_PROGRAM,
  ICandyMachine, useCandyMachineInfo,
  useLivePrice
} from "../../../hooks";
import { BondingPlot } from "../BondingPlot";
import { Branding } from "../Branding";
import { LbcInfo } from "../LbcInfo";
import { LbcStatus } from "../LbcStatus";
import { IMintArgs, MintButton } from "../MintButton";
import { TransactionHistory } from "../TransactionHistory";
import {
  mintOneToken
} from "./candy-machine";
import { CandyMachineInfo } from "./CandyMachineInfo";
import { MintedNftNotification } from "./MintedNftNotification";
import { toDate } from "./utils";

export interface DynamicPricingCandyMachineProps {
  candyMachineId?: anchor.web3.PublicKey;
  onConnectWallet: () => void;
  onSuccess?: (mint: PublicKey) => void;
}

export const DynamicPricingCandyMachine = (
  props: DynamicPricingCandyMachineProps
) => {
  const { connection } = useConnection();
  const { publicKey, connected, signTransaction, wallet } = useWallet();

  const cmState = useCandyMachineInfo(props.candyMachineId);
  const { candyMachine, isWhitelistUser, isActive, isPresale, description, image, name } = cmState;

  const mintKey = candyMachine?.tokenMint;
  const {
    info: tokenBonding,
    loading,
    error,
  } = useTokenBondingFromMint(mintKey);
  const { price } = useLivePrice(tokenBonding?.publicKey);
  const background = useColorModeValue("white", "black.300");

  const onMint = async (args: IMintArgs) => {
    try {
      document.getElementById("#identity")?.click();
      if (
        connected &&
        candyMachine?.program &&
        publicKey &&
        props.candyMachineId
      ) {
        const mint = await mintOneToken(candyMachine, publicKey, args);
        if (props.onSuccess) {
          props.onSuccess(mint)
        } else {
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

      console.error(error);

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
    }
  };

  const selectedProps = {
    borderBottom: "3px solid #F07733",
  };

  return (
    <Box>
      <Flex mt="10% !important" mb="30px">
        {image && (
          <Image
            alt="Token logo"
            w="100px"
            h="100px"
            borderRadius="20px"
            src={image}
          />
        )}
        {name && description && (
          <Stack paddingLeft="10px">
            <Text 
              fontSize="2xl" 
              color="white" 
              textAlign="left" 
              fontWeight="bold"
            >
              {name}
            </Text>
            <Text 
              fontSize="md" 
              color="white" 
              marginTop="0 !important"
            >
                {description}
              </Text>
          </Stack>
        )}
      </Flex>
      <Tabs variant="unstyled" isLazy>
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
            { typeof window !== "undefined" && <LbcStatus tokenBondingKey={tokenBonding?.publicKey} /> }
            <Box
              zIndex={1}
              shadow="xl"
              rounded="lg"
              p="16px"
              pb="29px"
              minH="300px"
              bg={background}
            >
              {connected && (
                <>
                  {!candyMachine && (
                    <Center>
                      <Spinner />
                    </Center>
                  )}
                  {candyMachine && (
                    <VStack align="stretch" spacing={8}>
                      {tokenBonding && (
                        <LbcInfo price={price} id={tokenBonding.targetMint} />
                      )}

                      {!tokenBonding && <CandyMachineInfo {...cmState} />}

                      {candyMachine?.isActive &&
                      candyMachine?.gatekeeper &&
                      publicKey &&
                      signTransaction ? (
                        <GatewayProvider
                          wallet={{
                            publicKey:
                              publicKey || new PublicKey(CANDY_MACHINE_PROGRAM),
                            //@ts-ignore
                            signTransaction: wallet.signTransaction,
                          }}
                          gatekeeperNetwork={
                            candyMachine?.gatekeeper?.gatekeeperNetwork
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
                              (!isActive && (!isPresale || !isWhitelistUser)) ||
                              (candyMachine.isWhitelistOnly && !isWhitelistUser)
                            }
                            disabledText={
                              candyMachine.isWhitelistOnly && !isWhitelistUser
                                ? "No Whitelist Token"
                                : `Mint launches ${getCountdownDate(
                                    candyMachine
                                  )?.toLocaleTimeString()}`
                            }
                          />
                        </GatewayProvider>
                      ) : (
                        <MintButton
                          price={price}
                          onMint={onMint}
                          tokenBondingKey={tokenBonding?.publicKey}
                          isDisabled={
                            (!isActive && (!isPresale || !isWhitelistUser)) ||
                            (candyMachine.isWhitelistOnly && !isWhitelistUser)
                          }
                          disabledText={
                            candyMachine.isWhitelistOnly && !isWhitelistUser
                              ? "No Whitelist Token"
                              : `Mint launches ${getCountdownDate(
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
                  <Button
                    variant="outline"
                    colorScheme="primary"
                    onClick={props.onConnectWallet}
                  >
                    Connect Wallet
                  </Button>
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
              bg={background}
            >
              <VStack align="stretch" spacing={8}>
                <BondingPlot tokenBondingKey={tokenBonding?.publicKey} />
                <TransactionHistory tokenBondingKey={tokenBonding?.publicKey} />
              </VStack>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

const getCountdownDate = (candyMachine: ICandyMachine): Date | undefined => {
  if (candyMachine.isActive && candyMachine.endSettings?.endSettingType.date) {
    return toDate(candyMachine.endSettings.number);
  }

  return toDate(
    candyMachine.goLiveDate
      ? candyMachine.goLiveDate
      : candyMachine.isPresale
      ? new BN(new Date().getTime() / 1000)
      : undefined
  );
};
