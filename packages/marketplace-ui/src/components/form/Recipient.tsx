import { Link, usePrevious } from "@chakra-ui/react";
import {
  FormControl,
  HStack,
  Center,
  Avatar,
  Circle,
  VStack,
  Text,
  Icon,
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import {
  WUMBO_TWITTER_VERIFIER,
  WUMBO_TWITTER_TLD,
  usePrimaryClaimedTokenRef,
  usePublicKey,
  useReverseName,
  useTokenMetadata,
  useTokenRef,
} from "@strata-foundation/react";
import React, { useEffect, useMemo, useState } from "react";
import { FormEvent } from "react";
import { AiOutlineExclamation } from "react-icons/ai";
import { BiCheck } from "react-icons/bi";

export const Recipient = ({
  value,
  onChange,
  name,
}: {
  name: string;
  value: string;
  onChange: (e: FormEvent<HTMLParagraphElement>) => void;
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const recipient = usePublicKey(internalValue);
  const { info: tokenRefForOwner } = usePrimaryClaimedTokenRef(recipient);
  const { info: recipientAsTokenRef } = useTokenRef(recipient);
  const tokenRef = useMemo(
    () => tokenRefForOwner || recipientAsTokenRef,
    [tokenRefForOwner, recipientAsTokenRef]
  );

  const {
    metadata,
    image,
    loading: metadataLoading,
  } = useTokenMetadata(tokenRef?.mint);
  const prevValue = usePrevious(value);
  const { nameString: handle, loading: handleLoading } = useReverseName(
    recipient,
    WUMBO_TWITTER_VERIFIER,
    WUMBO_TWITTER_TLD
  );
  const invalidAddress = Boolean(!recipient && internalValue);
  const recipientRef = React.useRef<HTMLParagraphElement>(null);
  const prevRecipientRef = usePrevious(recipientRef);

  useEffect(() => {
    if (value != internalValue && prevValue != value) {
      if (recipientRef.current && value) {
        recipientRef.current.innerText = value;
      }
      setInternalValue(value);
    }
  }, [recipientRef, value, internalValue, prevValue]);

  useEffect(() => {
    if (
      (!prevRecipientRef || !prevRecipientRef.current) &&
      recipientRef.current
    ) {
      if (internalValue) {
        recipientRef.current.innerText = internalValue;
      }
    }
  }, [prevRecipientRef, recipientRef, internalValue]);

  return (
    <FormControl>
      <HStack spacing={4} rounded={4} border="1px" borderColor="gray.200" p={4}>
        <Center>
          {metadata && <Avatar w="57px" h="57px" src={image} />}
          {!metadata && (
            <Circle
              size={internalValue ? "57px" : "24px"}
              backgroundColor="gray.200"
            >
              {recipient && (
                <Center>
                  <Icon color="green" as={BiCheck} />
                </Center>
              )}
              {invalidAddress && (
                <Center>
                  <Icon color="red" as={AiOutlineExclamation} />
                </Center>
              )}
            </Circle>
          )}
        </Center>
        <VStack
          w="full"
          spacing={1}
          alignItems="start"
          justifyContent="stretch"
        >
          {metadata && (
            <Text flexGrow={0} fontWeight={700}>
              {metadata.data.name}
            </Text>
          )}
          {!metadata && handle && (
            <Link
              flexGrow={0}
              fontWeight={700}
              isExternal
              href={`https://twitter.com/${handle}`}
            >
              @{handle}
            </Link>
          )}
          {invalidAddress && (
            <Text flexGrow={0} fontSize="xs" color="red">
              Invalid address
            </Text>
          )}
          <Text
            ref={recipientRef}
            onInput={(e) => {
              // @ts-ignore
              e.target.value = e.target.innerText;
              // @ts-ignore
              e.target.name = name;
              // @ts-ignore
              setInternalValue(e.target.value);

              try {
                // See if valid
                // @ts-ignore
                new PublicKey(e.target.innerText);
                onChange(e);
              } catch (err) {
                // @ts-ignore
                e.target.value = null;
                onChange(e);
              }
            }}
            wordBreak="break-word"
            flexGrow={1}
            className="input"
            role="textbox"
            contentEditable
            w="full"
            border="none"
            overflow="auto"
            outline="none"
            resize="none"
            boxShadow="none"
            ring="none"
            placeholder="Enter Address"
            _focus={{ boxShadow: "none" }}
          />
        </VStack>
      </HStack>
    </FormControl>
  );
};
