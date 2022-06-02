import { SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";
import { useAccount } from "./useAccount";

export function useSolanaUnixTime(): number | undefined {
  const { info: currentTime } = useAccount(
    SYSVAR_CLOCK_PUBKEY,
    (_, data) => {
      const unixTime = data.data.readBigInt64LE(8 * 4);

      return unixTime;
    }
  );

  return Number(currentTime);
}
