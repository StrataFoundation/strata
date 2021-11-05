import React, {
  FC,
  ReactNode,
  createContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { truthy } from "../utils";

export interface IErrorHandlerProviderProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

export interface IErrorHandlerContextState {
  errors: null | (Error | undefined)[];
  handleErrors: (...errors: (Error | undefined)[]) => void;
}

export const ErrorHandlerContext = createContext<IErrorHandlerContextState>(
  {} as IErrorHandlerContextState
);

export const ErrorHandlerProvider: FC<IErrorHandlerProviderProps> = ({
  children,
  onError = (error: Error) => console.log(error),
}) => {
  const [errors, setErrors] = useState<(Error | undefined)[]>([]);

  const handleErrors = useCallback(
    async (...errors: (Error | undefined)[]) => {
      setErrors(errors);
    },
    [setErrors]
  );

  useEffect(() => {
    errors.filter(truthy).map(onError);
  }, [errors, truthy, onError]);

  return (
    <ErrorHandlerContext.Provider
      value={{
        errors,
        handleErrors,
      }}
    >
      {children}
    </ErrorHandlerContext.Provider>
  );
};
