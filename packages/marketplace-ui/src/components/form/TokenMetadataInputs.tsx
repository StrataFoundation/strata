import {
  Text,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Icon,
  Image,
  Textarea,
  Input
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useFormContext, UseFormReturn } from "react-hook-form";
import { FormControlWithError } from "./FormControlWithError";
import { RiCheckFill } from "react-icons/ri";

export interface IMetadataFormProps {
  image: File;
  name: string;
  description: string;
}

export function TokenMetadataInputs() {
  const { register, watch, formState: { errors }, clearErrors, setValue, setError } = useFormContext<IMetadataFormProps>()
  const { image } = watch();

  const [imgUrl, setImgUrl] = useState<string>();
  const hiddenFileInput = React.useRef<HTMLInputElement>(null);

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


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    const sizeKB = file.size / 1024;

    if (sizeKB < 25) {
      // @ts-ignore
      setError("image", {
        type: "manual",
        message: `The file ${file.name} is too small. It is ${Math.round(10 * sizeKB) / 10
          }KB but should be at least 25KB.`,
      });
      return;
    }

    // @ts-ignore
    setValue("image", file || null);
    // @ts-ignore
    clearErrors("image");
  };

  return (
    <>
      <FormControlWithError
        id="name"
        help="The name that will be displayed for this post"
        label="Name"
        errors={errors}
      >
        <Input {...register("name")} />
      </FormControlWithError>
      <FormControl id="image">
        <FormLabel>Photo</FormLabel>
        <HStack w="full" spacing={4}>
          <Button
            size="md"
            colorScheme="orange"
            variant="outline"
            onClick={() => hiddenFileInput.current!.click()}
          >
            Choose
          </Button>
          {image && (
            <HStack spacing={2} align="center">
              <Image alt={image.name} w="32px" h="32px" src={imgUrl} />
              <Text color="gray.500">
                {image.name}
              </Text>
              <Icon w="22px" h="22px" color="green.400" as={RiCheckFill} />
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
            `The image that will be displayed with this post`}
        </FormHelperText>
      </FormControl>
      <FormControlWithError
        id="Description"
        help="The description that will be displayed for this post"
        label="Description"
        errors={errors}
      >
        <Textarea borderColor="gray.200" {...register("description")} />
      </FormControlWithError>
    </>
  );
}
