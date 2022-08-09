import { CloseIcon, HamburgerIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Center,
  Container,
  DarkMode,
  Flex,
  HStack,
  Icon,
  IconButton,
  Image,
  Link, useColorMode, useDisclosure, VStack
} from "@chakra-ui/react";
import { RiMoonLine, RiSunLine } from "react-icons/ri";
import { useWallet } from "@solana/wallet-adapter-react";
import { ProfileButton } from "@/components/ProfileButton";
import React, { ReactNode } from "react";
import { route, routes } from "../../routes";

const NavLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link px={2} py={1} href={href} fontSize="sm">
    {children}
  </Link>
);

export const Header: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();

  const Links = [
    { link: "Chats", href: route(routes.chats) },
    { link: "Launchpad", href: "https://app.strataprotocol.com/launchpad" },
    { link: "Blog", href: "https://blog.strataprotocol.com" },
  ];

  return (
    <>
      <Box
        zIndex={100}
        color="white"
        bg="black.300"
        w="full"
        borderBottom="1px"
        borderBottomColor="black.500"
      >
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
              <Link href={"/"}>
                <Image alt="strata.im" src="/logo.svg" />
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
              <Flex
                justify="center"
                align="center"
                display={{ base: "none", md: "flex" }}
              >
                <DarkMode>
                  <IconButton
                    isRound
                    colorScheme="gray"
                    variant="outline"
                    aria-label="Toggle Dark Mode"
                    icon={
                      colorMode === "light" ? (
                        <Icon as={RiMoonLine} />
                      ) : (
                        <Icon as={RiSunLine} />
                      )
                    }
                    onClick={toggleColorMode}
                  />
                  <ProfileButton />
                </DarkMode>
              </Flex>
              <Flex justify="center" display={{ base: "flex", md: "none" }}>
                <DarkMode>
                  <ProfileButton size="sm" />
                </DarkMode>
              </Flex>
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
