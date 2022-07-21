import React from "react";
import {
  IconButton,
  IconButtonProps,
  Icon,
  useDisclosure,
} from "@chakra-ui/react";
import { RiMenuAddLine } from "react-icons/ri";
import { useWallet } from "@solana/wallet-adapter-react";
import { useErrorHandler } from "@strata-foundation/react";
import { CreateChatModal } from "./CreateChatModal";
import { useLoadDelegate } from "../../hooks";

interface ICreateChatButton extends IconButtonProps {}

export const CreateChatButton: React.FC<ICreateChatButton> = (props) => {
  const { connected } = useWallet();
  const { needsInit, error: delegateError } = useLoadDelegate();
  const { handleErrors } = useErrorHandler();
  const { isOpen, onOpen, onClose } = useDisclosure();

  handleErrors(delegateError);

  const handleOnClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    props.onClick && props.onClick(e);
    onOpen();
  };

  return (
    <>
      <IconButton
        {...props}
        disabled={!connected || needsInit}
        icon={<Icon as={RiMenuAddLine} />}
        onClick={handleOnClick}
      />
      <CreateChatModal isOpen={isOpen} onClose={onClose} />
    </>
  );
};
