import { Icon, IconButton } from "@chakra-ui/react";
import { getOrca, OrcaPoolConfig } from "@orca-so/sdk";
import { Provider } from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { ShdwDrive, StorageAccount } from "@shadow-drive/sdk";
import { AccountLayout, ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { useErrorHandler, useProvider } from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import { getMintInfo, sendAndConfirmWithRetry } from "@strata-foundation/spl-utils";
import BN from "bn.js";
import Decimal from "decimal.js";
import React from "react";
import { useAsyncCallback } from "react-async-hook";
import { IoMdAttach } from "react-icons/io";
import { useDelegateWallet } from "../hooks";


export function ShdwAttachment({
  onUpload,
}: {
  onUpload: (url: string) => void;
}) {
  const hiddenFileInput = React.useRef<HTMLInputElement>(null);
  const { provider } = useProvider();
  const delegateWallet = useDelegateWallet();
  const { execute, loading, error } = useAsyncCallback(uploadFile);
  const { handleErrors } = useErrorHandler();
  handleErrors(error);
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    try {
      const url = await execute(provider, delegateWallet, file);
      if (url) {
        onUpload(url);
      }
    } finally {
      if (hiddenFileInput.current) {
        hiddenFileInput.current.value = ""
      }
    }
  };

  return (
    <>
      <input
        id="image"
        type="file"
        accept=".png,.jpg,.gif,.mp4,.svg"
        multiple={false}
        onChange={handleImageChange}
        ref={hiddenFileInput}
        style={{ display: "none" }}
      />
      <IconButton
        isLoading={loading}
        size="lg"
        aria-label="Select Image"
        variant="outline"
        onClick={() => hiddenFileInput.current!.click()}
        icon={<Icon w="24px" h="24px" as={IoMdAttach} />}
      />
    </>
  );
}
