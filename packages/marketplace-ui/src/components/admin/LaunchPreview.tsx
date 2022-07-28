import {
  Image,
  Stack,
  Text,
  Flex,
  Icon,
} from "@chakra-ui/react";
import React, { useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useCurve, useEndpoint, useMetaplexTokenMetadata, useReserveAmount, useTokenSwapFromId } from "@strata-foundation/react";
import { MdSettings } from "react-icons/md";
import { useRouter } from "next/router";
import { routes, route } from "../../utils/routes";
import { CurveV0, ExponentialCurveConfig } from "@strata-foundation/spl-token-bonding";


interface LaunchPreviewProps {
  id: PublicKey | undefined;
  name: string | undefined;
  image: string | undefined;
}

function checkIsFixedPrice(curve: CurveV0): boolean {
  const fixedPriceCurveConfig = new ExponentialCurveConfig({
    c: 0,
    pow: 0,
    frac: 1,
  }).toRawConfig();
  //@ts-ignore
  const hasOneCurve = curve.definition?.timeV0?.curves && curve.definition.timeV0.curves.length == 1;
  if (!hasOneCurve) return false;

  //@ts-ignore
  const expCurve = curve.definition.timeV0.curves[0]?.curve?.exponentialCurveV0;

  const isFixedCurve = expCurve && expCurve.c?.toNumber() === 0 && expCurve.pow === 0 && expCurve.frac === 1;
  return !!isFixedCurve;
}

export const LaunchPreview = ({ id, name, image }: LaunchPreviewProps) => {
  const { tokenBonding, entangled } = useTokenSwapFromId(id);
  const reserveAmount = useReserveAmount(tokenBonding?.publicKey);
  const { metadata } = useMetaplexTokenMetadata(tokenBonding?.baseMint);
  const router = useRouter();
  const { cluster } = useEndpoint();

  const { info: curve } = useCurve(tokenBonding?.curve);

  const [isFixedPrice, isFullyManaged] = useMemo(() => {
    if (tokenBonding && curve) {
      const isFixed = checkIsFixedPrice(curve);
      if (isFixed) return [true, false] // fixed price
      if (!entangled) return [false, true] // fully managed
    }
    return [false, false]
  }, [tokenBonding, curve])

  const docsUrl = useMemo(() => {
    if (isFixedPrice) {
      return route(routes.fixedPriceAdmin, {
        id: id?.toString(),
        cluster,
      })
    }
    if (isFullyManaged) {
      return route(routes.fullyManagedAdmin, {
        id: id?.toString(),
        cluster,
      })
    }

    return route(routes.tokenLbcAdmin, {
      id: id?.toString(),
      cluster,
    })
  }, [isFixedPrice, isFullyManaged])

  return (
    <Flex alignItems="center" w="full">
      <Image
        alt="Token logo"
        marginLeft="2em"
        w="50px"
        h="50px"
        borderRadius="50%"
        src={image}
      />
      <Stack 
        paddingLeft="10px" 
        onClick={() => window.open(docsUrl, "_blank")}
        cursor="pointer"
      >
        <Text 
          fontSize="xl" 
          textAlign="left" 
          fontWeight="bold"
        >
          {name}
        </Text>
        <Text 
          fontSize="md" 
          marginTop="0 !important"
        >
          Amount raised: {reserveAmount} {metadata?.data?.symbol}
          </Text>
      </Stack>
      <Icon w="24px" h="24px" 
        as={MdSettings} 
        onClick={() => window.open(docsUrl, "_blank")}
        cursor="pointer" marginLeft="auto" marginRight="2em" />
    </Flex>
  );
};
    