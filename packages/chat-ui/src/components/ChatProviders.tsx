import {
  AcceleratorProvider,
  GraphqlProvider,
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
        <GraphqlProvider>
          <EmojisProvider>
            <ReplyProvider>
              {children}
            </ReplyProvider>
          </EmojisProvider>
        </GraphqlProvider>
      </ChatSdkProvider>
    </AcceleratorProvider>
  </StrataProviders>
);
