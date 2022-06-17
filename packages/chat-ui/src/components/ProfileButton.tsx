import {
  Image,
  Button,
  ButtonGroup,
  ButtonProps,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  useColorModeValue,
  useDisclosure,
  Text,
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
  const {
    isOpen: loadWalletIsOpen,
    onClose,
    onOpen,
  } = useDisclosure({
    defaultIsOpen: false,
  });
  const {
    isOpen: profileIsOpen,
    onClose: closeProfile,
    onOpen: openProfile,
  } = useDisclosure({
    defaultIsOpen: false,
  });
  
  const { handleErrors } = useErrorHandler();
  const { needsTopOff, error, loadingNeeds, delegateWallet } =
    useLoadDelegate();
  handleErrors(error);

  // Open load wallet dialog if we have a profile but wallet is empty
  useEffect(() => {
    if (
      connected &&
      publicKey &&
      !profileIsOpen &&
      delegateWallet &&
      !loadingNeeds &&
      needsTopOff
    ) {
      onOpen();
    } else {
      onClose();
    }
  }, [connected, publicKey, needsTopOff, profile, onOpen, loadingNeeds]);

  useEffect(() => {
    if (connected && !loading && publicKey && !profileAccount) {
      openProfile();
    } else {
      closeProfile();
    }
  }, [connected, loading, publicKey, profileAccount, openProfile, closeProfile]);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (onClick) onClick(event);
      if (!event.defaultPrevented) {
        if (connected) {
          openProfile()
        } else {
          setVisible(!visible);
        }
      }
    },
    [onClick, visible, setVisible, connected, openProfile]
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
      <CreateProfileModal isOpen={profileIsOpen} onClose={closeProfile} />
      <LoadWalletModal
        isOpen={loadWalletIsOpen}
        onLoaded={() => onClose()}
        onClose={() => {
          if (!loading && !profileAccount) disconnect();
          onClose();
        }}
      />
      <Button
        color={useColorModeValue("black", "white")}
        borderColor="primary.500"
        {...props}
        onClick={handleClick}
        _hover={{ backgroundColor: "orange.500" }}
      >
        {profile ? (
          // Can't use Avatar here because in CreateProfile we change image.src to cause a reload
          <Image
            alt="Profile"
            m={1}
            borderRadius="full"
            boxSize="30px"
            src={profile.imageUrl}
          />
        ) : (
          <Icon m={1} w="16px" h="16px" as={BsFillPersonFill} />
        )}
        <Text m={1}>
          {connected
            ? profile
              ? username
              : truncatePubkey(publicKey!)
            : children}
        </Text>
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
          <MenuDivider />
          <MenuItem
            onClick={disconnect}
            _focus={{ backgroundColor: "primary.300" }}
            _hover={{ backgroundColor: "primary.500" }}
          >
            Disconnect
          </MenuItem>
        </MenuList>
      </Menu>
    </ButtonGroup>
  );
};
