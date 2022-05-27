import { Flex } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import React from "react";

export function ChatMessages({
  scrollRef,
  chatKey,
}: {
  scrollRef: any;
  chatKey?: PublicKey;
}) {
  //get messages then map onto a messages array
  // const [values] = useCollectionData(
  //   query(collection(db, `${chatType}`, id, "messages"), orderBy("createdAt", 'asc'))
  // )
  // const messages = [].map(msg => (
  //   <Message key={Math.random()} id={msg.uid} message={msg.Message} photoURL={msg.photoURL} />
  // ))

  return (
    <Flex grow="1" align="start" direction="column" overflowY="scroll" p="10px">
      {/* {messages} */}
      <div ref={scrollRef}></div>
    </Flex>
  );
}
