import { Button, Flex, FormControl, Input } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import React, { useState } from "react";

export type chatProps = {
  chatKey?: PublicKey;
  scrollRef?: any;
};

export function Chatbox({ scrollRef, chatKey }: chatProps) {
  const [input, setInput] = useState("");
  const handleChange = (e: any) => {
    setInput(e.target.value);
  };
  /*get uid and phoroURL from current User then send message 
  and set chat state to "", then scroll to latst message
  */
  const sendMessage = async (e: any) => {
    setInput("");
    scrollRef.current.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <Flex direction="row" position="sticky" bottom={0}>
      <FormControl
        p={2}
        zIndex={3}
        as="form"
        display="flex"
        alignItems="center"
      >
        <Input
          size="lg"
          value={input}
          onChange={handleChange}
          placeholder="Type Message"
        />
        <Button size="lg" type="submit" onClick={sendMessage}>
          Send
        </Button>
      </FormControl>
    </Flex>
  );
}
