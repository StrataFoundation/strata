import React, { useEffect, useCallback, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  VStack,
  Box,
  Text,
  ButtonGroup,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  Icon,
  Flex,
  HStack,
  Image,
  Divider,
} from "@chakra-ui/react";
import {
  RiCheckLine,
  RiErrorWarningFill,
  RiCheckboxCircleFill,
} from "react-icons/ri";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { randomizeFileName, uploadFiles } from "@strata-foundation/chat";
import { useErrorHandler } from "@strata-foundation/react";
import toast from "react-hot-toast";
import { ICreateChatModalState } from "./CreateChatModal";
import { useChatSdk } from "../../contexts";
import {
  useChatStorageAccountKey,
  useLoadDelegate,
  useWalletFromChatIdentifier,
} from "../../hooks";
import { LongPromiseNotification } from "../LongPromiseNotification";
import { FormControlWithError } from "../form";

interface IBasicInfoProps {
  state: ICreateChatModalState;
  setState: React.Dispatch<Partial<ICreateChatModalState>>;
  onBack: () => void;
  onNext: () => void;
}

const validationSchema = yup
  .object({
    name: yup.string().required().max(28),
    identifier: yup
      .string()
      .required()
      .min(6)
      .max(28)
      .matches(
        /^[a-zA-Z0-9\_]+$/g,
        "must be alphanumeric and not have any spaces"
      ),
    image: yup.mixed(),
    imageUrl: yup.string(),
  })
  .required();

