import {
  Alert,
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
  Text,
  VStack,
  Icon,
  Image,
  Flex,
  Divider,
  useDisclosure,
} from "@chakra-ui/react";
import { LoadWalletModal } from "./LoadWalletModal";
import { RiCheckFill } from "react-icons/ri";
import { yupResolver } from "@hookform/resolvers/yup";
import { useWallet } from "@solana/wallet-adapter-react";
import { ChatSdk, IdentifierType, uploadFile } from "@strata-foundation/chat";
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
import { delegateWalletStorage, useLoadDelegate } from "../hooks";
import { useWalletFromIdentifier } from "../hooks/useWalletFromIdentifier";
import { FormControlWithError } from "./FormControlWithError";
import { SeedPhrase } from "./SeedPhrase";

interface IProfileProps {
  username: string;
  image?: File;
  imageUrl?: string;
}

const validationSchema = yup.object({
  username: yup.string().required().max(28),
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
    if (args.image) {
      setProgress("Uploading pfp, this can take up to 3 minutes...");
      const delegateWalletKeypair = delegateWalletStorage.getDelegateWallet(
        chatSdk.provider.wallet.publicKey
      );
      imageUrl = await uploadFile(
        chatSdk.provider,
        args.image,
        delegateWalletKeypair
      );
    }

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

export function CreateProfileModal() {
  const formProps = useForm<IProfileProps>({
    resolver: yupResolver(validationSchema),
    defaultValues: {},
  });
  const { disconnect, publicKey } = useWallet();
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
  const { isOpen: loadWalletIsOpen, onClose, onOpen } = useDisclosure();
  const {
    loading: loadingDelegate,
    loadDelegate,
    needsInit,
    needsTopOff,
    mnemonic,
    error: delegateError,
    loadingNeeds,
  } = useLoadDelegate();

  const { username, image } = watch();

  const { wallet } = useWalletFromIdentifier(username);

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
  }

  useEffect(() => {
    if (needsTopOff && !loadingNeeds) onOpen();
  }, [needsTopOff, loadingNeeds]);

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

      reader.readAsDataURL(image);
    } else {
      setImgUrl(undefined);
    }
  }, [image]);

  if (loadWalletIsOpen) {
    return (
      <LoadWalletModal
        onLoaded={() => {
          disconnect();
          onClose();
        }}
      />
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={() => {
        disconnect();
      }}
      size="lg"
      isCentered
      trapFocus={true}
    >
      <ModalContent borderRadius="xl" shadow="xl">
        <ModalBody>
          <VStack pb={4} pt={4} spacing={4} align="left">
            <VStack spacing={2} align="left">
              <Text fontSize="xl" fontWeight="bold">
                Save your local seed phrase
              </Text>
              { mnemonic && <SeedPhrase mnemonic={mnemonic!} /> }
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
