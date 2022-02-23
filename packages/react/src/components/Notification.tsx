import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  CloseButton,
} from "@chakra-ui/react";
import React from "react";

export interface INotificationProps {
  type: "warning" | "info" | "success" | "error";
  heading: string;
  show: boolean;
  message?: string;
  onDismiss?: () => void;
}

export const Notification = ({
  type,
  heading,
  show,
  message,
  onDismiss,
}: INotificationProps) => (
  <Alert
    w="full"
    bgColor="white"
    borderTop="1px"
    borderTopColor="gray.200"
    fontFamily="body"
    color="black"
    status={type}
  >
    <AlertIcon />
    <Box flex="1">
      <AlertTitle>{heading}</AlertTitle>
      {message && (
        <AlertDescription display="block">{message}</AlertDescription>
      )}
    </Box>
    <CloseButton
      position="absolute"
      right="8px"
      top="8px"
      color="gray.400"
      _hover={{ color: "gray.600", cursor: "pointer" }}
      onClick={onDismiss}
    />
  </Alert>
);
