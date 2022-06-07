import { useWalletFromIdentifier } from "../hooks/useWalletFromIdentifier";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent, ModalHeader,
  VStack
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram } from "@solana/web3.js";
import { ChatSdk, IdentifierType } from "@strata-foundation/chat";
import { truncatePubkey, useErrorHandler, useProvider } from "@strata-foundation/react";
import { sendMultipleInstructions } from "@strata-foundation/spl-utils";
import React from "react";
import { useAsyncCallback } from "react-async-hook";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { useChatSdk } from "../contexts";
import { useChatKeyFromIdentifier, useProfile } from "../hooks";
import { FormControlWithError } from "./FormControlWithError";

interface IProfileProps {
  username: string;
  imageUrl?: string;
}

const validationSchema = yup.object({
  username: yup.string().required().min(6).max(28),
  imageUrl: yup.string().max(200),
});

async function createProfile(
  chatSdk: ChatSdk | undefined,
  args: IProfileProps
): Promise<void> {
  if (chatSdk) {
    const {
      instructions: claimInstructions,
      signers: claimSigners,
      output: { certificateMint },
    } = await chatSdk.claimIdentifierInstructions({
      type: IdentifierType.User,
      identifier: args.username
    });

    const { instructions, signers } =
      await chatSdk.initializeProfileInstructions({
        identifierCertificateMint: certificateMint,
        imageUrl: args.imageUrl,
        identifier: args.username
      });
    const {
      output: { delegateWalletKeypair },
      instructions: delInstructions,
      signers: delSigners
    } = await chatSdk.initializeDelegateWalletInstructions({});
    instructions.push(...delInstructions);
    signers.push(...delSigners);
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: chatSdk.wallet.publicKey,
        toPubkey: delegateWalletKeypair!.publicKey,
        lamports: 100000000, // 20000 messages
      })
    );
    await sendMultipleInstructions(
      chatSdk.errors || new Map(),
      chatSdk.provider,
      [claimInstructions[0], [...claimInstructions[1], ...instructions]],
      [claimSigners[0], [...claimSigners[1], ...signers]]
    );
    const existing = localStorage.getItem("delegateWallet");
    const existingObj = existing ? JSON.parse(existing) : {};
    existingObj[chatSdk.wallet.publicKey?.toBase58()] = Array.from(
      delegateWalletKeypair!.secretKey
    );
    localStorage.setItem(
      "delegateWallet",
      JSON.stringify(existingObj)
    );
  }
}

export function CreateProfileModal() {
  const formProps = useForm<IProfileProps>({
    resolver: yupResolver(validationSchema),
    defaultValues: {},
  });
  const { disconnect, publicKey } = useWallet();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = formProps;
  const { execute, loading, error } = useAsyncCallback(createProfile);
  const { chatSdk } = useChatSdk();
  const { awaitingApproval } = useProvider();
  const { handleErrors } = useErrorHandler();

  const { username } = watch();

  const { wallet } = useWalletFromIdentifier(username);

  const userError = wallet && publicKey && !wallet.equals(publicKey) && (
    <Box>
      Username is already in owned by{" "}
      <Link href={`https://explorer.solana.com/${wallet.toBase58()}`}>
        {truncatePubkey(wallet)}
      </Link>
    </Box>
  );
  "";

  handleErrors(error);

  async function onSubmit(args: IProfileProps): Promise<void> {
    await execute(chatSdk, args);
  }

  return (
    <Modal
      isOpen={true}
      onClose={() => {
        disconnect();
      }}
      size="2xl"
      isCentered
      trapFocus={true}
    >
      <ModalContent borderRadius="xl" shadow="xl">
        <ModalHeader>Create Chat Profile</ModalHeader>
        <ModalBody>
          <FormProvider {...formProps}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <VStack>
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Local Wallet</AlertTitle>
                    <AlertDescription>
                      Strata Chat is fully decentralized. In order to avoid
                      asking for approval on every message, we create a wallet
                      stored in your machine$apos;s localStorage that can send
                      messages on your main wallet$apos;s behalf. Creating a
                      profile will also load this wallet with 0.1 Sol to pay for
                      messages (0.000005 SOL each) and file uploads (1 $SHDW per
                      GB)
                    </AlertDescription>
                  </Box>
                </Alert>
                <FormControlWithError
                  id="username"
                  help="A less than 28 character username. This will show as your name in the chat. These must be unique."
                  label="Username"
                  errors={errors}
                >
                  <Input {...register("username")} />
                </FormControlWithError>
                {userError && <Alert status="error">{userError}</Alert>}
                <FormControlWithError
                  id="imageUrl"
                  help="A url to the image to use for your profile"
                  label="Image URL"
                  errors={errors}
                >
                  <Input {...register("imageUrl")} />
                </FormControlWithError>
                <Button
                  isDisabled={!!userError}
                  isLoading={loading}
                  colorScheme="primary"
                  alignSelf="flex-end"
                  mr={3}
                  type="submit"
                  loadingText={
                    awaitingApproval ? "Awaiting Approval" : "Loading"
                  }
                >
                  Save
                </Button>
              </VStack>
            </form>
          </FormProvider>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
