import { Icon } from "@chakra-ui/react";
import { useEndpoint } from "@strata-foundation/react";
import React, { useCallback } from "react";
import { BsCheckCircleFill, BsCircle } from "react-icons/bs";
import { RequiredBooleanSchema } from "yup/lib/boolean";

export function MessageStatus({
  txids,
  pending,
}: {
  txids: string[] | undefined;
  pending: boolean;
}) {
  const { cluster } = useEndpoint();

  const handleConfirmationClick = useCallback(() => {
    txids?.forEach((tx) => {
      window.open(`https://explorer.solana.com/tx/${tx}?cluster=${cluster}`);
    });
  }, [txids, cluster]);
  const status = pending ? "Pending" : "Confirmed";

  return (
    <Icon
      _hover={{ cursor: "pointer" }}
      onClick={handleConfirmationClick}
      w="12px"
      h="12px"
      as={pending ? BsCircle : BsCheckCircleFill}
      color="gray"
      title={status}
    />
  );
}