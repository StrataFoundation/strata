import { IStrataSdksReactState, StrataSdksContext } from "../contexts/strataSdkContext";
import React from "react";

export function useStrataSdks(): IStrataSdksReactState {
  const context = React.useContext(StrataSdksContext);

  if (context === undefined) {
    throw new Error("usePrograms must be used within StrataProgramsProvider");
  }

  return context;
}
