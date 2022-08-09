import {
  AcceleratorProvider,
  GraphqlProvider,
  StrataProviders,
} from "@strata-foundation/react";
import React, { FC } from "react";
import { ReplyProvider } from "../contexts/reply";
import { ChatSdkProvider } from "../contexts/chatSdk";
import { EmojisProvider } from "../contexts/emojis";

const defaultOnError = (error: Error) => console.log(error);
export const ChatProviders: FC<{
  onError?: (error: Error) => void;
  resetCSS?: boolean;
  //@ts-ignore
}> = ({ children, onError = defaultOnError, resetCSS = false }) => (
  <StrataProviders resetCSS onError={onError}>
    <AcceleratorProvider url="wss://prod-api.teamwumbo.com/accelerator">
      {/* @ts-ignore */}
      <ChatSdkProvider>
        <GraphqlProvider>
          <EmojisProvider>
            <ReplyProvider>{children}</ReplyProvider>
          </EmojisProvider>
        </GraphqlProvider>
      </ChatSdkProvider>
    </AcceleratorProvider>
  </StrataProviders>
);
