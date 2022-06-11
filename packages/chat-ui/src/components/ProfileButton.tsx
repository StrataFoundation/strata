import { useDelegateWallet } from "../hooks/useDelegateWallet";
import {
  Avatar,
  Button,
  ButtonGroup,
  ButtonProps,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Modal,
  ModalBody,
  ModalContent,
  useColorModeValue,
} from "@chakra-ui/react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl, SystemProgram } from "@solana/web3.js";
import { truncatePubkey, useEndpoint, useErrorHandler, useLocalStorage, useTokenMetadata } from "@strata-foundation/react";
import React, { FC, MouseEvent, useCallback, useEffect, useState } from "react";
import { BsChevronDown, BsFillPersonFill } from "react-icons/bs";
import { useDelegateWalletStruct, useUsernameFromIdentifierCertificate, useWalletProfile } from "../hooks";
import { CreateProfileModal } from "./CreateProfileModal";
import { useAsyncCallback } from "react-async-hook";
import { ChatSdk } from "@strata-foundation/chat";
import { sendInstructions } from "@strata-foundation/spl-utils";
import { useChatSdk } from "../contexts";
import { useDelegateWalletStructKey } from "../hooks/useDelegateWalletStructKey";
import { useLoadDelegate } from "../hooks/useLoadDelegate";


export const ProfileButton: FC<ButtonProps> = ({
  children = "Select Wallet",
  onClick,
  ...props
}) => {
  const { connected, publicKey } = useWallet();
  const { visible, setVisible } = useWalletModal();
  const { info: profile, account: profileAccount, loading } = useWalletProfile();
  const { username } = useUsernameFromIdentifierCertificate(profile?.identifierCertificateMint);
  const { keypair: delegate } = useDelegateWallet();
  const { key: delegateWalletKey, loading: loadingS1 } = useDelegateWalletStructKey(delegate?.publicKey);
  const { account: delegateWalletStruct, loading: loadingS2 } =
    useDelegateWalletStruct(delegateWalletKey);
  
  const { chatSdk } = useChatSdk();
  const { handleErrors } = useErrorHandler();
  const {
    needsTopOff,
    loadDelegate,
    loading: loadingDelegate,
    error,
  } = useLoadDelegate();
  const [happenedOnce, setHappened] = useState(false);
  handleErrors(error);

  useEffect(() => {
    if (
      !happenedOnce &&
      profile &&
      (!delegate ||
        (delegateWalletKey &&
          !loadingS1 &&
          !loadingS2 &&
          !delegateWalletStruct))
    ) {
      setHappened(true);
      loadDelegate();
    }

    if (needsTopOff && profile) {
      loadDelegate();
    }
  }, [
    needsTopOff,
    happenedOnce,
    profile,
    delegate,
    delegateWalletStruct,
    loadingS1,
    loadingS2,
    chatSdk,
    loadDelegate,
  ]);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (onClick) onClick(event);
      if (!event.defaultPrevented) setVisible(!visible);
    },
    [onClick, visible, setVisible]
  );

  const { cluster, setClusterOrEndpoint } = useEndpoint();

  return (
    <ButtonGroup
      marginTop="auto"
      colorScheme="primary"
      color={useColorModeValue("black", "white")}
      variant="outline"
      spacing="6"
      isAttached
      size={props.size}
    >
      {}

      {!loading && connected && !profileAccount && <CreateProfileModal />}
      {loadingDelegate && (
        <Modal isOpen={true} onClose={() => {}}>
          <ModalContent>
            <ModalBody>Loading local wallet...</ModalBody>
          </ModalContent>
        </Modal>
      )}
      <Button
        color={useColorModeValue("black", "white")}
        borderColor="primary.500"
        {...props}
        leftIcon={
          profile ? (
            <Avatar w="30px" h="30px" src={profile.imageUrl} />
          ) : (
            <Icon w="16px" h="16px" as={BsFillPersonFill} />
          )
        }
        onClick={handleClick}
        _hover={{ backgroundColor: "orange.500" }}
      >
        {connected
          ? profile
            ? username
            : truncatePubkey(publicKey!)
          : children}
      </Button>
      <Menu isLazy>
        <MenuButton
          as={IconButton}
          color={useColorModeValue("black", "white")}
          borderColor="primary.500"
          borderLeft="none"
          aria-label="Network"
          icon={<Icon as={BsChevronDown} />}
        />
        <MenuList
          backgroundColor={useColorModeValue("white", "black.300")}
          borderColor="black.500"
        >
          <MenuOptionGroup
            title="Network"
            type="radio"
            onChange={(e) => setClusterOrEndpoint(e as string)}
            value={cluster}
          >
            <MenuItemOption
              value={WalletAdapterNetwork.Mainnet}
              _focus={{ backgroundColor: "primary.300" }}
              _hover={{ backgroundColor: "primary.500" }}
            >
              Mainnet
            </MenuItemOption>
            <MenuItemOption
              _focus={{ backgroundColor: "primary.300" }}
              _hover={{ backgroundColor: "primary.500" }}
              value={WalletAdapterNetwork.Devnet}
            >
              Devnet
            </MenuItemOption>
            <MenuItemOption
              _focus={{ backgroundColor: "primary.300" }}
              _hover={{ backgroundColor: "primary.500" }}
              value={"localnet"}
            >
              Localnet
            </MenuItemOption>
          </MenuOptionGroup>
        </MenuList>
      </Menu>
    </ButtonGroup>
  );
};
