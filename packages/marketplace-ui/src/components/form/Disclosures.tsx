import React from "react";
import { Checkbox, VStack } from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";
import * as yup from "yup";

export interface IDisclosures {
  notASecurity: boolean;
  acceptedFees: boolean;
}

export const disclosuresSchema = yup.object({
  notASecurity: yup.boolean().required().isTrue(),
  acceptedFees: yup.boolean().required().isTrue(),
});

export const Disclosures = ({ fees }: { fees: number }) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<{ disclosures: IDisclosures }>();

  return (
    <VStack spacing={2} w="full" align="left">
      <Checkbox
        isInvalid={!!errors.disclosures?.notASecurity}
        {...register("disclosures.notASecurity")}
      >
        I represent that this token is not considered a security in the United
        States of America, or that I will deploy a separate interface not
        associated with Strata to purchase the tokens outside of the US.
      </Checkbox>
      {fees && (
        <Checkbox
          isInvalid={!!errors.disclosures?.acceptedFees}
          {...register("disclosures.acceptedFees")}
        >
          I understand that Strata will take a {fees}% fee on tokens sold.
        </Checkbox>
      )}
    </VStack>
  );
};
