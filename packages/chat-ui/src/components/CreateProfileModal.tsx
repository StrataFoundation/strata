import {
  Alert,
  ModalProps,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
  Icon,
  Image,
  Divider,
  useDisclosure,
} from "@chakra-ui/react";
import { Flex } from "./MyFlex";
import { LoadWalletModal } from "./LoadWalletModal";
import { RiCheckFill } from "react-icons/ri";
import { yupResolver } from "@hookform/resolvers/yup";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ChatSdk,
  IdentifierType,
  randomizeFileName,
  uploadFiles,
} from "@strata-foundation/chat";
import {
  truncatePubkey,
  useErrorHandler,
  useProvider,
} from "@strata-foundation/react";
import { sendMultipleInstructions } from "@strata-foundation/spl-utils";
import React, { useEffect, useState } from "react";
import { useAsyncCallback } from "react-async-hook";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { useChatSdk } from "../contexts";
import {
  useChatStorageAccountKey,
  useLoadDelegate,
  useUsernameFromIdentifierCertificate,
  useWalletProfile,
  useAnalyticsEventTracker,
} from "../hooks";
import { useWalletFromIdentifier } from "../hooks/useWalletFromIdentifier";
import { FormControlWithError } from "./FormControlWithError";
import { CopyBlackBox } from "./CopyBlackBox";
import toast from "react-hot-toast";
import { LongPromiseNotification } from "./LongPromiseNotification";

interface IProfileProps {
  username: string;
  image?: File;
  imageUrl?: string;
}

const validationSchema = yup.object({
  username: yup
    .string()
    .required()
    .min(6)
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
    defaultIsOpen: false,
  });

  const {
    delegateWallet,
    needsTopOff,
    mnemonic,
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
  const { wallet } = useWalletFromIdentifier(username);
  const { username: existingUsername } = useUsernameFromIdentifierCertificate(
    profile?.identifierCertificateMint,
    profile?.ownerWallet
  );

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
  ("");

  handleErrors(error, delegateError);

  async function onSubmit(args: IProfileProps): Promise<void> {
    await execute(chatSdk, args, setStep);
    if (props.onClose) {
      props.onClose();
    }
    gaEventTracker({
      action: "Create Profile",
    });
  }

  useEffect(() => {
    if (loadingDelegate || (props.isOpen && !loadingNeeds && needsTopOff)) {
      onOpen();
    } else {
      onClose();
    }
  }, [
    loadingDelegate,
    props.isOpen,
    needsTopOff,
    onOpen,
    onClose,
    loadingNeeds,
  ]);

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
    if (image) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImgUrl((event.target?.result as string) || "");
      };

      const text = `Uploading ${image.name} to SHDW Drive...`;
      reader.readAsDataURL(image);
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
    } else {
      setImgUrl(undefined);
    }
  }, [image]);

  if (loadWalletIsOpen) {
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
      onClose={() => {
        props.onClose && props.onClose();
      }}
      size="lg"
      isCentered
      trapFocus={true}
      {...props}
    >
      <ModalOverlay />
      <ModalContent borderRadius="xl" shadow="xl">
        <ModalBody>
          <VStack pb={4} pt={4} spacing={4} align="left">
            <VStack spacing={2} align="left">
              <Text fontSize="xl" fontWeight="bold">
                Save your Chat Wallet info
              </Text>
              {delegateWallet && (
                <CopyBlackBox
                  pb={1}
                  pt={1}
                  fontSize="sm"
                  text={delegateWallet.publicKey.toBase58()}
                />
              )}
              {mnemonic && <CopyBlackBox text={mnemonic} />}
            </VStack>

            <FormProvider {...formProps}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Text fontSize="xl" fontWeight="bold">
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
                  </FormControl>
                  <Flex align="center" w="full">
                    <Divider borderColor="gray.500" />
                    <Text padding="2">OR</Text>
                    <Divider borderColor="gray.500" />
                  </Flex>
                  <FormControlWithError
                    id="imageUrl"
                    help="A url to the image to use for your profile (ex: right click your PFP on twitter and copy image URL)"
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
                    loadingText={awaitingApproval ? "Awaiting Approval" : step}
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
