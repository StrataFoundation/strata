import { useContext } from "react";
import { ErrorHandlerContext } from "../contexts";

export const useErrorHandler = () => {
  const context = useContext(ErrorHandlerContext);
  if (context === undefined) {
    throw new Error("useErrorHandler must be used within ErrorHandlerProvider");
  }

  return context;
};
