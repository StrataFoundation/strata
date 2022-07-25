import React, { useState } from "react";
import {
    Avatar,
    Box,
    Button,
    Center,
    Divider,
    Flex,
    HStack,
    Icon,
    IconButton,
    Input,
    InputGroup,
    InputRightElement,
    Link,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    ScaleFade,
    Text,
    Tooltip,
    useColorModeValue,
    VStack,
  } from "@chakra-ui/react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  Spinner,
  ButtonProps,
  useDisclosure,
  Alert,
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import {
  Swap,
  useTokenBonding,
  useTokenBondingKey,
  useTokenMetadata,
} from "@strata-foundation/react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useChatSdk } from "../contexts";

type BuyMoreTrigger = React.FC<{
  onClick: () => void;
  connected: boolean;
  mint?: PublicKey;
  btnProps?: ButtonProps;
}>;

const DefaultTrigger: BuyMoreTrigger = ({
  onClick,
  connected,
  mint,
  btnProps,
}) => {
  const { metadata } = useTokenMetadata(mint);

  return (
    <Button
      size="sm"
      colorScheme="primary"
      variant="outline"
      onClick={onClick}
      {...btnProps}
    >
      {connected ? `Buy More ${metadata?.data.symbol}` : "Connect Wallet"}
    </Button>
  );
};

export function AddChatButton({
  mint,
  trigger = DefaultTrigger,
  btnProps,
}: {
  mint?: PublicKey;
  trigger?: BuyMoreTrigger;
  btnProps?: ButtonProps;
}) {
  const { isOpen, onToggle, onClose } = useDisclosure();
  const { connected } = useWallet();
  const { result: tokenBondingKey, loading } = useTokenBondingKey(mint, 0);
  const { setVisible } = useWalletModal();
  const { metadata } = useTokenMetadata(mint);
  const { account, loading: loadingBonding } = useTokenBonding(tokenBondingKey);

  function onClick() {
    if (!connected) setVisible(true);
    else {
      onToggle();
    }
  }
  const [readAmt, changeReadAmt] = useState(1)
  function onChangeReadAmt(e:any){
    changeReadAmt(parseFloat(e.target.value))
  }
  const [postAmt, changePostAmt] = useState(1)
  function onChangePostAmt(e:any){
    changePostAmt(parseFloat(e.target.value))
  }

  const [readTok, changeReadTok] = useState("So11111111111111111111111111111111111111112")
  function onChangeReadTok(e:any){
    changeReadTok(e.target.value)
  }
  const [postTok, changePostTok] = useState("So11111111111111111111111111111111111111112")
  function onChangePostTok(e:any){
    changePostTok(e.target.value)
  }

  const [name, changeName] = useState("Test Test UI")
  function onChangeName(e:any){
    changeName(e.target.value)
  }
  function randomIdentifier(): string {
    return Math.random().toString(32).slice(6);
  }

  const { chatSdk } = useChatSdk();
async function handleNewChat(e:any){
    const identifier = randomIdentifier();
    if (chatSdk){
    const {
      chat,
      chatPermissions,
      identifierCertificateMint: chatIdentifierCertificateMint,
    } = await chatSdk.initializeChat({
      identifier,
      name,
      permissions: {
        postPermissionAmount: postAmt,
        defaultReadPermissionAmount: readAmt,
        
        readPermissionKey: new PublicKey(readTok),
        postPermissionKey: new PublicKey(postTok),
      },
    });
    const chatAcc = await chatSdk.getChat(chat);
}
}
  return (
    <>
      {trigger({ mint, connected, onClick, btnProps })}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered trapFocus>
        <ModalOverlay />
        <ModalContent borderRadius="xl" shadow="xl">
          <ModalHeader>Add Chat?</ModalHeader>
          <ModalBody minH="500px">
            
            {account && (
             <Box >
             <form onSubmit={handleNewChat}>
               <VStack spacing={4} align="stretch">
                 <VStack spacing={1} align="left">
                   <Flex justifyContent="space-between">
                     <Text fontSize="xs">Amt of Tokens to Read</Text>
                    
                   </Flex>
                   <InputGroup zIndex={100} size="lg">
                     <Input
                       id="readAmt"
                       placeholder="0"
                       type="number"
                       fontSize="2xl"
                       fontWeight="semibold"
                      
                       min={0}
                       _placeholder={{ color: "gray.200" }}
                       // @ts-ignore
                       onChange={changeReadAmt}
                     
                     />
                   </InputGroup>
                 </VStack> 
                 <VStack spacing={1} align="left">
                   <Flex justifyContent="space-between">
                     <Text fontSize="xs">Amt of Tokens to Post</Text>
                    
                   </Flex>
                   <InputGroup zIndex={100} size="lg">
                     <Input
                       id="postAmt"
                       placeholder="0"
                       type="number"
                       fontSize="2xl"
                       fontWeight="semibold"
                      
                       min={0}
                       _placeholder={{ color: "gray.200" }}
                       // @ts-ignore
                       onChange={changePostAmt}
                     
                     />
                   </InputGroup>
                 </VStack> 
                 <VStack spacing={1} align="left">
                   <Flex justifyContent="space-between">
                     <Text fontSize="xs">Token to Read - make one via link to Strata at bottom</Text>
                    
                   </Flex>
                   <InputGroup zIndex={100} size="lg">
                     <Input
                       id="readTok"
                       placeholder="So11111111111111111111111111111111111111112"
                       type="text"
                       fontSize="2xl"
                       fontWeight="semibold"
                      
                       _placeholder={{ color: "gray.200" }}
                       // @ts-ignore
                       onChange={changeReadTok}
                     
                     />
                   </InputGroup>
                 </VStack> 

                 <VStack spacing={1} align="left">
                   <Flex justifyContent="space-between">
                     <Text fontSize="xs">Token to Post - make one via link to Strata at bottom</Text>
                    
                   </Flex>
                   <InputGroup zIndex={100} size="lg">
                     <Input
                       id="postTok"
                       placeholder="So11111111111111111111111111111111111111112"
                       type="text"
                       fontSize="2xl"
                       fontWeight="semibold"
                      
                       _placeholder={{ color: "gray.200" }}
                       // @ts-ignore
                       onChange={changePostTok}
                     
                     />
                   </InputGroup>
                 </VStack> 

                 <VStack spacing={1} align="left">
                   <Flex justifyContent="space-between">
                     <Text fontSize="xs">Chat Name</Text>
                    
                   </Flex>
                   <InputGroup zIndex={100} size="lg">
                     <Input
                       id="name"
                       placeholder="Test Test UI"
                       type="text"
                       fontSize="2xl"
                       fontWeight="semibold"
                      
                       _placeholder={{ color: "gray.200" }}
                       // @ts-ignore
                       onChange={changeName}
                     
                     />
                   </InputGroup>
                 </VStack> 
                   <Center>
                     <HStack spacing={1} fontSize="14px">
                       <Text>Powered by</Text>
                       <Link
                         color="primary.500"
                         fontWeight="medium"
                         href="https://app.strataprotocol.com/launchpad"
                       >
                         Strata
                       </Link>
                     </HStack>
                   </Center>
               </VStack>
             </form>
           </Box>
            )}
            {loading && <Spinner />}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
