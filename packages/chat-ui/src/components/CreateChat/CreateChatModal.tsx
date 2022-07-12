import React, { useCallback, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  HStack,
  VStack,
  Text,
  Divider,
  Avatar,
  AvatarProps,
} from "@chakra-ui/react";
import { RiCheckLine } from "react-icons/ri";
import { CreateChatStep1 } from "./CreateChatStep1";
import { CreateChatStep2 } from "./CreateChatStep2";
import { CreateChatStep3 } from "./CreateChatStep3";

interface IProgressStepProps extends AvatarProps {
  step: number;
  isActive: boolean;
  isCompleted: boolean;
  isLast?: boolean;
}

const ProgressStep: React.FC<IProgressStepProps> = ({
  step,
  isActive,
  isCompleted,
  isLast,
  ...avatarProps
}) => {
  const nameOrIcon = isCompleted
    ? { icon: <RiCheckLine fontSize="1.2rem" /> }
    : { name: `${step}` };

  const bg = isActive
    ? { bg: "primary.500" }
    : isCompleted
    ? { bg: "green.500" }
    : { bg: "gray.300", _dark: { bg: "gray.800" } };

  const dividerColor = isCompleted
    ? { borderColor: "green.500" }
    : { borderColor: "gray.300", _dark: { borderColor: "gray.800" } };

  return (
    <>
      <Avatar
        ariaLabel={`Progress Step ${step}`}
        {...nameOrIcon}
        {...bg}
        {...avatarProps}
      />
      {!isLast && <Divider {...dividerColor} />}
    </>
  );
};

interface ICreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

enum CreateChatModalStep {
  One,
  Two,
  Three,
}

namespace CreateChatModalStep {
  export const increment = (value: CreateChatModalStep): CreateChatModalStep =>
    value + 1;
  export const decrement = (value: CreateChatModalStep): CreateChatModalStep =>
    value - 1;
}

export const CreateChatModal: React.FC<ICreateChatModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState<CreateChatModalStep>(
    CreateChatModalStep.One
  );

  /* Do Nothing */
  const restrictOnClose = () => {};

  const handleNext = useCallback(() => {
    if (step === CreateChatModalStep.Three) {
      console.log("submit");
    } else {
      setStep(CreateChatModalStep.increment(step));
    }
  }, [step, setStep]);

  const handleBack = useCallback(() => {
    if (step === CreateChatModalStep.One) {
      onClose();
    } else {
      setStep(CreateChatModalStep.decrement(step));
    }
  }, [step, setStep, onClose]);

  return (
    <Modal onClose={restrictOnClose} isOpen={isOpen} size="lg">
      <ModalOverlay />
      <ModalContent pb={5}>
        <ModalHeader textAlign="left">
          <VStack w="full" alignItems="start" gap={0} spacing={0}>
            <Text fontWeight="bold" fontSize="lg">
              Create a Chat
            </Text>
            <Text fontSize="sm" fontWeight="normal">
              This information will help us create your chat...
            </Text>
          </VStack>
        </ModalHeader>
        <ModalBody>
          <HStack w="full" justifyContent="space-between" pb={4}>
            <ProgressStep
              step={CreateChatModalStep.One + 1}
              size="sm"
              isActive={step === CreateChatModalStep.One}
              isCompleted={step > CreateChatModalStep.One}
            />
            <ProgressStep
              step={CreateChatModalStep.Two + 1}
              size="sm"
              isActive={step === CreateChatModalStep.Two}
              isCompleted={step > CreateChatModalStep.Two}
            />
            <ProgressStep
              step={CreateChatModalStep.Three + 1}
              size="sm"
              isActive={step === CreateChatModalStep.Three}
              isCompleted={step > CreateChatModalStep.Three}
              isLast
            />
          </HStack>
          {step === CreateChatModalStep.One && (
            <CreateChatStep1 onBack={handleBack} onNext={handleNext} />
          )}
          {step === CreateChatModalStep.Two && (
            <CreateChatStep2 onBack={handleBack} onNext={handleNext} />
          )}
          {step === CreateChatModalStep.Three && (
            <CreateChatStep3 onBack={handleBack} onNext={handleNext} />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
