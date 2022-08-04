import {
  Button,
  ButtonGroup,
  ButtonProps,
  HStack,
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
import { useEndpoint } from "@strata-foundation/react";
import React, { FC, MouseEvent, useCallback, useEffect } from "react";
import { BsCaretDownFill, BsFillPersonFill } from "react-icons/bs";
import { useWalletProfile } from "../hooks/useWalletProfile";
import { useUsernameFromIdentifierCertificate } from "../hooks/useUsernameFromIdentifierCertificate";
import { CreateProfileModal } from "./CreateProfileModal";

interface IProfileButton extends ButtonProps {
  bypassIntermediaryStage?: boolean;
}

export const ProfileButton: FC<IProfileButton> = ({
  children = "Select Wallet",
  bypassIntermediaryStage = false,
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

  useEffect(() => {
    if (connected && !profile && bypassIntermediaryStage) {
      onOpen();
    }
  }, [connected, profile, onOpen, bypassIntermediaryStage]);

  const { cluster, setClusterOrEndpoint } = useEndpoint();

  return (
    <>
      <HStack w="full" gap={0} spacing={0}>
        <CreateProfileModal onClose={onClose} isOpen={isOpen} />
        <Button
          w="full"
          m={0}
          variant="ghost"
          justifyContent="start"
          color={useColorModeValue("black", "white")}
          borderColor="gray.500"
          size={props.size || "lg"}
          {...props}
          onClick={handleClick}
          borderTopRadius={0}
          borderRightRadius={0}
          _hover={{
            backgroundColor: "gray.200",
            _dark: {
              backgroundColor: "gray.800",
            },
          }}
        >
          {profile ? (
            // Can't use Avatar here because in CreateProfile we change image.src to cause a reload
            <Image
              alt=""
              m={1}
              borderRadius="full"
              boxSize="36px"
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
            w={20}
            size={props.size || "lg"}
            as={IconButton}
            color={useColorModeValue("black", "white")}
            variant="ghost"
            borderColor="primary.500"
            borderRadius={0}
            aria-label="Network"
            icon={<Icon w="24px" h="24px" as={BsCaretDownFill} />}
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
      </HStack>
    </>
  );
};
