import React, { FC, MouseEvent, useCallback } from "react";
import {
  Button,
  ButtonGroup,
  ButtonProps,
  DarkMode,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Select,
  Text,
} from "@chakra-ui/react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { BsFillPersonFill } from "react-icons/bs";
import { useWallet } from "@solana/wallet-adapter-react";
import { publicKey } from "@project-serum/anchor/dist/cjs/utils";
import { truncatePubkey } from "@strata-foundation/react";
import { BsChevronDown } from "react-icons/bs";
import { clusterApiUrl } from "@solana/web3.js";
import { useEndpoint } from "../contexts/endpoint";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export const WalletModalButton: FC<ButtonProps> = ({
  children = "Select Wallet",
  onClick,
  ...props
}) => {
  const { connected, publicKey } = useWallet();
  const { visible, setVisible } = useWalletModal();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (onClick) onClick(event);
      if (!event.defaultPrevented) setVisible(!visible);
    },
    [onClick, visible, setVisible]
  );

  const { endpoint, setEndpoint } = useEndpoint();

  return (
    <ButtonGroup
      marginTop="auto"
      colorScheme="primary"
      color="white"
      variant="outline"
      spacing="6"
      isAttached
      size={props.size}
    >
      <Button
        color="white"
        borderColor="primary.500"
        {...props}
        leftIcon={<Icon w="16px" h="16px" as={BsFillPersonFill} />}
        onClick={handleClick}
        _hover={{ backgroundColor: "orange.500" }}
      >
        {connected ? truncatePubkey(publicKey!) : children}
      </Button>
      <Menu>
        <MenuButton
          as={IconButton}
          color="white"
          borderColor="primary.500"
          borderLeft="none"
          aria-label="Network"
          icon={<Icon as={BsChevronDown} />}
        />
        <MenuList backgroundColor="black.300" borderColor="black.500">
          <MenuOptionGroup
            title="Network"
            type="radio"
            onChange={(e) => setEndpoint(e as string)}
            value={endpoint}
          >
            <MenuItemOption
              value={"https://strataprotocol.genesysgo.net"}
              _focus={{ backgroundColor: "primary.300" }}
              _hover={{ backgroundColor: "primary.500" }}
            >
              Mainnet
            </MenuItemOption>
            <MenuItemOption
              _focus={{ backgroundColor: "primary.300" }}
              _hover={{ backgroundColor: "primary.500" }}
              value={clusterApiUrl(WalletAdapterNetwork.Devnet)}
            >
              Devnet
            </MenuItemOption>
            <MenuItemOption
              _focus={{ backgroundColor: "primary.300" }}
              _hover={{ backgroundColor: "primary.500" }}
              value="http://localhost:8899"
            >
              Localnet
            </MenuItemOption>
          </MenuOptionGroup>
        </MenuList>
      </Menu>
    </ButtonGroup>
  );
};
