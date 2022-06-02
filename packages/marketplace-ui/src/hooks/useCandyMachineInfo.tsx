import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as anchor from "@project-serum/anchor";
import {
  getAtaForMint,
  toDate,
} from "../components";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ICandyMachine, useCandyMachine } from "./useCandyMachine";
import BN from "bn.js";

export interface ICandyMachineState {
  candyMachine: ICandyMachine | undefined;
  isActive: boolean;
  endDate: Date | undefined;
  itemsRemaining: number | undefined;
  isWhitelistUser: boolean;
  isPresale: boolean;
  discountPrice: BN | undefined;
}

export function useCandyMachineInfo(
  candyMachineId: PublicKey | undefined
): ICandyMachineState {
  const [candyMachine, setCandyMachine] = useState<ICandyMachine>();
  const [isActive, setIsActive] = useState(false);
  const [endDate, setEndDate] = useState<Date>();
  const [itemsRemaining, setItemsRemaining] = useState<number>();
  const [isWhitelistUser, setIsWhitelistUser] = useState(false);
  const [isPresale, setIsPresale] = useState(false);
  const [discountPrice, setDiscountPrice] = useState<BN>();
  const { connection } = useConnection();

  const { publicKey } = useWallet();

  const { info: cndy } = useCandyMachine(candyMachineId);

  useEffect(() => {
    (async () => {
      if (cndy && publicKey) {
        try {
          let active =
            cndy?.goLiveDate?.toNumber() < new Date().getTime() / 1000;

          let presale = false;
          // whitelist mint?
          if (cndy?.whitelistMintSettings) {
            // is it a presale mint?
            if (
              cndy.whitelistMintSettings.presale &&
              (!cndy.goLiveDate ||
                cndy.goLiveDate.toNumber() > new Date().getTime() / 1000)
            ) {
              presale = true;
            }
            // is there a discount?
            if (cndy.whitelistMintSettings.discountPrice) {
              setDiscountPrice(cndy.whitelistMintSettings.discountPrice);
            } else {
              setDiscountPrice(undefined);
              // when presale=false and discountPrice=null, mint is restricted
              // to whitelist users only
              if (!cndy.whitelistMintSettings.presale) {
                cndy.isWhitelistOnly = true;
              }
            }
            // retrieves the whitelist token
            const mint = new anchor.web3.PublicKey(
              cndy.whitelistMintSettings.mint
            );
            const token = (await getAtaForMint(mint, publicKey))[0];

            try {
              const balance = await connection.getTokenAccountBalance(token);
              let valid = parseInt(balance.value.amount) > 0;
              // only whitelist the user if the balance > 0
              setIsWhitelistUser(valid);
              active = (presale && valid) || active;
            } catch (e) {
              setIsWhitelistUser(false);
              // no whitelist user, no mint
              if (cndy.isWhitelistOnly) {
                active = false;
              }
              console.log(
                "There was a problem fetching whitelist token balance"
              );
              console.log(e);
            }
          }
          // datetime to stop the mint?
          if (cndy?.endSettings?.endSettingType.date) {
            setEndDate(toDate(cndy.endSettings.number));
            if (
              cndy.endSettings.number.toNumber() <
              new Date().getTime() / 1000
            ) {
              active = false;
            }
          }
          // amount to stop the mint?
          if (cndy?.endSettings?.endSettingType.amount) {
            let limit = Math.min(
              cndy.endSettings.number.toNumber(),
              cndy.itemsAvailable
            );
            if (cndy.itemsRedeemed < limit) {
              setItemsRemaining(limit - cndy.itemsRedeemed);
            } else {
              setItemsRemaining(0);
              cndy.isSoldOut = true;
            }
          } else {
            setItemsRemaining(cndy.itemsRemaining);
          }

          if (cndy.isSoldOut) {
            active = false;
          }

          setIsActive((cndy.isActive = active));
          setIsPresale((cndy.isPresale = presale));
          setCandyMachine(cndy);
        } catch (e) {
          console.log("There was a problem fetching Candy Machine state");
          console.log(e);
        }
      }
    })();
  }, [publicKey, cndy, connection]);

  return {
    candyMachine,
    isActive,
    endDate,
    itemsRemaining,
    isWhitelistUser,
    isPresale,
    discountPrice,
  };
}
