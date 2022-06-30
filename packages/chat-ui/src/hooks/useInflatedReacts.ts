import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useAsync } from "react-async-hook";
import { IMessageWithPending, IMessageWithPendingAndReacts } from "./useMessages";
import { useProfileKey } from "./useProfileKey";

interface IReact {
  emoji: string;
  count: number;
  messages: IMessageWithPending[];
  mine: boolean; // Did I react to this message?
}

function dedupeByProfile(
  reacts: { decoded: any; message: IMessageWithPending }[]
): { decoded: any; message: IMessageWithPending }[] {
  const seen = new Set<string>();
  return reacts.filter((value) => {
    const k = value.message.profileKey.toBase58();
    if (!seen.has(k)) {
      seen.add(k);
      return value;
    }
  });
}

async function getReacts(myProfileKey: PublicKey | undefined, messages: IMessageWithPending[] | undefined): Promise<IReact[] | undefined> {
  if (!messages) {
    return undefined
  }

  const reacts = await Promise.all(
    messages.map(async (message) => {
      const decoded = await message.getDecodedMessage();
      return {
        decoded,
        message,
      }
    }),
  );
  const grouped = reacts.reduce((acc, react) => {
    if (react.decoded?.emoji) {
      const reacts = acc[react.decoded.emoji] || [];
      acc[react.decoded.emoji] = [...reacts, react];
    }

    return acc;
  }, {} as Record<string, { decoded: any; message: IMessageWithPending }[]>)

  const dedupedAndCoerced = Object.entries(grouped).map(([emoji, reacts]) => {
    const deduped = dedupeByProfile(reacts);
    const count = reacts.length;
    const mine =
      myProfileKey &&
      reacts.some(({ message }) => message.profileKey.equals(myProfileKey));
    return {
      emoji,
      count,
      messages: deduped.map(({ message }) => message),
      mine: Boolean(mine),
    };
  });

  return dedupedAndCoerced;
}

/**
 * Get all reactions to a message, removing duplicates.
 */
export function useInflatedReacts(reacts: IMessageWithPending[] | undefined): {
  loading: boolean;
  error: Error | undefined;
  reacts: IReact[] | undefined;
} {
  const { publicKey } = useWallet();
  const { key: profileKey, loading } = useProfileKey(publicKey || undefined);
  const { result, error, loading: loadingResult } = useAsync(getReacts, [profileKey, reacts]);

  return {
    reacts: result,
    error,
    loading: loadingResult || loading
  };
}
