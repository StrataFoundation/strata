import React from "react";
import {
  FormLabel,
  FormControl,
  FormHelperText,
  FormErrorMessage,
  Icon,
} from "@chakra-ui/react";
import { RiErrorWarningFill } from "react-icons/ri";

export interface IFormControlWithErrorProps<A> {
  children: React.ReactNode;
  errors: any;
  id: string;
  help?: string;
  label?: string;
}
export function FormControlWithError<A>({
  id,
  label,
  help = "",
  children,
  errors,
  ...rest
}: IFormControlWithErrorProps<A>) {
  const helpTextColor = { color: "black", _dark: { color: "gray.400" } };

  return (
    <FormControl id={id} isInvalid={!!errors[id]?.message} {...rest}>
      {label && <FormLabel htmlFor={id}>{label}</FormLabel>}
      {children}
      {!errors[id]?.message ? (
        <FormHelperText fontSize="xs" {...helpTextColor}>
          {help}
        </FormHelperText>
      ) : (
        <FormErrorMessage fontSize="xs" textTransform="capitalize">
          <Icon as={RiErrorWarningFill} mr={1} fontSize="1.3rem" />
          {errors[id].message}
        </FormErrorMessage>
      )}
    </FormControl>
  );
}
