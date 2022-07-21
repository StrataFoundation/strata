import React, { useReducer, useCallback, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  HStack,
  VStack,
  Text,
  Box,
  Button,
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { IdentifierType, PermissionType } from "@strata-foundation/chat";
import { useChatSdk } from "../../contexts";
import { ProgressStep } from "./ProgressStep";
import { BasicInfo } from "./BasicInfo";
import { PermissionType as PermissionTypeSelect } from "./PermissionType";
import { Permission } from "./Permission";
import { Summary } from "./Summary";
import { ITokenFormValues } from "./TokenForm";
import { INFTFormValues } from "./NFTForm";
import { NATIVE_MINT } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

interface ICreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export enum CreateChatStep {
  BasicInfo,
  ReadPermissionsType,
  ReadPermissions,
  PostPermissionsType,
  PostPermissions,
  Summary,
}

export namespace CreateChatStep {
  export const prev = (value: CreateChatStep): CreateChatStep => value + -1;
  export const next = (value: CreateChatStep): CreateChatStep => value + 1;
}

export enum ReadPostType {
  Token = "Token",
  NFT = "NFT",
}

export interface ICreateChatModalState {
  step: CreateChatStep;
  isSubmitting: boolean;
  wizardData: {
    name: string;
    identifier: string;
    ownsIdentifier: boolean;
    image: undefined | File;
    imageUrl: undefined | string;
    readType: undefined | ReadPostType;
    postType: undefined | ReadPostType;
    postIsSameAsRead: boolean;
    readForm: Partial<ITokenFormValues> | Partial<INFTFormValues>;
    postForm: Partial<ITokenFormValues> | Partial<INFTFormValues>;
  };
}

export const initialState: ICreateChatModalState = {
  step: CreateChatStep.BasicInfo,
  isSubmitting: false,
  wizardData: {
    name: "",
    identifier: "",
    ownsIdentifier: false,
    image: undefined,
    imageUrl: undefined,
    readType: undefined,
    postType: undefined,
    postIsSameAsRead: false,
    readForm: { isExisting: true },
    postForm: { isExisting: true },
  },
};

export const CreateChatModal: React.FC<ICreateChatModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { connected } = useWallet();
  const { chatSdk } = useChatSdk();
  const { setVisible } = useWalletModal();
  const [state, setState] = useReducer(
    (
      state: ICreateChatModalState,
      newState: Partial<ICreateChatModalState>
    ) => ({
      ...state,
      ...newState,
    }),
    initialState
  );

  const handleClose = () => {
    setState(initialState);
    onClose();
  };

  const handleNext = useCallback(async () => {
    if (state.step === CreateChatStep.Summary) {
      setState({ isSubmitting: true });
      const { name, identifier, ownsIdentifier, readForm, postForm } =
        state.wizardData;

      let identifierOut,
        postPermissionKey =
          postForm.type === "native"
            ? new PublicKey(postForm.mint!)
            : postForm.type === "nft"
            ? new PublicKey(postForm.collectionKey!)
            : undefined,
        postPermissionType = postForm.type,
        postPermissionAmount = postForm.amount,
        readPermissionKey =
          readForm.type === "native"
            ? new PublicKey(readForm.mint!)
            : readForm.type === "nft"
            ? new PublicKey(readForm.collectionKey!)
            : undefined,
        readPermissionType = readForm.type,
        readPermissionAmount = readForm.amount,
        instructions = [];

      //if (!ownsIdentifier) {
      console.log("Claiming identifier...", identifier);
      identifierOut = await chatSdk?.claimIdentifierInstructions({
        type: IdentifierType.Chat,
        identifier,
      });
      instructions.push(identifierOut?.instructions);
      // } else {
      //   what to do if they ownIdentifier
      // }

      if (postForm.type === "token") {
        console.log("Creating post permission token...");
      }

      if (readForm.type === "token") {
        console.log("Creating read permission token...");
      }

      console.log("postPermissionKey", postPermissionKey);
      console.log("postPermissionType", postPermissionType);
      console.log("postPermissionAmount", postPermissionAmount);
      console.log("readPermissionKey", readPermissionKey);
      console.log("readPermissionType", readPermissionType);
      console.log("readPermissionAmount", readPermissionAmount);

      // TODO;
      console.log("submit");
      console.log("Init chat...");
    } else if (
      state.step === CreateChatStep.PostPermissionsType &&
      state.wizardData.postIsSameAsRead
    ) {
      setState({ step: CreateChatStep.Summary });
    } else {
      setState({ step: CreateChatStep.next(state.step) });
    }
  }, [state, setState]);

  const handleBack = useCallback(() => {
    if (state.step === CreateChatStep.BasicInfo) {
      setState(initialState);
      onClose();
    } else if (
      state.step === CreateChatStep.Summary &&
      state.wizardData.postIsSameAsRead
    ) {
      setState({ step: CreateChatStep.PostPermissionsType });
    } else {
      setState({ step: CreateChatStep.prev(state.step) });
    }
  }, [state, setState, onClose]);

  return (
    <Modal onClose={handleClose} isOpen={isOpen} size="lg">
      <ModalOverlay />
      <ModalContent pb={5}>
        <ModalHeader textAlign="left">
          <VStack w="full" alignItems="start" gap={8} spacing={0}>
            <Box>
              <Text fontWeight="bold" fontSize="lg">
                Create a Chat
              </Text>
              <Text fontSize="sm" fontWeight="normal">
                This information will help us create your chat...
              </Text>
            </Box>
            <HStack w="full" justifyContent="space-between" pb={4}>
              <ProgressStep
                step={1}
                size="sm"
                isActive={state.step === CreateChatStep.BasicInfo}
                isCompleted={state.step > CreateChatStep.BasicInfo}
              />
              <ProgressStep
                step={2}
                size="sm"
                isActive={[
                  CreateChatStep.ReadPermissionsType,
                  CreateChatStep.ReadPermissions,
                ].includes(state.step)}
                isCompleted={state.step > CreateChatStep.ReadPermissions}
              />
              <ProgressStep
                step={3}
                size="sm"
                isActive={[
                  CreateChatStep.PostPermissionsType,
                  CreateChatStep.PostPermissions,
                ].includes(state.step)}
                isCompleted={state.step > CreateChatStep.PostPermissions}
                isLast
              />
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalBody>
          {!connected ? (
            <VStack w="full" alignItems="start" gap={6} spacing={0}>
              <Box>
                <Text fontWeight="bold" fontSize="md">
                  No wallet was detected
                </Text>
                <Text fontSize="xs" fontWeight="normal">
                  Please connect a wallet to continue.
                </Text>
              </Box>
              <Button
                variant="outline"
                colorScheme="primary"
                onClick={() => {
                  onClose();
                  setVisible(true);
                }}
              >
                Connect Wallet
              </Button>
            </VStack>
          ) : (
            <>
              {state.step === CreateChatStep.BasicInfo && (
                <BasicInfo
                  state={state}
                  setState={setState}
                  onBack={handleBack}
                  onNext={handleNext}
                />
              )}
              {[
                CreateChatStep.ReadPermissionsType,
                CreateChatStep.PostPermissionsType,
              ].includes(state.step) && (
                <PermissionTypeSelect
                  state={state}
                  setState={setState}
                  permissionType={
                    {
                      [CreateChatStep.ReadPermissionsType]: "read",
                      [CreateChatStep.PostPermissionsType]: "post",
                    }[
                      state.step as
                        | CreateChatStep.ReadPermissionsType
                        | CreateChatStep.PostPermissionsType
                    ] as "read" | "post"
                  }
                  defaultValue={
                    {
                      [CreateChatStep.ReadPermissionsType]:
                        state.wizardData.readType,
                      [CreateChatStep.PostPermissionsType]:
                        state.wizardData.postType,
                    }[
                      state.step as
                        | CreateChatStep.ReadPermissionsType
                        | CreateChatStep.PostPermissionsType
                    ]
                  }
                  onBack={handleBack}
                  onNext={handleNext}
                />
              )}
              {[
                CreateChatStep.ReadPermissions,
                CreateChatStep.PostPermissions,
              ].includes(state.step) && (
                <Permission
                  state={state}
                  permissionType={
                    {
                      [CreateChatStep.ReadPermissions]: "read",
                      [CreateChatStep.PostPermissions]: "post",
                    }[
                      state.step as
                        | CreateChatStep.ReadPermissions
                        | CreateChatStep.PostPermissions
                    ] as "read" | "post"
                  }
                  setState={setState}
                  onBack={handleBack}
                  onNext={handleNext}
                />
              )}
              {state.step === CreateChatStep.Summary && (
                <Summary
                  state={state}
                  onBack={handleBack}
                  onNext={handleNext}
                />
              )}
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
