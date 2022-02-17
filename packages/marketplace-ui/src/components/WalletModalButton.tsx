import React, { FC, MouseEvent, useCallback } from "react";
import { Button, ButtonProps, Icon } from "@chakra-ui/react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { BsFillPersonFill } from "react-icons/bs";
import { useWallet } from "@solana/wallet-adapter-react";
import { publicKey } from "@project-serum/anchor/dist/cjs/utils";
import { truncatePubkey } from "@strata-foundation/react";

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
    [onClick, visible]
  );

  return (
    <Button
      variant="outline"
      _hover={{ backgroundColor: "orange.500" }}
      leftIcon={<Icon w="16px" h="16px" as={BsFillPersonFill} />}
      borderColor="orange.500"
      onClick={handleClick}
      {...props}
    >
      { connected ? truncatePubkey(publicKey!) : children }
    </Button>
  );
};
