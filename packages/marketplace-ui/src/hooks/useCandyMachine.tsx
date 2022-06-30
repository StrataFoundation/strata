import { Program, Provider } from "anchor-17";
import { AnchorProvider } from "@project-serum/anchor";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import {
  useAccount,
  UseAccountState,
  useProvider,
} from "@strata-foundation/react";
import { TypedAccountParser } from "@strata-foundation/spl-utils";
import BN from "bn.js";
import { useAsync } from "react-async-hook";

export const CANDY_MACHINE_PROGRAM = new PublicKey(
  "cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ"
);

/**
 * Unified token bonding interface wrapping the raw TokenBondingV0
 */
export interface ICandyMachine {
  authority: PublicKey;
  publicKey: PublicKey;
  program: Program;
  itemsAvailable: number;
  itemsRedeemed: number;
  itemsRemaining: number;
  treasury: PublicKey;
  tokenMint: PublicKey;
  isSoldOut: boolean;
  isActive: boolean;
  isPresale: boolean;
  isWhitelistOnly: boolean;
  goLiveDate: BN;
  price: BN;
  gatekeeper: null | {
    expireOnUse: boolean;
    gatekeeperNetwork: PublicKey;
  };
  endSettings: null | {
    number: BN;
    endSettingType: any;
  };
  whitelistMintSettings: null | {
    mode: any;
    mint: PublicKey;
    presale: boolean;
    discountPrice: null | BN;
  };
  hiddenSettings: null | {
    name: string;
    uri: string;
    hash: Uint8Array;
  };
  retainAuthority: boolean
}

async function getCoder(
  provider: AnchorProvider | undefined
): Promise<TypedAccountParser<ICandyMachine> | undefined> {
  if (provider) {
    const idl = await Program.fetchIdl(
      CANDY_MACHINE_PROGRAM,
      // @ts-ignore
      provider as Provider
    );
    const program = new Program(
      idl!,
      CANDY_MACHINE_PROGRAM,
      // @ts-ignore
      provider as Provider
    );

    return (pubkey: PublicKey, account: AccountInfo<Buffer>) => {
      const coded = program.coder.accounts.decode<any>(
        "CandyMachine",
        account.data
      );

      const cndy = {
        ...coded,
        ...coded.data,
        publicKey: pubkey,
        program: program,
        treasury: coded.wallet,
      };

      cndy.maxSupply = cndy.maxSupply.toNumber();
      cndy.itemsRedeemed = cndy.itemsRedeemed.toNumber();
      cndy.itemsAvailable = cndy.itemsAvailable.toNumber();
      cndy.itemsRemaining = cndy.itemsAvailable - cndy.itemsRedeemed;

      return cndy;
    };
  }
}

export const useCandyMachine = (
  candyMachineId: PublicKey | undefined | null
): UseAccountState<ICandyMachine> => {
  const { provider } = useProvider();
  const { result: coder, error } = useAsync(getCoder, [provider]);

  if (error) {
    console.error(error)
  }

  return useAccount(candyMachineId, coder);
};
