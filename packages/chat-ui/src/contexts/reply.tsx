import React, {
  FC,
  ReactNode,
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";

export interface IReplyProviderProps {
  children: ReactNode;
}

export interface IReplyContextState {
  replyToMessageId: string | undefined;
  showReply: (messageId: string | undefined) => void;
  hideReply: () => void;
}

const ReplyContext = createContext<IReplyContextState>(
  {} as IReplyContextState
);

export const ReplyProvider: FC<IReplyProviderProps> = ({ children }) => {
  const [replyToMessageId, setReplyToMessageId] = useState<
    string | undefined
  >();

  const hideReply = useCallback(
    () => setReplyToMessageId(undefined),
    [setReplyToMessageId]
  );

  const showReply = useCallback(
    (messageId: string | undefined) => {
      setReplyToMessageId(messageId);
    },
    [setReplyToMessageId]
  );

  return (
    <ReplyContext.Provider
      value={{
        replyToMessageId,
        showReply,
        hideReply,
      }}
    >
      {children}
    </ReplyContext.Provider>
  );
};
  
export const useReply = () => {
  const context = useContext(ReplyContext);
  if (context === undefined) {
    throw new Error("useReply must be used within a ReplyProvider");
  }
  return context;
};  