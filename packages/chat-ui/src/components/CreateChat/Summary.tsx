import React from "react";
import { useForm } from "react-hook-form";
import {
  Box,
  Text,
  Code,
  Stack,
  Image,
  ButtonGroup,
  Button,
  Flex,
  Heading,
  Tooltip,
} from "@chakra-ui/react";
import { ICreateChatModalState, ReadPostType } from "./CreateChatModal";
import { INFTFormValues } from "./NFTForm";
import { ITokenFormValues } from "./TokenForm";

interface ISummaryProps {
  state: ICreateChatModalState;
  onBack: () => void;
  onNext: () => void;
}

const LabelCodeValue: React.FC<{ label: string; value?: string | number }> = ({
  label,
  value,
  children,
}) => (
  <Flex gap="2">
    <Code
      alignItems="center"
      fontWeight="bold"
      textTransform="capitalize"
      lineHeight="normal"
      py={1}
      px={2}
      display="flex"
      flexShrink={0}
    >
      {label}:
    </Code>
    {value && (
      <Tooltip label={value}>
        <Text fontSize="lg" isTruncated w="auto">
          {value}
        </Text>
      </Tooltip>
    )}
    {children}
  </Flex>
);

const NFTSummary: React.FC<{
  permissionType: "read" | "post";
  amount: number;
  collectionKey: string;
}> = ({ permissionType, amount, collectionKey }) => (
  <Stack>
    <Box>
      <Text fontWeight="bold" fontSize="md" textTransform="capitalize">
        {permissionType} permission
      </Text>
      <Text fontSize="xs" fontWeight="normal">
        You&apos;ve decided to use an NFT collection.
      </Text>
    </Box>
    <LabelCodeValue label="Hold Amount" value={amount} />
    <LabelCodeValue label="Collection Key" value={collectionKey} />
  </Stack>
);

const TokenSummary: React.FC<{
  permissionType: "read" | "post";
  isExisting: boolean;
  amount: number;
  mint: string;
  startingPrice?: number;
}> = ({ permissionType, isExisting, amount, mint, startingPrice }) => (
  <Stack>
    <Box>
      <Text fontWeight="bold" fontSize="md" textTransform="capitalize">
        {permissionType} permission
      </Text>
      <Text fontSize="xs" fontWeight="normal">
        {isExisting ? (
          <>
            <Text>You&apos;ve decided to use an existing token.</Text>
          </>
        ) : (
          <>
            <Text>You&apos;ve decided to create a new token.</Text>
          </>
        )}
      </Text>
    </Box>
    <LabelCodeValue label="Hold Amount" value={amount} />
    {isExisting ? (
      <LabelCodeValue label="Existing Mint" value={mint} />
    ) : (
      <LabelCodeValue label="Starting Price (In SOL)" value={startingPrice} />
    )}
  </Stack>
);

export const Summary: React.FC<ISummaryProps> = ({ state, onBack, onNext }) => {
  const {
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data: any) => {
    onNext();
  };

  const {
    isSubmitting,
    wizardData: {
      name,
      identifier,
      readType,
      readForm,
      postType,
      postForm,
      imageUrl,
    },
  } = state;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack w="full" alignItems="start" gap={6} spacing={0}>
        <Box>
          <Text fontWeight="bold" fontSize="md">
            Please verify all the information up until this point
          </Text>
          <Text fontSize="xs" fontWeight="normal">
            You&apos;re almost there, one step away from your own gated chat!
          </Text>
        </Box>
        <Stack w="full" gap={6}>
          <Stack>
            <Heading fontSize="lg">Basic Info</Heading>
            <LabelCodeValue label="name" value={name} />
            <LabelCodeValue label="identifier" value={identifier} />
            <LabelCodeValue label="image">
              <Image
                alt={`${identifier}-chat-image`}
                w="80px"
                h="80px"
                src={imageUrl}
              />
            </LabelCodeValue>
          </Stack>
          <Stack gap={8}>
            <Stack>
              {readType === ReadPostType.NFT ? (
                <NFTSummary
                  {...(readForm as INFTFormValues)}
                  permissionType="read"
                />
              ) : (
                <TokenSummary
                  {...(readForm as ITokenFormValues)}
                  permissionType="read"
                />
              )}
            </Stack>
            <Stack>
              {postType === ReadPostType.NFT ? (
                <NFTSummary
                  {...(postForm as INFTFormValues)}
                  permissionType="post"
                />
              ) : (
                <TokenSummary
                  {...(postForm as ITokenFormValues)}
                  permissionType="post"
                />
              )}
            </Stack>
          </Stack>
        </Stack>
        <ButtonGroup
          variant="outline"
          colorScheme="primary"
          w="full"
          isDisabled={isSubmitting}
        >
          <Button w="full" onClick={onBack}>
            Back
          </Button>
          <Button
            w="full"
            variant="solid"
            type="submit"
            isLoading={isSubmitting}
            loadingText="Creating Chat"
          >
            Create Chat
          </Button>
        </ButtonGroup>
      </Stack>
    </form>
  );
};
