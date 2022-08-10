import React, { useReducer, useCallback, useState, useEffect } from "react";
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

import { useStrataSdks } from "@strata-foundation/react";
import { useChatSdk } from "../../contexts/chatSdk";
import { useDelegateWallet } from "../../hooks/useDelegateWallet";
import { ProgressStep } from "./ProgressStep";
import { BasicInfo } from "./BasicInfo";
import { PermissionType as PermissionTypeSelect } from "./PermissionType";
import { Permission } from "./Permission";
import { Summary } from "./Summary";
import { ITokenFormValues } from "./TokenForm";
import { INFTFormValues } from "./NFTForm";
import { wizardSubmit } from "./wizardSubmit";
import { useRouter } from "next/router";
import { route, routes } from "../../routes";

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
  lastStep: CreateChatStep;
  status: null | "submitting" | "success" | string;
  subStatus: null | string;
  error: null | Error;
  wizardData: {
    name: string;
    identifier: string;
    image: undefined | File;
    imageUrl: undefined | string;
    imageUploaded: boolean;
    readType: undefined | ReadPostType;
    postType: undefined | ReadPostType;
    postIsSameAsRead: boolean;
    readForm: Partial<ITokenFormValues> | Partial<INFTFormValues>;
    postForm: Partial<ITokenFormValues> | Partial<INFTFormValues>;
  };
}

export const initialState: ICreateChatModalState = {
  step: CreateChatStep.BasicInfo,
  lastStep: CreateChatStep.BasicInfo,
  status: null,
  subStatus: null,
  error: null,
  wizardData: {
    name: "",
    identifier: "",
    image: undefined,
    imageUrl: undefined,
    imageUploaded: false,
    readType: undefined,
    postType: undefined,
    postIsSameAsRead: false,
    readForm: { isExisting: false },
    postForm: { isExisting: false },
  },
};

export const CreateChatModal: React.FC<ICreateChatModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { chatSdk } = useChatSdk();
  const router = useRouter();
  const { tokenBondingSdk } = useStrataSdks();
  const { keypair: delegateWallet } = useDelegateWallet();
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
    const isOnSummary = state.step === CreateChatStep.Summary;

    if (
      (!isOnSummary && CreateChatStep.next(state.lastStep)) ==
      CreateChatStep.Summary
    ) {
      setState({ step: CreateChatStep.Summary });
    } else {
      if (isOnSummary) {
        await wizardSubmit({
          sdks: {
            chatSdk,
            tokenBondingSdk,
          },
          data: state,
          delegateWallet,
          setState,
        });
      } else if (
        state.step === CreateChatStep.PostPermissionsType &&
        state.wizardData.postIsSameAsRead
      ) {
        setState({ step: CreateChatStep.Summary, lastStep: state.step });
      } else {
        setState({
          step: CreateChatStep.next(state.step),
          lastStep: state.step,
        });
      }
    }
  }, [state, setState]);

  const handleBack = useCallback(
    (stepOverride?: CreateChatStep) => {
      if (stepOverride && stepOverride in CreateChatStep) {
        setState({ step: stepOverride });
      } else {
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
      }
    },
    [state, setState, onClose]
  );

  useEffect(() => {
    if (state.status === "success") {
      router.push(
        route(routes.chat, {
          id: state.wizardData.identifier,
        }),
        undefined,
        { shallow: true }
      );
      handleClose();
    }
  }, [state.status]);

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
