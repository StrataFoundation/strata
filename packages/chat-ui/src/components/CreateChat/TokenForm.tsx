import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Stack,
  Switch,
  Text,
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  FormErrorMessage,
  Icon,
  ButtonGroup,
  Button,
  Flex,
  Link,
} from "@chakra-ui/react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { RiErrorWarningFill } from "react-icons/ri";
import { NATIVE_MINT } from "@solana/spl-token";
import { FormControlWithError } from "../form/FormControlWithError";
import { MintSelect } from "../form/MintSelect";
import { usePublicKey } from "@strata-foundation/react";
import { routes } from "../../routes";

export interface ITokenFormValues {
  isExisting: boolean;
  type: "native" | "token";
  amount: number;
  mint: string;
  startingPrice?: number;
  legalDisclosure?: boolean;
}

export interface ITokenFormProps {
  defaultValues: any;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

export const validationSchema = (isExisting: boolean) => {
  return yup
    .object({
      amount: yup.number().required().min(0),
      ...(isExisting
        ? {
            mint: yup.string().required(),
          }
        : {
            startingPrice: yup.number().required().min(0),
            legalDisclosure: yup.bool().oneOf([true], "Field must be checked"),
          }),
    })
    .required();
};

export const TokenForm: React.FC<ITokenFormProps> = ({
  onSubmit,
  onBack,
  defaultValues,
}) => {
  const [innerIsExisting, setInnerIsExisting] = useState<boolean>(
    defaultValues.isExisting
  );

  const {
    handleSubmit,
    setValue,
    register,
    getValues,
    clearErrors,
    setError,
    watch,
    formState: { errors },
  } = useForm<ITokenFormValues>({
    mode: "onChange",
    resolver: yupResolver(validationSchema(innerIsExisting)),
    defaultValues,
  });

  const { mint, amount, isExisting } = watch();
  const mintKey = usePublicKey(mint);
  const inputBg = { bg: "gray.200", _dark: { bg: "gray.800" } };
  const helpTextColor = { color: "black", _dark: { color: "gray.400" } };

  const clearValues = () => {
    const { isExisting, ...values } = getValues();
    Object.keys(values).forEach((field) => setValue(field as any, null));
  };

  const handleToggleExisting = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearValues();
    clearErrors();
    setValue("isExisting", e.target.checked);
    setInnerIsExisting(e.target.checked);
  };

  const handleMintChange = (mint: string) => {
    setValue("mint", mint);

    if (mint) {
      clearErrors("mint");
    } else {
      setError("mint", { message: "Mint is a required field" });
    }
  };

  const handleOnSubmit = (data: any) => {
    onSubmit({
      type: isExisting && mintKey?.equals(NATIVE_MINT) ? "native" : "token",
      ...data,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleOnSubmit)} style={{ width: "100%" }}>
      <Stack w="full" alignItems="start" gap={8} spacing={0}>
        <Stack direction="row" justifyContent="center" alignItems="center">
          <Switch
            size="lg"
            colorScheme="primary"
            isChecked={isExisting}
            onChange={handleToggleExisting}
          />
          <Text>Use existing token</Text>
        </Stack>
        <Stack w="full" alignItems="start" gap={6} spacing={0}>
          {isExisting ? (
            <FormControl isInvalid={!!errors.mint?.message}>
              <FormLabel htmlFor="mint">
                {isExisting ? "Mint" : "Purchase Mint"}
              </FormLabel>
              <MintSelect value={watch("mint")} onChange={handleMintChange} />
              {!errors.mint?.message ? (
                <FormHelperText fontSize="xs" {...helpTextColor}>
                  {isExisting
                    ? "The mint of the existing token to use for this permission."
                    : "The mint that should be used to purchase this token."}
                  &nbsp;If you want users using SOL, use&nbsp;
                  <Text
                    color="primary.500"
                    as="span"
                    cursor="pointer"
                    onClick={() => handleMintChange(NATIVE_MINT.toString())}
                  >
                    {NATIVE_MINT.toString()}
                  </Text>
                </FormHelperText>
              ) : (
                <FormErrorMessage fontSize="xs" textTransform="capitalize">
                  <Icon as={RiErrorWarningFill} mr={2} fontSize="1.3rem" />
                  <Text>
                    {errors.mint.message}. If you want users using SOL,
                    use&nbsp;
                    <Text
                      color="primary.500"
                      as="span"
                      cursor="pointer"
                      onClick={() => handleMintChange(NATIVE_MINT.toString())}
                    >
                      {NATIVE_MINT.toString()}
                    </Text>
                  </Text>
                </FormErrorMessage>
              )}
            </FormControl>
          ) : (
            <>
              <Text fontSize="xs">
                We&apos;ll create a token for you thats bonded to SOL, via a
                stable curve, with 5% buy royalties. If you want a more advanced
                token/curve please{" "}
                <Link
                  color="primary.500"
                  isExternal
                  href={routes.fullyManagedLaunchpad.path}
                >
                  launch one.
                </Link>
              </Text>
              <FormControlWithError
                id="startingPrice"
                label="Starting Price"
                errors={errors}
                help="The starting price in SOL of the token. The price will increase as
                    more tokens are purchased"
              >
                <Input
                  id="startingPrice"
                  variant="filled"
                  type="number"
                  fontSize="sm"
                  min={0}
                  step={0.000000000001}
                  {...inputBg}
                  {...register("startingPrice")}
                />
              </FormControlWithError>
            </>
          )}
          <FormControlWithError
            id="amount"
            label="Required Amount"
            errors={errors}
            help="The amount required to hold of this token."
          >
            <Input
              id="amount"
              variant="filled"
              type="number"
              fontSize="sm"
              min={0}
              step={0.000000000001}
              {...inputBg}
              {...register("amount")}
            />
          </FormControlWithError>
          {!isExisting && (
            <FormControl
              display="flex"
              flexDirection="column"
              alignItems="flex-start"
              isInvalid={!!errors.legalDisclosure?.message}
            >
              <Flex alignItems="center">
                <Switch
                  id="legalDisclosure"
                  colorScheme="primary"
                  {...register("legalDisclosure")}
                />
                <FormLabel
                  htmlFor="legalDisclosure"
                  mb="0"
                  ml="4"
                  fontSize="xs"
                >
                  I have read and agree to the{" "}
                  <Link color="primary.500" isExternal href="/terms-of-service.pdf">
                    strata.im Terms of Service
                  </Link>
                </FormLabel>
              </Flex>
              {errors.legalDisclosure?.message && (
                <FormErrorMessage
                  textTransform="capitalize"
                  display="flex"
                  w="full"
                >
                  <Icon as={RiErrorWarningFill} mr={2} fontSize="1.3rem" />
                  {errors.legalDisclosure.message}
                </FormErrorMessage>
              )}
            </FormControl>
          )}
        </Stack>
        <ButtonGroup variant="outline" colorScheme="primary" w="full">
          <Button w="full" onClick={onBack}>
            Back
          </Button>
          <Button
            w="full"
            variant="solid"
            type="submit"
            disabled={isExisting ? !mint || !amount : !amount}
          >
            Next
          </Button>
        </ButtonGroup>
      </Stack>
    </form>
  );
};
