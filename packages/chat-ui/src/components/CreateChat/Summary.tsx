import React, { useEffect, useState } from "react";
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
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import {
  CreateChatStep,
  ICreateChatModalState,
  ReadPostType,
} from "./CreateChatModal";
import { INFTFormValues } from "./NFTForm";
import { ITokenFormValues } from "./TokenForm";

interface ISummaryProps {
  state: ICreateChatModalState;
  onBack: (step?: CreateChatStep | any) => void;
  onNext: () => void;
}

const LabelCodeValue: React.FC<React.PropsWithChildren<{ label: string; value?: string | number }>> = ({
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
      <Text fontSize="lg" noOfLines={1} w="auto">
        {value}
      </Text>
    )}
    {children}
  </Flex>
);

const NFTSummary: React.FC<{
  permissionType: "read" | "post";
  amount: number;
  collectionKey: string;
  onBack: (step?: CreateChatStep | any) => void;
}> = ({ permissionType, amount, collectionKey, onBack }) => (
  <Stack>
    <Box>
      <Heading fontWeight="bold" fontSize="md" textTransform="capitalize">
        {permissionType} permission{" "}
        <Button
          variant="link"
          colorScheme="primary"
          size="xs"
          onClick={() =>
            onBack(
              {
                read: CreateChatStep.ReadPermissions,
                post: CreateChatStep.PostPermissions,
              }[permissionType]
            )
          }
        >
          Edit
        </Button>
      </Heading>
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
  onBack: (step?: CreateChatStep | any) => void;
}> = ({ permissionType, isExisting, amount, mint, startingPrice, onBack }) => (
  <Stack>
    <Box>
      <Heading fontWeight="bold" fontSize="md" textTransform="capitalize">
        {permissionType} permission{" "}
        <Button
          variant="link"
          colorScheme="primary"
          size="xs"
          onClick={() =>
            onBack(
              {
                read: CreateChatStep.ReadPermissions,
                post: CreateChatStep.PostPermissions,
              }[permissionType]
            )
          }
        >
          Edit
        </Button>
      </Heading>
      <Text fontSize="xs" fontWeight="normal">
        {isExisting ? (
          <Text>You&apos;ve decided to use an existing token.</Text>
        ) : (
          <Text>You&apos;ve decided to create a new token.</Text>
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
  //@ts-ignore
  const [imgUrl, setImgUrl] = useState<string>();
  const { handleSubmit } = useForm();
  const onSubmit = (data: any) => onNext();
  const {
    status,
    subStatus,
    error,
    wizardData: {
      name,
      identifier,
      description,
      readType,
      readForm,
      postType,
      postForm,
      image,
      imageUrl,
    },
  } = state;

  const isSubmitting = status === "submitting";

  useEffect(() => {
    if (image) {
      //@ts-ignore
      const reader = new FileReader();
      reader.onload = (event) => {
        setImgUrl((event.target?.result as string) || "");
      };

      reader.readAsDataURL(image);
    } else {
      setImgUrl(undefined);
    }
  }, [image]);

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
            <Heading fontSize="lg">
              Basic Info{" "}
              <Button
                variant="link"
                colorScheme="primary"
                size="xs"
                onClick={() => onBack(CreateChatStep.BasicInfo)}
              >
                Edit
              </Button>
            </Heading>
            <LabelCodeValue label="name" value={name} />
            {/* @ts-ignore */}
            <LabelCodeValue label="domain" value={identifier + ".chat"} />
            <LabelCodeValue label="description" value={description} />
            {/* @ts-ignore */}
            <LabelCodeValue label="image">
              <Image
                alt={`${identifier}-chat-image`}
                w="80px"
                h="80px"
                src={imgUrl || imageUrl}
              />
            </LabelCodeValue>
          </Stack>
          <Stack gap={8}>
            <Stack>
              {readType === ReadPostType.NFT ? (
                <NFTSummary
                  {...(readForm as INFTFormValues)}
                  onBack={onBack}
                  permissionType="read"
                />
              ) : (
                <TokenSummary
                  {...(readForm as ITokenFormValues)}
                  onBack={onBack}
                  permissionType="read"
                />
              )}
            </Stack>
            <Stack>
              {postType === ReadPostType.NFT ? (
                <NFTSummary
                  {...(postForm as INFTFormValues)}
                  onBack={onBack}
                  permissionType="post"
                />
              ) : (
                <TokenSummary
                  {...(postForm as ITokenFormValues)}
                  onBack={onBack}
                  permissionType="post"
                />
              )}
            </Stack>
          </Stack>
        </Stack>
        {subStatus && (
          <Text color="primary.500" fontWeight="bold">
            {subStatus}&nbsp;
          </Text>
        )}
        {isSubmitting && (
          <Progress
            size="xs"
            isIndeterminate
            colorScheme="orange"
            mt={2}
            w="full"
          />
        )}
        {error && (
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="160px"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={2} mb={1} fontSize="lg">
              Failed to create chat!
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              {error.message}
              <br />
              Please try again...
            </AlertDescription>
          </Alert>
        )}
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
