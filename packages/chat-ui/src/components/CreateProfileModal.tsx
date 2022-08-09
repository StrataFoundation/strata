import {
  Alert, Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack, Icon,
  Image, Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay, ModalProps, Progress, Text, useDisclosure, VStack
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ChatSdk,
  IdentifierType,
  randomizeFileName,
  uploadFiles
} from "@strata-foundation/chat";
import {
  truncatePubkey,
  useErrorHandler,
  useProvider
} from "@strata-foundation/react";
import { sendMultipleInstructions } from "@strata-foundation/spl-utils";
import React, { useCallback, useEffect, useState } from "react";
import { useAsyncCallback } from "react-async-hook";
import { FormProvider, useForm } from "react-hook-form";
import { RiCheckFill } from "react-icons/ri";
import * as yup from "yup";
import { STRATA_KEY } from "../constants/globals";
import { useChatSdk } from "../contexts/chatSdk";
import { useAnalyticsEventTracker } from "../hooks/useAnalyticsEventTracker";
import { useChatStorageAccountKey } from "../hooks/useChatStorageAccountKey";
import { useLoadDelegate } from "../hooks/useLoadDelegate";
import { useUsernameFromIdentifierCertificate } from "../hooks/useUsernameFromIdentifierCertificate";
import { useWalletFromUsernameIdentifier } from "../hooks/useWalletFromUsernameIdentifier";
import { useWalletProfile } from "../hooks/useWalletProfile";
import { FormControlWithError } from "./form/FormControlWithError";
import { LoadWalletModal } from "./LoadWalletModal";

interface IProfileProps {
  username: string;
  image?: File;
  imageUrl?: string;
}

const validationSchema = yup.object({
  username: yup
    .string()
    .required()
    .max(28)
    .matches(
      /^[a-zA-Z0-9_\-]*$/,
      "Must only contain alphanumeric characters, underscores, or dashes."
    ),
  image: yup.mixed(),
  imageUrl: yup.string(),
});

async function createProfile(
  chatSdk: ChatSdk | undefined,
  args: IProfileProps,
  setProgress: (step: string) => void
): Promise<void> {
  if (chatSdk) {
    let imageUrl: string | undefined = args.imageUrl;

    setProgress("Creating your Profile...");
    const {
      instructions: claimInstructions,
      signers: claimSigners,
      output: { certificateMint },
    } = await chatSdk.claimIdentifierInstructions({
      type: IdentifierType.User,
      identifier: args.username,
    });

    const { instructions, signers } =
      await chatSdk.initializeProfileInstructions({
        identifierCertificateMint: certificateMint,
        imageUrl,
        identifier: args.username,
      });

    await sendMultipleInstructions(
      chatSdk.errors || new Map(),
      chatSdk.provider,
      [claimInstructions[0], [...claimInstructions[1], ...instructions]],
      [claimSigners[0], [...claimSigners[1], ...signers]]
    );
  }
}

