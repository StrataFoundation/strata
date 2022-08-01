import { FormLabel, FormControl, FormHelperText } from "@chakra-ui/react";
import React from "react";

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
  help,
  children,
  errors,
  ...rest
}: IFormControlWithErrorProps<A>) {
  return (
    <FormControl id={id} {...rest}>
      {label && <FormLabel htmlFor={id}>{label}</FormLabel>}
      {children}
      {(errors[id] || help) && (
        <FormHelperText color={errors[id]?.message && "red.400"}>
          {errors[id]?.message || help}
        </FormHelperText>
      )}
    </FormControl>
  );
}
