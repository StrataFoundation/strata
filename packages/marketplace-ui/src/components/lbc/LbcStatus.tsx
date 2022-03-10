import React, { useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useTokenBonding, useCapInfo } from "@strata-foundation/react";
import { Countdown } from "../Countdown";
import { Center, Text, useInterval } from "@chakra-ui/react";

export const LbcStatus = ({
  tokenBondingKey,
}: {
  tokenBondingKey?: PublicKey;
}) => {
  const { info: tokenBonding } = useTokenBonding(tokenBondingKey);
  const goLiveDate = useMemo(() => {
    if (tokenBonding) {
      const date = new Date(0);
      date.setUTCSeconds(tokenBonding.goLiveUnixTime.toNumber());
      return date;
    }
  }, [tokenBonding]);
  const [isLive, setIsLive] = useState(true);
  useInterval(() => {
    setIsLive(goLiveDate ? goLiveDate < new Date() : true);
  }, 500);
  const { numRemaining } = useCapInfo(tokenBondingKey);
  const isSoldOut = typeof numRemaining !== "undefined" && numRemaining <= 0;

  if (isSoldOut) {
    return (
      <Center
        rounded="lg"
        borderColor="primary.500"
        borderWidth="1px"
        padding={4}
      >
        <Text fontWeight={600} color="primary.500">
          SOLD OUT
        </Text>
      </Center>
    );
  } else if (!isLive && goLiveDate) {
    return <Countdown date={goLiveDate} />;
  } else {
    return null;
  }
};
