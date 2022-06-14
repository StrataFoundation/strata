import React from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
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

interface IBuyMoreProps extends ButtonProps {
  mint?: PublicKey;
}

export const BuyMoreButton: React.FC<IBuyMoreProps> = ({
  mint,
  ...btnProps
}) => {
  const { isOpen, onToggle, onClose } = useDisclosure();
  const { metadata } = useTokenMetadata(mint);
  const { connected } = useWallet();
  const { result: tokenBondingKey, loading } = useTokenBondingKey(mint, 0);
  const { setVisible } = useWalletModal();

  return (
    <>
      <Button
        size="sm"
        colorScheme="primary"
        variant="outline"
        onClick={connected ? onToggle : () => setVisible(true)}
        {...btnProps}
      >
        {connected ? `Buy More ${metadata?.data.symbol}` : "Connect Wallet"}
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered trapFocus>
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
};
