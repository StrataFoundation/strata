import { truthy } from "@strata-foundation/spl-utils";
import React, {
  createContext, FC,
  ReactNode, useCallback
} from "react";

export interface IErrorHandlerProviderProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

export interface IErrorHandlerContextState {
  handleErrors: (...errors: (Error | undefined)[]) => void;
}

export const ErrorHandlerContext = createContext<IErrorHandlerContextState>(
  {} as IErrorHandlerContextState
);

export const ErrorHandlerProvider: FC<IErrorHandlerProviderProps> = ({
  children,
  onError = (error: Error) => console.log(error),
}) => {
  const sentErrors = new Set();
  const handleErrors = useCallback(
    async (...errors: (Error | undefined)[]) => {
      const actualErrors = Array.from(new Set(errors.filter(truthy))).filter(
        (e) => !sentErrors.has(e)
      );
      actualErrors.forEach(sentErrors.add.bind(sentErrors));
      actualErrors.map(onError);
    },
    [onError]
  );

  return (
    <ErrorHandlerContext.Provider
      value={{
        handleErrors,
      }}
    >
      {children}
    </ErrorHandlerContext.Provider>
  );
};
