import { Governance, GovernanceAccountParser } from "@solana/spl-governance";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import {
  useAccount
} from "./useAccount";

function govParser(
  pubkey: PublicKey,
  account: AccountInfo<Buffer>
): Governance | undefined {
  const parse = GovernanceAccountParser(Governance);

  if (account.owner.equals(new PublicKey("GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw"))) {
    return parse(pubkey, account).account;
  }
}

export function useGovernance(governance: PublicKey | undefined) {
  return useAccount(governance, govParser)
}
