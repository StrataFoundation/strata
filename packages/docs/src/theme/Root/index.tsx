import "./bufferFill";
import { Wallet } from "@site/src/contexts/Wallet";
import { AccountProvider, StrataSdksProvider } from "@strata-foundation/react";
import React from "react";
import { VariablesProvider } from "./variables";

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");

export default ({ children }) => (
  <>
    <Wallet>
      <StrataSdksProvider>
        <AccountProvider>
          <VariablesProvider>{children}</VariablesProvider>
        </AccountProvider>
      </StrataSdksProvider>
    </Wallet>
  </>
);