export function CreateProfileModal(props: Partial<ModalProps>) {
  const formProps = useForm<IProfileProps>({
    resolver: yupResolver(validationSchema),
    defaultValues: {},
  });
  const { publicKey } = useWallet();
  const {
    register,
    handleSubmit,
    watch,
    clearErrors,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = formProps;
  const [step, setStep] = useState("");
  const { execute, loading, error } = useAsyncCallback(createProfile);
  const { chatSdk } = useChatSdk();
  const { awaitingApproval } = useProvider();
  const { handleErrors } = useErrorHandler();
  const {
    isOpen: loadWalletIsOpen,
    onClose,
    onOpen,
  } = useDisclosure({
    defaultIsOpen: true,
  });

  const {
    delegateWallet,
    needsInit,
    error: delegateError,
    loadingNeeds,
    loading: loadingDelegate,
  } = useLoadDelegate();

  const gaEventTracker = useAnalyticsEventTracker();

  const { username, image } = watch();
  const {
    account: profileAccount,
    info: profile,
    loading: loadingProfile,
  } = useWalletProfile(publicKey || undefined);
  const { wallet } = useWalletFromUsernameIdentifier(username);
  const { username: existingUsername } = useUsernameFromIdentifierCertificate(
    profile?.identifierCertificateMint,
    profile?.ownerWallet
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    if (profile) {
      setValue("imageUrl", profile.imageUrl);
    }
  }, [profile, setValue]);

  useEffect(() => {
    if (existingUsername) setValue("username", existingUsername);
  }, [existingUsername, setValue]);

  const userError = wallet && publicKey && !wallet.equals(publicKey) && (
    <Box>
      Username is already in owned by{" "}
      <Link href={`https://explorer.solana.com/${wallet.toBase58()}`}>
        {truncatePubkey(wallet)}
      </Link>
    </Box>
  );

  handleErrors(error, delegateError);

  async function onSubmit(args: IProfileProps): Promise<void> {
    if (!publicKey?.equals(STRATA_KEY) && args.username.length < 6 && !wallet) {
      setError("username", {
        message: "Username must be at least 6 characters.",
      });
      return;
    }
    await execute(chatSdk, args, setStep);
    if (props.onClose) {
      props.onClose();
    }
    gaEventTracker({
      action: "Create Profile",
    });
  }

  useEffect(() => {
    if (props.isOpen && !loadingNeeds && !needsInit) {
      onClose();
    }
  }, [loadingDelegate, props.isOpen, needsInit, onClose, loadingNeeds]);
  const onCloseCallback = useCallback(() => {
    props.onClose && props.onClose();
  }, [props.onClose]);

  const { result: chatStorage } = useChatStorageAccountKey();
  const hiddenFileInput = React.useRef<HTMLInputElement>(null);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    // @ts-ignore
    setValue("image", file || null);
    // @ts-ignore
    clearErrors("image");
  };
  

  const [imgUrl, setImgUrl] = useState<string>();
  useEffect(() => {
    (async () => {
      if (image) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImgUrl((event.target?.result as string) || "");
        };

        reader.readAsDataURL(image);

        if (!imgUrl) {
          setIsUploading(true);
          randomizeFileName(image);
          let innerImageUploaded = false;

          try {
            const uri = await uploadFiles(
              chatSdk!.provider,
              [image],
              delegateWallet
            );

            if (uri && uri.length > 0) {
              setValue("imageUrl", uri[0]);
              innerImageUploaded = true;
            }
          } catch (e) {
            handleErrors(e as Error);
          } finally {
            setIsUploading(false);
            if (!innerImageUploaded) {
              setValue("imageUrl", undefined);
              setValue("image", undefined);
              setImgUrl(undefined);
              setError("image", {
                message: "Image failed to upload, please try again",
              });
              if (hiddenFileInput.current) {
                hiddenFileInput.current.value = "";
              }
            }
          }
        }
      } else {
        setImgUrl(undefined);
      }
    })();
  }, [image]);

  if (props.isOpen && loadWalletIsOpen) {
    return (
      <LoadWalletModal
        isOpen={true}
        onClose={() => {
          props.onClose && props.onClose();

          onClose();
        }}
        onLoaded={() => {
          onClose();
        }}
      />
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={onCloseCallback}
      size="lg"
      isCentered
      trapFocus={true}
      {...props}
    >
      <ModalOverlay />
      <ModalContent borderRadius="xl" shadow="xl">
        <ModalBody>
          <VStack pb={4} pt={4} spacing={4} align="left">
            <FormProvider {...formProps}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Text fontSize="xl" fontWeight="bold" mb={2}>
                  Setup your Profile
                </Text>
                <VStack>
                  <FormControlWithError
                    id="username"
                    help="Your username that will appear in the chat. You own your username. Upon claiming, you will receive a free Cardinal certificate NFT."
                    label="Username"
                    errors={errors}
                  >
                    <Input {...register("username")} />
                  </FormControlWithError>
                  {userError && <Alert status="error">{userError}</Alert>}

                  <FormControl id="image">
                    <FormLabel>Upload Picture</FormLabel>
                    <HStack w="full" spacing={4}>
                      <Button
                        size="md"
                        colorScheme="primary"
                        variant="outline"
                        onClick={() => hiddenFileInput.current!.click()}
                        disabled={isUploading}
                      >
                        Choose Image
                      </Button>

                      {image && (
                        <HStack spacing={2} align="center">
                          <Image
                            alt={image?.name}
                            w="32px"
                            h="32px"
                            src={imgUrl}
                          />
                          <Text color="gray.500">{image?.name}</Text>
                          <Icon
                            w="22px"
                            h="22px"
                            color="green.400"
                            as={RiCheckFill}
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
                    <FormHelperText color={errors.image?.message && "red.400"}>
                      {errors.image?.message ||
                        `The image that will be displayed as your pfp. Note that your first upload to SHDW can take up to 3 minutes depending on Solana confirmation times.`}
                    </FormHelperText>
                    {isUploading && (
                      <Progress
                        size="xs"
                        isIndeterminate
                        colorScheme="orange"
                        mt={2}
                      />
                    )}
                  </FormControl>
                  <Button
                    isDisabled={!!userError}
                    isLoading={loading || isUploading}
                    colorScheme="primary"
                    alignSelf="flex-end"
                    mr={3}
                    type="submit"
                    loadingText={isUploading ? "Uploading" : awaitingApproval ? "Awaiting Approval" : step}
                  >
                    Save
                  </Button>
                </VStack>
              </form>
            </FormProvider>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
