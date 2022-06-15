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
  MenuOptionGroup, useColorModeValue,
  useDisclosure
} from "@chakra-ui/react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { truncatePubkey, useEndpoint, useErrorHandler } from "@strata-foundation/react";
import React, { FC, MouseEvent, useCallback, useEffect } from "react";
import { BsChevronDown, BsFillPersonFill } from "react-icons/bs";
import { useUsernameFromIdentifierCertificate, useWalletProfile } from "../hooks";
import { useLoadDelegate } from "../hooks/useLoadDelegate";
import { CreateProfileModal } from "./CreateProfileModal";
import { LoadWalletModal } from "./LoadWalletModal";


export const ProfileButton: FC<ButtonProps> = ({
  children = "Select Wallet",
  onClick,
  ...props
}) => {
  const { disconnect, connected, publicKey } = useWallet();
  const { visible, setVisible } = useWalletModal();
  const { info: profile, account: profileAccount, loading } = useWalletProfile();
  const { username } = useUsernameFromIdentifierCertificate(profile?.identifierCertificateMint);
  const { isOpen: loadWalletIsOpen, onClose, onOpen } = useDisclosure();
  
  const { handleErrors } = useErrorHandler();
  const { needsTopOff, error, loadingNeeds } = useLoadDelegate();
  handleErrors(error);

  // Open load wallet dialog if we have a profile but wallet is empty
  useEffect(() => {
    if (!loadingNeeds && needsTopOff) {
      onOpen();
    } else {
      onClose()
    }
  }, [needsTopOff, profile, onOpen, loadingNeeds]);

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
      {!loading && connected && !profileAccount && <CreateProfileModal />}
      <LoadWalletModal
        isOpen={loadWalletIsOpen}
        onLoaded={() => onClose()}
        onClose={() => { 
          disconnect();
          onClose();
        }} 
      />
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
