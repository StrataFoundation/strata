import { IDecryptedMessageContent, MessageType } from "@strata-foundation/chat";
import React, { useMemo } from "react";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Gif } from "@giphy/react-components";
import { useAsync } from "react-async-hook";
import { Skeleton, Text } from "@chakra-ui/react";
import { GIPHY_API_KEY } from "../../constants/globals";
import { Files } from "../Files";
import sanitizeHtml from "sanitize-html";

const gf = new GiphyFetch(GIPHY_API_KEY);

async function fetchGif(gifyId?: string): Promise<any | undefined> {
  if (gifyId) {
    const { data } = await gf.gif(gifyId);
    return data;
  }
}

function GifyGif({ gifyId }: { gifyId?: string }) {
  const { result: data, loading } = useAsync(fetchGif, [gifyId]);

  if (loading || !data) {
    return <Skeleton w="300px" h="300px" />;
  }

  return <Gif gif={data} width={300} />;
}

export function MessageBody({
  message,
  messageType,
  htmlAllowlist,
}: {
  message: IDecryptedMessageContent;
  messageType: MessageType;
  htmlAllowlist?: any;
}) {
  const files = useMemo(
    () => [
      ...(message?.attachments || []),
      ...(message?.decryptedAttachments || []),
    ],
    [message]
  );

  return messageType === MessageType.Gify ? (
    <GifyGif gifyId={message.gifyId} />
  ) : message.type === MessageType.Image ? (
    <Files files={files} />
  ) : message.type === MessageType.Text ? (
    <Text mt={"-4px"}>{message.text}</Text>
  ) : (
    <>
      <Files files={files} />
      <div
        dangerouslySetInnerHTML={{
          __html: message.html ? sanitizeHtml(message.html, htmlAllowlist) : "",
        }}
      />
    </>
  );
}
