import React, { useEffect, useState } from "react";
import {
  VStack,
  Box,
  Text,
  ButtonGroup,
  Button,
  useRadioGroup,
  Stack,
  Flex,
  Switch,
  HStack,
} from "@chakra-ui/react";
import { RadioCardWithAffordance } from "../form/RadioCard";
import {
  CreateChatStep,
  ICreateChatModalState,
  ReadPostType,
} from "./CreateChatModal";

interface IPermissionTypeProps {
  state: ICreateChatModalState;
  setState: React.Dispatch<Partial<ICreateChatModalState>>;
  defaultValue: undefined | ReadPostType;
  permissionType: "read" | "post";
  onBack: () => void;
  onNext: () => void;
}

export const PermissionType: React.FC<IPermissionTypeProps> = ({
  state,
  setState,
  defaultValue,
  permissionType,
  onBack,
  onNext,
}) => {
  const isPostPermission = permissionType === "post";
  const [selectedOption, setSelectedOption] = useState<
    undefined | ReadPostType
  >(defaultValue);

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "readType",
    value: defaultValue,
    onChange: (x) => {
      setSelectedOption(x as ReadPostType);
      setState({
        ...state,
        wizardData: {
          ...state.wizardData,
          postIsSameAsRead: false,
          ...(isPostPermission
            ? { postPermissions: undefined }
            : { readPermissions: undefined }),
        },
      });
    },
  });

  const group = getRootProps();

  useEffect(() => {
    if (selectedOption) {
      setState({
        ...state,
        wizardData: {
          ...state.wizardData,
          [`${permissionType}Type`]: selectedOption,
        },
      });
    }
  }, [selectedOption, setState]);

  const handleOnToggleSame = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setSelectedOption(undefined);

    setState({
      ...state,
      wizardData: {
        ...state.wizardData,
        postIsSameAsRead: isChecked,
        [`${permissionType}Type`]: undefined,
        ...(isChecked
          ? { postForm: state.wizardData.readForm as any }
          : { postForm: undefined }),
      },
    });
  };

  return (
    <VStack w="full" alignItems="start" gap={6} spacing={0}>
      <Box>
        <Text fontWeight="bold" fontSize="md">
          Set your {permissionType} permissions.
        </Text>
        <Text fontSize="xs" fontWeight="normal">
          How do you want to gate {permissionType}ing messages in
          your chat?
        </Text>
      </Box>
      {state.step === CreateChatStep.PostPermissionsType && (
        <HStack>
          <Switch
            size="lg"
            colorScheme="primary"
            isChecked={state.wizardData.postIsSameAsRead}
            onChange={handleOnToggleSame}
          />
          <Text>Same as read permissions</Text>
        </HStack>
      )}
      <Stack
        {...group}
        w="full"
        direction={{ base: "column", md: "row" }}
        justifyContent="center"
        alignItems={{ base: "center", md: "normal" }}
      >
        {Object.keys(ReadPostType).map((value) => {
          const radio = getRadioProps({ value });

          return (
            //@ts-ignore
            <RadioCardWithAffordance
              key={value}
              {...radio}
              isChecked={selectedOption === value}
            >
              <Flex
                h="full"
                direction={{ base: "row", md: "column" }}
                px={4}
                py={{ base: 2, md: 0 }}
              >
                <Flex
                  flexGrow={1}
                  h="full"
                  w="full"
                  direction="column"
                  textAlign="left"
                  position="relative"
                  gap={4}
                  top={{
                    base: 0,
                    md: -3,
                  }}
                >
                  <Text fontWeight="bold" fontSize="lg" pt={{ base: 0, md: 4 }}>
                    {value}
                  </Text>
                  <Text fontSize="xs">
                    {value === ReadPostType.Token &&
                      `Participants need to hold a certain amount of a token to ${permissionType} messages`}
                    {value === ReadPostType.NFT &&
                      `Participants need to hold a NFT from a certain collection to ${permissionType} messages`}
                  </Text>
                </Flex>
              </Flex>
            </RadioCardWithAffordance>
          );
        })}
      </Stack>
      <ButtonGroup variant="outline" colorScheme="primary" w="full">
        <Button w="full" onClick={onBack}>
          Back
        </Button>
        <Button
          w="full"
          variant="solid"
          onClick={onNext}
          isDisabled={!(selectedOption || state.wizardData.postIsSameAsRead)}
        >
          Next
        </Button>
      </ButtonGroup>
    </VStack>
  );
};
