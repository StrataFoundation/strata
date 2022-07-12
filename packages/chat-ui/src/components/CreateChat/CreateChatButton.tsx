import React from "react";
import {
  IconButton,
  IconButtonProps,
  Icon,
  useDisclosure,
} from "@chakra-ui/react";
import { RiMenuAddLine } from "react-icons/ri";
import { CreateChatModal } from "./CreateChatModal";

interface ICreateChatButton extends IconButtonProps {}

export const CreateChatButton: React.FC<ICreateChatButton> = (props) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

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
        icon={<Icon as={RiMenuAddLine} />}
        onClick={handleOnClick}
      />
      <CreateChatModal isOpen={isOpen} onClose={onClose} />
    </>
  );
};
