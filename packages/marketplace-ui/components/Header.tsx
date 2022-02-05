import React from "react";
import {
  Image,
  Container,
  Box,
  Center,
  Flex,
  HStack,
  Icon,
  Text,
  Link,
  LinkProps,
  Button,
} from "@chakra-ui/react";
import { disconnect } from "process";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletModalButton } from "./WalletModalButton";

interface IMenuItemProps extends LinkProps {
  isLast?: boolean;
}

const MenuItem: React.FC<IMenuItemProps> = ({
  children,
  isLast = false,
  href = "/",
  ...rest
}) => (
  <Text
    mb={{ base: isLast ? 0 : 8, sm: 0 }}
    mr={{ base: 0, sm: isLast ? 0 : 8 }}
    display="block"
  >
    <Link href={href} {...rest}>
      {children}
    </Link>
  </Text>
);

export const Header: React.FC = () => {
  const { disconnect, connected } = useWallet();
  return (
    <>
      <Center
        zIndex={100}
        position="fixed"
        w="full"
        height="56px"
        alignItems="center"
        color="white"
        bg="black.300"
      >
        <Container
          maxW="container.lg"
          w="full"
          display="flex"
          justifyContent="space-between"
        >
          <Image alt="Strata Marketplace" src="/logo.svg" />
          <Box
            display={{ md: "block" }}
            flexBasis={{ base: "100%", md: "auto" }}
          >
            <HStack
              align="center"
              justify={["center", "space-between", "flex-end", "flex-end"]}
              direction={["column", "row", "row", "row"]}
              pt={[4, 4, 0, 0]}
            >
              {connected && (
                <Button
                  _hover={{ backgroundColor: "black.500" }}
                  variant="ghost"
                  onClick={() => disconnect()}
                >
                  Disconnect
                </Button>
              )}
              <WalletModalButton />
            </HStack>
          </Box>
        </Container>
      </Center>
      <Box height="56px" />
    </>
  );
};
