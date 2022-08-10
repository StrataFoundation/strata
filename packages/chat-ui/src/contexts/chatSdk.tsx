import { AnchorProvider, Provider } from "@project-serum/anchor";
import { ChatSdk } from "@strata-foundation/chat";
import { useProvider } from "@strata-foundation/react";
import React, { useContext, useMemo } from "react";
import { useAsync } from "react-async-hook";

export const ChatSdkContext =
  React.createContext<IChatSdkReactState>({
    loading: true,
  });

export interface IChatSdkReactState {
  error?: Error;
  loading: boolean;
  chatSdk?: ChatSdk;
}

async function tryProm<A>(prom: Promise<A>): Promise<A | undefined> {
  try {
    return await prom;
  } catch (e) {
    console.error(e);
  }

  return undefined;
}

async function getSdk(
  provider: AnchorProvider | undefined | null
): Promise<ChatSdk | undefined> {
  if (!provider) {
    return undefined;
  }

  return tryProm(ChatSdk.init(provider));
}
export const ChatSdkProviderRaw: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { provider } = useProvider();
  const { result, loading, error } = useAsync(getSdk, [provider]);
  const sdks = useMemo(
    () => ({
      chatSdk: result,
      error,
      loading,
    }),
    [result, loading, error]
  );

  return (
    <ChatSdkContext.Provider value={sdks}>
      {children}
    </ChatSdkContext.Provider>
  );
};

//@ts-ignore
export const ChatSdkProvider: React.FC = ({ children }) => {
  //@ts-ignore
  return <ChatSdkProviderRaw>{children}</ChatSdkProviderRaw>;
};

export const useChatSdk = (): IChatSdkReactState => {
  return useContext(ChatSdkContext);
};
