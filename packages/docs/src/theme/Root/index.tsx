import "./bufferFill";
import "./wdyr";
import { Wallet } from "@site/src/contexts/Wallet";
import { EndpointProvider } from "@site/src/contexts/Endpoint";
import { AccountProvider, StrataSdksProvider } from "@strata-foundation/react";
import React from "react";
import { VariablesProvider } from "./variables";

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");

export default ({ children }) => (
  <>
    <EndpointProvider>
      <Wallet>
        <StrataSdksProvider>
          <AccountProvider>
            <VariablesProvider>{children}</VariablesProvider>
          </AccountProvider>
        </StrataSdksProvider>
      </Wallet>
    </EndpointProvider>
  </>
);
