import {
  Button,
  ButtonGroup,
  ButtonProps,
  Icon,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { truncatePubkey, useEndpoint } from "@strata-foundation/react";
import React, { FC, MouseEvent, useCallback } from "react";
import { BsChevronDown, BsFillPersonFill } from "react-icons/bs";
import {
  useUsernameFromIdentifierCertificate,
  useWalletProfile,
} from "../hooks";
import { CreateProfileModal } from "./CreateProfileModal";

export const ProfileButton: FC<ButtonProps> = ({
  children = "Select Wallet",
  onClick,
  ...props
}) => {
  const { disconnect, connected, publicKey } = useWallet();
  const disconnectAndClear = useCallback(() => {
    disconnect();
    localStorage.removeItem("lit-auth-sol-signature");
  }, [disconnect]);
  const { visible, setVisible } = useWalletModal();
  const { info: profile } = useWalletProfile(publicKey || undefined);
  const { username } = useUsernameFromIdentifierCertificate(
    profile?.identifierCertificateMint,
    profile?.ownerWallet
  );
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (onClick) onClick(event);
      if (!event.defaultPrevented) {
        if (connected) {
          onOpen();
        } else {
          setVisible(!visible);
        }
      }
    },
    [onClick, visible, setVisible, connected, onOpen]
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
      w="full"
      size={props.size}
    >
      <CreateProfileModal onClose={onClose} isOpen={isOpen} />
      <Button
        w="full"
        justifyContent="start"
        color={useColorModeValue("black", "white")}
        borderColor="primary.500"
        {...props}
        onClick={handleClick}
        _hover={{ backgroundColor: "orange.500" }}
      >
        {profile ? (
          // Can't use Avatar here because in CreateProfile we change image.src to cause a reload
          <Image
            alt=""
            m={1}
            borderRadius="full"
            boxSize="30px"
            src={profile.imageUrl}
          />
        ) : (
          <Icon m={1} w="16px" h="16px" as={BsFillPersonFill} />
        )}
        <Text m={1}>
          {connected ? (profile ? username : "Create Profile") : children}
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
            onClick={disconnectAndClear}
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
