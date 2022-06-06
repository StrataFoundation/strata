import { Button, Icon } from "@chakra-ui/react";
import { AnchorProvider } from "@project-serum/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  useErrorHandler,
  useProvider,
  useQueryString,
  useReverseName,
  WUMBO_TWITTER_TLD,
  WUMBO_TWITTER_VERIFIER,
} from "@strata-foundation/react";
import { executeRemoteTxn } from "@strata-foundation/spl-utils";
import { useLinkTwitter } from "../hooks/useLinkTwitter";
import React, { useEffect } from "react";
import { useAsync } from "react-async-hook";
import { FaTwitter } from "react-icons/fa";
import { WUMBO_IDENTITY_SERVICE_URL } from "../constants";

const link = async (
  publicKey: PublicKey | null,
  state: string,
  code: string,
  ownerTwitterHandle: string | undefined,
  provider: AnchorProvider | undefined
) => {
  if (!ownerTwitterHandle) {
    if (state == localStorage.getItem("state") && provider && publicKey) {
      await executeRemoteTxn(
        provider!,
        WUMBO_IDENTITY_SERVICE_URL + "/twitter/oauth",
        {
          pubkey: publicKey.toBase58(),
          redirectUri: localStorage.getItem("redirectUri"),
          code,
          state,
        }
      );
      localStorage.removeItem("state");
      localStorage.removeItem("redirectUri");
      return true;
    }
  }
};

export const TwitterLink = () => {
  const { publicKey } = useWallet();
  const [code, setCode] = useQueryString("code", "");
  const { provider, awaitingApproval } = useProvider();
  const [state, setState] = useQueryString("state", "");
  const { nameString: ownerTwitterHandle, error: reverseTwitterError } =
    useReverseName(
      publicKey || undefined,
      WUMBO_TWITTER_VERIFIER,
      WUMBO_TWITTER_TLD
    );

  const { handleErrors } = useErrorHandler();
  const { execute } = useLinkTwitter();

  const {
    loading: linkLoading,
    error: linkError,
    result,
  } = useAsync(link, [publicKey, state, code, ownerTwitterHandle, provider]);
  handleErrors(reverseTwitterError, linkError);
  useEffect(() => {
    if (result) {
      setCode("");
      setState("");
    }
  }, [result, setCode, setState]);

  if (publicKey) {
    return (
      <Button
        colorScheme="twitter"
        isDisabled={!!ownerTwitterHandle}
        leftIcon={<Icon as={FaTwitter} />}
        variant={ownerTwitterHandle ? "ghost" : "outline"}
        onClick={execute}
        isLoading={linkLoading}
        loadingText={awaitingApproval ? "Awaiting Approval" : "Linking"}
      >
        {ownerTwitterHandle ? ownerTwitterHandle : "Link Wallet"}
      </Button>
    );
  }

  return null;
};
