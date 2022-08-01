import React, {
  FC,
  ReactNode,
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

export interface IEmojisProviderProps {
  children: ReactNode;
}

export interface IEmojisContextState {
  referenceMessageId: string | undefined;
  showPicker: (messageId: string | undefined) => void;
  hidePicker: () => void;
}

export const EmojisContext = createContext<IEmojisContextState>(
  {} as IEmojisContextState
);

const EmojisProvider: FC<IEmojisProviderProps> = ({ children }) => {
  const [referenceMessageId, setReferenceMessageId] = useState<
    string | undefined
  >();

  const hidePicker = useCallback(
    () => setReferenceMessageId(undefined),
    [setReferenceMessageId]
  );

  const showPicker = useCallback(
    (messageId: string | undefined) => {
      console.log(messageId);
      setReferenceMessageId(messageId);
    },
    [setReferenceMessageId]
  );

  return (
    <EmojisContext.Provider
      value={{
        referenceMessageId,
        showPicker,
        hidePicker,
      }}
    >
      {children}
    </EmojisContext.Provider>
  );
};

const useEmojis = () => {
  const context = useContext(EmojisContext);
  if (context === undefined) {
    throw new Error("useEmojis must be used within a EmojisProvider");
  }
  return context;
};

export { EmojisProvider, useEmojis };
