import React, {
  FC,
  ReactNode,
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import { IMessageWithPendingAndReacts } from "../hooks/useMessages";

export interface IReplyProviderProps {
  children: ReactNode;
}

export interface IReplyContextState {
  replyMessage: Partial<IMessageWithPendingAndReacts> | undefined;
  showReply: (reply: Partial<IMessageWithPendingAndReacts> | undefined) => void;
  hideReply: () => void;
}

export const ReplyContext = createContext<IReplyContextState>(
  {} as IReplyContextState
);

export const ReplyProvider: FC<IReplyProviderProps> = ({ children }) => {
  const [replyMessage, setReplyMessage] = useState<
    Partial<IMessageWithPendingAndReacts> | undefined
  >();

  const hideReply = useCallback(
    () => setReplyMessage(undefined),
    [setReplyMessage]
  );

  const showReply = useCallback(
    (reply: Partial<IMessageWithPendingAndReacts> | undefined) => {
      setReplyMessage(reply);
    },
    [setReplyMessage]
  );

  return (
    <ReplyContext.Provider
      value={{
        replyMessage,
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