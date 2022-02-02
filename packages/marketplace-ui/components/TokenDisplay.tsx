import React from "react";
import { useBondingPricing, useTokenBonding, useTokenMetadata, useTokenRef } from "@strata-foundation/react";
import { PublicKey } from "@solana/web3.js";

export function TokenDisplay({ tokenRef: tokenRefKey, tokenBonding: tokenBondingKey }: { tokenRef?: PublicKey, tokenBonding?: PublicKey }) {
  const { info: tokenRef, loading } = useTokenRef(tokenRefKey);
  const { info: tokenBonding, loading: loadingTokenBonding } = useTokenBonding(tokenBondingKey);
  const { image, metadata, loading: metaLoading } = useTokenMetadata(tokenRef && tokenRef.mint);
  const { pricing, loading: loadingPricing } = useBondingPricing(tokenBondingKey);
  if (loading || metaLoading || loadingPricing || loadingTokenBonding) {
    return <div>Loading...</div>
  }

  return <div>
   <img src={image} />
   { metadata && <div>
     <div><b>{metadata.data.name}</b></div>
     <div>{metadata.data.symbol}</div>
   </div> }
   { pricing && <div>
     <div>
       Current Price: { pricing.current() }
     </div>
     <div>
       Value Locked: { pricing.locked() }
     </div>
   </div> }
  </div>
}
