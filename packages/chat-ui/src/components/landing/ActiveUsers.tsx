import { gql } from "@apollo/client";
import {
  Badge,
  Circle, HStack, Text
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";

import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader

export const ActiveUsers = ({ num, fontSize = "15px" }: { num: number; fontSize?: string }) => (
  <Badge
    color="white"
    position="absolute"
    top="16px"
    left="16px"
    rounded="full"
    p="10px"
    background="gray.600"
    fontSize={fontSize}
    lineHeight={fontSize}
    fontWeight="bold"
  >
    <HStack spacing={1}>
      <Circle background={"#67FF92"} size="8px" />
      <Text>{num} Active</Text>
    </HStack>
  </Badge>
);

const query = gql`
query ActiveUsers {
  strata_strata {
    pid_chatGL6yNgZT2Z3BeMYGcgdMpcBKdmxko4C5UhEX4To {
      message_parts_message_part_event_v_0_aggregate(
        distinct_on: sender
        where: {chat: {_eq: "EzNMGtFA62nvDfCybZi4vhfeJUoMJyMijcKoC8heoyHK"}, blocktime: {_gte: "1659805253"}}
      ) {
        aggregate {
          count(distinct: true)
        }
      }
    }
  }
}
`

