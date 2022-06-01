import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  VStack,
} from "@chakra-ui/react";
import React from "react";
import * as yup from "yup";
import { DefaultValues, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ChatSdk } from "@strata-foundation/chat";
import { useAsyncCallback } from "react-async-hook";
import { useChatSdk } from "../contexts";
import { useErrorHandler, useProvider } from "@strata-foundation/react";
import { SystemProgram } from "@solana/web3.js";
import { sendInstructions } from "@strata-foundation/spl-utils";
import { FormControlWithError } from "./FormControlWithError";
import { useWallet } from "@solana/wallet-adapter-react";

interface IProfileProps {
  username: string;
  imageUrl?: string;
}

const validationSchema = yup.object({
  username: yup.string().required().min(1),
  imageUrl: yup.string(),
});

async function createProfile(
  chatSdk: ChatSdk | undefined,
  args: IProfileProps
): Promise<void> {
  if (chatSdk) {
    const {
      instructions,
      signers,
    } = await chatSdk.initializeProfileInstructions({
      username: args.username,
      imageUrl: args.imageUrl,
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
    await sendInstructions(
      chatSdk.errors || new Map(),
      chatSdk.provider,
      instructions,
      signers
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
  const { disconnect } = useWallet();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = formProps;
  const { execute, loading, error } = useAsyncCallback(createProfile);
  const { chatSdk } = useChatSdk();
  const { awaitingApproval } = useProvider();
  const { handleErrors } = useErrorHandler();

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
                <FormControlWithError
                  id="username"
                  help="A less than 32 character username. This will show as your name in the chat. These must be unique."
                  label="Username"
                  errors={errors}
                >
                  <Input {...register("username")} />
                </FormControlWithError>
                <FormControlWithError
                  id="imageUrl"
                  help="A url to the image to use for your profile"
                  label="Image URL"
                  errors={errors}
                >
                  <Input {...register("imageUrl")} />
                </FormControlWithError>
                <Button
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
