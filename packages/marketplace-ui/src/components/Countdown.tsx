import { VStack, Center, HStack, Text, Box } from "@chakra-ui/react";
import { useSolanaUnixTime } from "@strata-foundation/react";
import React, { Children } from "react";
import ReactCountdown from "react-countdown";

const TimeCard = ({ name, value }: { name: string; value: number }) => (
  <VStack flexGrow={1} spacing={2}>
    <Text fontWeight={900} fontSize="24px" color="primary.500">
      {value}
    </Text>
    <Text color="gray.400" fontSize="14px">
      {name}
    </Text>
  </VStack>
);

const Sep = () => <Text fontWeight={600} fontSize="24px" color="gray.500">:</Text>

export const Countdown = ({ date, children }: { date: Date, children?: React.ReactNode }) => {
  const unixTime = useSolanaUnixTime();
  const renderer = ({ days, hours, minutes, seconds, completed }: { days: number, hours: number, minutes: number, seconds: number, completed: boolean }) => {
    if (completed) {
      // Render a completed state
      return children || <div />;
    } else {
      // Render a countdown
      return (
        <Box w="full" rounded="lg" borderColor="primary.500" borderWidth="1px" padding={4}>
          <HStack w="full" spacing={2} align="top">
            <TimeCard value={days} name="Days" />
            <Sep />
            <TimeCard value={hours} name="Hours" />
            <Sep />
            <TimeCard value={minutes} name="Minutes" />
            <Sep />
            <TimeCard value={seconds} name="Seconds" />
          </HStack>
        </Box>
      );
    }
  };

  if (!unixTime) {
    return <div />
  }

  return (
    // @ts-ignore
    <ReactCountdown
      now={() => unixTime * 1000}
      date={date}
      // @ts-ignore
      renderer={renderer}
    />
  );
}