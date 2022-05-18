import { Text, Flex, HStack, Icon, Tooltip } from "@chakra-ui/react";
import React from "react";
import { RiInformationLine } from "react-icons/ri";

export type TransactionInfoArgs = {
  name: string;
  tooltip: string;
  amount: string;
  formRef: React.MutableRefObject<HTMLInputElement>;
};

export const TransactionInfo = ({
  name,
  tooltip,
  amount,
  formRef,
}: TransactionInfoArgs) => {
  return (
    <Flex justify="space-between" alignItems="center">
      <HStack>
        <Text>{name}</Text>
        <Tooltip
          placement="top"
          label={tooltip}
          portalProps={{ containerRef: formRef }}
        >
          <Flex>
            <Icon
              w={5}
              h={5}
              as={RiInformationLine}
              _hover={{ color: "primary.500", cursor: "pointer" }}
            />
          </Flex>
        </Tooltip>
      </HStack>
      <Flex>{amount}</Flex>
    </Flex>
  );
};
