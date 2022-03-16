import {
  Box, Collapse, Switch
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { FormControlWithError } from "./FormControlWithError";
import { MintSelect } from "./MintSelect";

export interface IUseExistingMintProps {
  useExistingMint: boolean | undefined;
  existingMint: string | undefined;
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
  const { useExistingMint } = watch();
  useEffect(() => {
    setValue("existingMint", mint as string);
    setValue("useExistingMint", !!mint);
  }, [mint, router, setValue])

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
        <Collapse in={useExistingMint} animateOpacity>
          <FormControlWithError
            id="existingMint"
            help="The mint id of the existing token to use for this sale"
            label="Mint"
            errors={errors}
          >
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
