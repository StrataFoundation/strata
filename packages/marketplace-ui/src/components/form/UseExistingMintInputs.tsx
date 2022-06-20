import { Box, Collapse, Switch, Text } from "@chakra-ui/react";
import {
  useMetaplexTokenMetadata,
  usePublicKey,
} from "@strata-foundation/react";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { FormControlWithError } from "./FormControlWithError";
import { MintSelect } from "./MintSelect";

export interface IUseExistingMintProps {
  useExistingMint: boolean | undefined;
  existingMint: string | undefined;
  name?: string;
  symbol?: string;
  uri?: string;
}

export function UseExistingMintInputs() {
  const {
    register,
    watch,
    formState: { errors },
    setValue,
  } = useFormContext<IUseExistingMintProps>();
  const router = useRouter();
  const mint = router.query["mint"];
  const { useExistingMint, existingMint, name, symbol } = watch();
  const existingMintPkey = usePublicKey(existingMint);
  const { metadata } = useMetaplexTokenMetadata(existingMintPkey);

  useEffect(() => {
    if (mint) {
      setValue("existingMint", mint as string);
      setValue("useExistingMint", !!mint);
    }
  }, [mint, router, setValue]);

  useEffect(() => {
    setValue("name", metadata?.data.name);
    setValue("symbol", metadata?.data.symbol);
    setValue("uri", metadata?.data.uri);
  }, [setValue, metadata]);

  return (
    <>
      <FormControlWithError
        id="useExistingMint"
        help="Sell a set amount of an existing spl token rather than creating a new one to sell. Note that you must have the amount you wish to sell in your wallet."
        label="Use an existing token?"
        errors={errors}
      >
        <Switch isChecked={useExistingMint} {...register("useExistingMint")} />
      </FormControlWithError>
      <Box w="full" p={0}>
        <Collapse in={useExistingMint} animateOpacity style={{ overflow: "visible"}}>
          <FormControlWithError
            id="existingMint"
            help="The mint id of the existing token to use for this sale"
            label="Mint"
            errors={errors}
          >
            {name && (
              <Text color="gray.400" size="sm">
                {name} ({symbol})
              </Text>
            )}
            <MintSelect
              value={watch("existingMint") || ""}
              onChange={(s) => setValue("existingMint", s)}
            />
          </FormControlWithError>
        </Collapse>
      </Box>
    </>
  );
}
