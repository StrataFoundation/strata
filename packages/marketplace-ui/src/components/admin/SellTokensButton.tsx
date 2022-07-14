import {
  Alert,
  Box,
  Image,
  Button,
  Container,
  Center,
  Stack,
  Text,
  Collapse,
  Flex,
  Input,
  Switch,
  VStack,
} from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";


export const SellTokensButton = () => {
  return (
    <Box bgColor="black.500" color="white" borderRadius="8px" padding="30px">
      <Text fontSize="lg" fontWeight="bold">Sell Existing Token</Text>
      <Text fontSize="md">You already have a token created that you would like to sell.</Text>
      <Button 
          bgColor="black.500" 
          rightIcon={<ArrowForwardIcon color="#f07733"/>} 
          _hover={{ bg: "black.500" }} 
          _active={{ bg: "black.500" }}
          padding="0"
          marginTop="20px"
      >
        Start
      </Button>
    </Box>
  );
};
    