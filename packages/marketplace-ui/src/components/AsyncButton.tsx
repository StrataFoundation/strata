import React from 'react';
import { ButtonProps, Button } from "@chakra-ui/react";
import { useErrorHandler, useProvider } from "@strata-foundation/react";
import { useAsyncCallback } from "react-async-hook";

export type AsyncButtonProps = {
  children: React.ReactNode;
  action: () => Promise<void> | undefined;
} & ButtonProps;

export const AsyncButton = ({
  action,
  children,
  ...props
}: AsyncButtonProps) => {
  const { awaitingApproval } = useProvider();
  const { execute, loading, error } = useAsyncCallback(action);
  const { handleErrors } = useErrorHandler();

  handleErrors(error);

  return (
    <Button
      isLoading={loading || awaitingApproval}
      loadingText={awaitingApproval ? "Awaiting Approval" : "Loading"}
      onClick={execute}
      {...props}
    >
      {children}
    </Button>
  );
};
