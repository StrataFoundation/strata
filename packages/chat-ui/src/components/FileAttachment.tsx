import { Icon, IconButton } from "@chakra-ui/react";
import { useErrorHandler } from "@strata-foundation/react";
import React from "react";
import { useAsyncCallback } from "react-async-hook";
import { IoMdAttach } from "react-icons/io";

export function FileAttachment({
  onUpload,
}: {
  onUpload: (file: File) => Promise<void>;
}) {
  const hiddenFileInput = React.useRef<HTMLInputElement>(null);
  const { execute, loading, error } = useAsyncCallback(onUpload);
  const { handleErrors } = useErrorHandler();
  handleErrors(error);
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    try {
      await execute(file);
    } finally {
      if (hiddenFileInput.current) {
        hiddenFileInput.current.value = ""
      }
    }
  };

  return (
    <>
      <input
        id="image"
        type="file"
        accept=".png,.jpg,.gif,.mp4,.svg"
        multiple={false}
        onChange={handleImageChange}
        ref={hiddenFileInput}
        style={{ display: "none" }}
      />
      <IconButton
        isLoading={loading}
        size="lg"
        aria-label="Select Image"
        variant="outline"
        onClick={() => hiddenFileInput.current!.click()}
        icon={<Icon w="24px" h="24px" as={IoMdAttach} />}
      />
    </>
  );
}
