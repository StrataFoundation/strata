import {
  AcceleratorProvider,
  HolaplexAndVybeGraphqlProvider,
  StrataProviders,
} from "@strata-foundation/react";
import React, { FC } from "react";
import { ChatSdkProvider, EmojisProvider, ReplyProvider } from "../contexts";

const defaultOnError = (error: Error) => console.log(error);
export const ChatProviders: FC<{
  onError?: (error: Error) => void;
  resetCSS?: boolean;
}> = ({ children, onError = defaultOnError, resetCSS = false }) => (
  <StrataProviders resetCSS onError={onError}>
    <AcceleratorProvider url="wss://prod-api.teamwumbo.com/accelerator">
      <ChatSdkProvider>
        <HolaplexAndVybeGraphqlProvider>
          <EmojisProvider>
            <ReplyProvider>{children}</ReplyProvider>
          </EmojisProvider>
        </HolaplexAndVybeGraphqlProvider>
      </ChatSdkProvider>
    </AcceleratorProvider>
  </StrataProviders>
);
