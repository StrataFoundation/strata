import {
  IStrataSdksReactState,
  StrataSdksContext,
} from "../contexts/strataSdkContext";
import React from "react";

/**
 * Get all of the Strata sdks for use in react functions
 * @returns
 */
export function useStrataSdks(): IStrataSdksReactState {
  const context = React.useContext(StrataSdksContext);

  if (context === undefined) {
    throw new Error("useStrataSdks must be used within StrataProgramsProvider");
  }

  return context;
}