export const BasicInfo: React.FC<IBasicInfoProps> = ({
  state,
  setState,
  onBack,
  onNext,
}) => {
  const { publicKey: connectedWallet } = useWallet();
  const { chatSdk } = useChatSdk();
  const { handleErrors } = useErrorHandler();
  const { result: chatStorage } = useChatStorageAccountKey();
  const hiddenFileInput = useRef<HTMLInputElement>(null);
  const [imgUrl, setImgUrl] = useState<string>();
  const [isValidIdentifier, setIsValidIdentifier] = useState<null | boolean>(
    null
  );

  const { delegateWallet, error: delegateError } = useLoadDelegate();
  handleErrors(delegateError);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    setError,
    clearErrors,
  } = useForm<any>({
    mode: "onChange",
    resolver: yupResolver(validationSchema),
    defaultValues: {
      ...state.wizardData,
    },
  });

  const { name, identifier, image, imageUrl } = watch();
  const { wallet: identifierOwner } = useWalletFromChatIdentifier(identifier);
  const inputBg = { bg: "gray.200", _dark: { bg: "gray.800" } };
  const helpTextColor = { color: "black", _dark: { color: "gray.400" } };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    setValue("image", file || null);
    clearErrors("image");
  };

  const verifyIdentifier = useCallback(
    (
      identifier: string,
      identifierOwner: PublicKey | undefined,
      connectedWallet: PublicKey | null
    ) => {
      if (identifier === "") {
        setIsValidIdentifier(null);
        clearErrors("identifier");
      } else {
        if (identifier.length >= 6) {
          const ownsIdentifier = identifierOwner?.equals(connectedWallet!);
          const isValid = !identifierOwner || ownsIdentifier;
          if (isValid) {
            setIsValidIdentifier(true);
          } else {
            setIsValidIdentifier(false);
            setError("identifier", {
              message: "Chat identifier is already taken!",
            });
          }
        }
      }
    },
    []
  );

  useEffect(() => {
    verifyIdentifier(identifier, identifierOwner, connectedWallet);
  }, [identifier, identifierOwner]);

  const onSubmit = (data: any) => {
    setState({
      wizardData: {
        ...state.wizardData,
        ...data,
      },
    });
    onNext();
  };

  useEffect(() => {
    if (image) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImgUrl((event.target?.result as string) || "");
      };

      reader.readAsDataURL(image);

      if (!imageUrl) {
        const text = `Uploading ${image.name} to SHDW Drive...`;
        randomizeFileName(image);
        const url = `https://shdw-drive.genesysgo.net/${chatStorage}/${image.name}`;
        setValue("imageUrl", url);
        toast.custom(
          (t) => (
            <LongPromiseNotification
              estTimeMillis={2 * 60 * 1000}
              text={text}
              onError={(e) => {
                handleErrors(e);
                toast.dismiss(t.id);
              }}
              exec={async () => {
                await uploadFiles(chatSdk!.provider, [image], delegateWallet);
                return true;
              }}
              onComplete={async () => {
                const images = document.querySelectorAll(`img[src*="${url}"]`);
                images.forEach((image) => {
                  // @ts-ignore
                  image.src = url;
                });
                toast.dismiss(t.id);
              }}
            />
          ),
          {
            duration: Infinity,
          }
        );
      }
    } else {
      setImgUrl(undefined);
    }
  }, [image]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <VStack w="full" alignItems="start" gap={6} spacing={0}>
        <Box>
          <Text fontWeight="bold" fontSize="md">
            Let&apos;s Start with the Basic info
          </Text>
          <Text fontSize="xs" fontWeight="normal">
            What do you want your chat to be called?
          </Text>
        </Box>
        <FormControlWithError
          id="name"
          label="Name"
          errors={errors}
          help="The name that will apper in the sidebar."
        >
          <Input
            id="name"
            variant="filled"
            {...inputBg}
            {...register("name")}
          />
        </FormControlWithError>
        <FormControl isInvalid={!!errors.identifier?.message}>
          <FormLabel htmlFor="identifier">Identifier</FormLabel>
          <InputGroup>
            <Input
              id="identifier"
              variant="filled"
              {...inputBg}
              {...register("identifier")}
            />
            {isValidIdentifier && (
              <InputRightElement>
                <RiCheckLine fontSize="1.5rem" />
              </InputRightElement>
            )}
          </InputGroup>
          {!errors.identifier?.message ? (
            <FormHelperText
              fontSize="xs"
              {...helpTextColor}
              alignItems="center"
              justifyContent="center"
            >
              {isValidIdentifier ? (
                <Flex alignItems="center" color="green.500">
                  <Icon as={RiCheckboxCircleFill} mr={1} fontSize="1.3rem" />
                  <Box>Chat identifier is available!</Box>
                </Flex>
              ) : (
                "A NFT representing ownership of the chat."
              )}
            </FormHelperText>
          ) : (
            <FormErrorMessage fontSize="xs" textTransform="capitalize">
              <Icon as={RiErrorWarningFill} mr={1} fontSize="1.3rem" />
              {errors.identifier.message}
            </FormErrorMessage>
          )}
        </FormControl>
        <FormControl isInvalid={!!errors.image?.message}>
          <FormLabel>Upload Picture</FormLabel>
          <HStack w="full" spacing={4}>
            <Button
              size="sm"
              colorScheme="primary"
              variant="outline"
              onClick={() => hiddenFileInput.current!.click()}
            >
              Choose Image
            </Button>

            {image && (
              <HStack spacing={2} align="center">
                <Image alt={image?.name} w="32px" h="32px" src={imgUrl} />
                <Text color="gray.500">{image?.name}</Text>
                <Icon
                  w="22px"
                  h="22px"
                  color="green.400"
                  as={RiCheckboxCircleFill}
                />
              </HStack>
            )}
          </HStack>
          <input
            id="image"
            type="file"
            accept=".png,.jpg,.gif,.mp4,.svg"
            multiple={false}
            onChange={handleImageChange}
            ref={hiddenFileInput}
            style={{ display: "none" }}
          />
          {!errors.image?.message ? (
            <FormHelperText fontSize="xs" {...helpTextColor}>
              The image that will appear in the sidebar.
            </FormHelperText>
          ) : (
            <FormErrorMessage fontSize="xs" textTransform="capitalize">
              <Icon as={RiErrorWarningFill} mr={2} fontSize="1.3rem" />
              {errors.image.message}
            </FormErrorMessage>
          )}
        </FormControl>
        <ButtonGroup variant="outline" colorScheme="primary" w="full">
          <Button w="full" onClick={onBack}>
            Back
          </Button>
          <Button
            w="full"
            variant="solid"
            type="submit"
            disabled={!name || !isValidIdentifier || (!imageUrl && !image)}
          >
            Next
          </Button>
        </ButtonGroup>
      </VStack>
    </form>
  );
};