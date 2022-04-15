import {
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
} from "@chakra-ui/react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { truncatePubkey } from "@strata-foundation/react";
import React, { FC, MouseEvent, useCallback } from "react";
import { BsChevronDown, BsFillPersonFill } from "react-icons/bs";
import { useEndpoint } from "../hooks/useEndpoint";

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

  const { cluster, setClusterOrEndpoint } = useEndpoint();

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
              value={"https://psytrbhymqlkfrhudd.dev.genesysgo.net:8899/"}
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
