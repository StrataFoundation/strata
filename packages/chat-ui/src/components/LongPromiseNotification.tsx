import {
  Alert, Box, Progress, Text,
  VStack
} from "@chakra-ui/react";
import { useErrorHandler, useInterval } from "@strata-foundation/react";
import React, { useEffect, useState } from "react";
import { useAsync } from "react-async-hook";

export interface ILongPromiseNotification<T> {
  onComplete?: (result: T) => void;
  text: string;
  estTimeMillis: number;
  exec: () => Promise<T>;
  onError: (error: Error) => void;
}
export function LongPromiseNotification<T>({
  onComplete,
  onError,
  exec,
  estTimeMillis,
  text
}: ILongPromiseNotification<T>) {
  const [time, setTime] = useState(0);
  const { result, error } = useAsync(exec, []);

  useEffect(() => {
    if (onComplete && result) {
      onComplete(result);
    }
  }, [result, onComplete]);
  useEffect(() => {
    if (onError && error) {
      onError(error);
    }
  }, [error, onError]);

  useInterval(() => {
    setTime(time => time + 100)
  }, 100);
  

  return (
    <Alert
      w="290px"
      bgColor="black.300"
      borderTop="1px"
      borderTopColor="gray.600"
      rounded="lg"
      fontFamily="body"
      color="white"
      status={"success"}
      flexDirection="column"
      p={0}
    >
      <Box w="full">
        <Progress value={Math.min(time / estTimeMillis, 95) * 100} />
      </Box>
      <VStack align="left" w="full" p={2} spacing={1}>
        <Text color="gray.400">{text}</Text>
      </VStack>
    </Alert>
  );
};
