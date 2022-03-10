import React, { ReactNode } from "react";
import {
  Box,
  Button,
  Center,
  Container,
  HStack,
  VStack,
  Image,
  Link,
  IconButton,
  useDisclosure,
} from "@chakra-ui/react";
/* import { useWallet } from "@solana/wallet-adapter-react";
import { WalletModalButton } from "@/components/WalletModalButton"; */
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import { DOCS_URL, MARKETPLACE_URL, BLOG_URL } from "@/constants";

const Links = [
  { link: "Docs", href: DOCS_URL },
  { link: "Blog", href: BLOG_URL },
  { link: "Bounties", href: `${MARKETPLACE_URL}/bounties` },
  /*   { link: "Investors", href: "/investors" }, */
];

const NavLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link px={2} py={1} href={href} fontSize="sm">
    {children}
  </Link>
);

export const Header: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  /* const { disconnect, connected } = useWallet(); */

  return (
    <>
      <Box zIndex={100} color="white" bg="black.300" w="full">
        <Center w="full" height="56px" alignItems="center">
          <Container
            maxW="container.lg"
            w="full"
            display="flex"
            justifyContent="space-between"
          >
            <IconButton
              size={"md"}
              bg="black.300"
              icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
              aria-label={"Open Menu"}
              display={{ md: "none" }}
              _active={{
                bg: "black.300",
              }}
              _hover={{
                bg: "black.300",
              }}
              onClick={isOpen ? onClose : onOpen}
            />
            <HStack spacing={8} alignItems={"center"}>
              <Link href="/">
                <Image alt="Strata" src="/logo.svg" />
              </Link>
              <HStack
                as={"nav"}
                spacing={4}
                display={{ base: "none", md: "flex" }}
              >
                {Links.map((link) => (
                  <NavLink key={link.link} href={link.href}>
                    {link.link}
                  </NavLink>
                ))}
              </HStack>
            </HStack>
            <HStack
              align="center"
              justify={["center", "space-between", "flex-end", "flex-end"]}
              direction={["column", "row", "row", "row"]}
              pt="0"
            >
              {/* {connected && (
                <Button
                  size="sm"
                  _hover={{ backgroundColor: "black.500" }}
                  variant="ghost"
                  onClick={() => disconnect()}
                >
                  Disconnect
                </Button>
              )}
              <WalletModalButton /> */}
            </HStack>
          </Container>
        </Center>

        {isOpen ? (
          <Box pb={4} display={{ md: "none" }}>
            <VStack as={"nav"} spacing={4}>
              {Links.map((link) => (
                <NavLink key={link.link} href={link.href}>
                  {link.link}
                </NavLink>
              ))}
            </VStack>
          </Box>
        ) : null}
      </Box>
    </>
  );
};
