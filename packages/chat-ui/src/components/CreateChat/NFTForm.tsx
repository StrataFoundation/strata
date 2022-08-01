import React from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { FormControlWithError } from "../form/FormControlWithError";
import { Stack, Text, Input, ButtonGroup, Button } from "@chakra-ui/react";

export interface INFTFormValues {
  type: "nft";
  amount: number;
  collectionKey: string;
}

interface INFTFormProps {
  defaultValues?: any;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

const validationSchema = yup
  .object({
    collectionKey: yup.string().required(),
  })
  .required();

export const NFTForm: React.FC<INFTFormProps> = ({
  onSubmit,
  onBack,
  defaultValues = {},
}) => {
  const {
    handleSubmit,
    setValue,
    register,
    watch,
    formState: { errors },
  } = useForm<INFTFormValues>({
    mode: "onChange",
    resolver: yupResolver(validationSchema),
    defaultValues,
  });

  const { collectionKey } = watch();
  const inputBg = { bg: "gray.200", _dark: { bg: "gray.800" } };

  const handleOnSubmit = (data: any) => {
    onSubmit({
      type: "nft",
      amount: 1, // Hardcoded 1 for now
      ...data,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleOnSubmit)} style={{ width: "100%" }}>
      <Stack w="full" alignItems="start" gap={8} spacing={0}>
        <Stack w="full" alignItems="start" gap={6} spacing={0}>
          <FormControlWithError
            id="collectionKey"
            label="Collection Key"
            errors={errors}
            help="The key of the nft collection to use for this permission."
          >
            <Input
              id="collectionKey"
              variant="filled"
              {...inputBg}
              {...register("collectionKey")}
            />
          </FormControlWithError>
        </Stack>
        <ButtonGroup variant="outline" colorScheme="primary" w="full">
          <Button w="full" onClick={onBack}>
            Back
          </Button>
          <Button
            w="full"
            variant="solid"
            type="submit"
            disabled={!collectionKey}
          >
            Next
          </Button>
        </ButtonGroup>
      </Stack>
    </form>
  );
};
