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
  Text,
  Image,
  Link,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { ProfileButton } from "../../../src/components/ProfileButton";
import React, { ReactNode } from "react";
import { route, routes } from "../../routes";
import { CreateChatModal } from "../CreateChat/CreateChatModal";
import { RiMenuAddLine } from "react-icons/ri";

const NavLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link px={2} py={1} href={href} fontSize="sm">
    {children}
  </Link>
);

export const Header: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isChatOpen,
    onOpen: onChatOpen,
    onClose: onChatClose,
  } = useDisclosure();

  const Links = [
    { link: "My Chats", href: route(routes.chats) },
    {
      link: "Developer Docs",
      href: "https://docs.strataprotocol.com/im/getting_started",
    },
  ];

  const CreateChat = (
    <Button
      onClick={() => onChatOpen()}
      colorScheme="primary"
      variant={isOpen ? "ghost" : "outline"}
      leftIcon={<Icon color="white" as={RiMenuAddLine} />}
      px={8}
    >
      <Text color="white">Create Chat</Text>
    </Button>
  );

  return (
    <>
      <CreateChatModal isOpen={isChatOpen} onClose={onChatClose} />
      <Box zIndex={100} color="white" bg="black.300" w="full">
        <Center w="full" height="56px" alignItems="center">
          <Container
            maxW="container.lg"
            w="full"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
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
                {/* @ts-ignore */}
                <DarkMode>
                  <HStack>
                    {CreateChat}
                    <ProfileButton />
                  </HStack>
                </DarkMode>
              </Flex>
              <Flex justify="center" display={{ base: "flex", md: "none" }}>
                {/* @ts-ignore */}
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
              {CreateChat}
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
