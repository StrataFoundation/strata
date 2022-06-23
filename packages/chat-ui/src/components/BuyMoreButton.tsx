import React from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  Spinner,
  ButtonProps,
  useDisclosure,
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import {
  Swap,
  useTokenBondingKey,
  useTokenMetadata,
} from "@strata-foundation/react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

type BuyMoreTrigger = React.FC<{
  onClick: () => void;
  connected: boolean;
  mint?: PublicKey;
  btnProps?: ButtonProps;
}>;

const DefaultTrigger: BuyMoreTrigger = ({
  onClick,
  connected,
  mint,
  btnProps,
}) => {
  const { metadata } = useTokenMetadata(mint);

  return (
    <Button
      size="sm"
      colorScheme="primary"
      variant="outline"
      onClick={onClick}
      {...btnProps}
    >
      {connected ? `Buy More ${metadata?.data.symbol}` : "Connect Wallet"}
    </Button>
  );
};

export function BuyMoreButton({
  mint,
  trigger = DefaultTrigger,
  btnProps,
}: {
  mint?: PublicKey;
  trigger?: BuyMoreTrigger;
  btnProps?: ButtonProps;
}) {
  const { isOpen, onToggle, onClose } = useDisclosure();
  const { connected } = useWallet();
  const { result: tokenBondingKey, loading } = useTokenBondingKey(mint, 0);
  const { setVisible } = useWalletModal();
  const { metadata } = useTokenMetadata(mint);

  function onClick() {
    if (!connected) setVisible(true);
    else {
      onToggle();
    }
  }

  return (
    <>
      {trigger({ mint, connected, onClick, btnProps })}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered trapFocus>
        <ModalOverlay />
        <ModalContent borderRadius="xl" shadow="xl">
          <ModalHeader>Buy More {metadata?.data.symbol}</ModalHeader>
          <ModalBody minH="500px">
            {tokenBondingKey && (
              <Swap
                tokenBondingKey={tokenBondingKey}
                onConnectWallet={() => {
                  onClose();
                  setVisible(true);
                }}
              />
            )}
            {loading && <Spinner />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
