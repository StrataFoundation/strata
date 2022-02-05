import { Input as ChakraInput, InputProps } from "@chakra-ui/react"

export const Input = (props: InputProps) => {
  return <ChakraInput borderColor="gray.200" {...props} />
}
