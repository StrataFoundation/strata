import { Icon, IconButton } from "@chakra-ui/react";
import { useErrorHandler } from "@strata-foundation/react";
import React from "react";
import { useAsyncCallback } from "react-async-hook";
import { IoMdAttach } from "react-icons/io";

export function FileAttachment({
  onUpload,
}: {
  onUpload: (files: FileList) => Promise<void>;
}) {
  const hiddenFileInput = React.useRef<HTMLInputElement>(null);
  const { execute, loading, error } = useAsyncCallback(onUpload);
  const { handleErrors } = useErrorHandler();
  handleErrors(error);
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files!;
    try {
      await execute(files);
    } finally {
      if (hiddenFileInput.current) {
        hiddenFileInput.current.value = ""
      }
    }
  };

  return (
    <>
      <input
        multiple
        id="image"
        type="file"
        onChange={handleImageChange}
        ref={hiddenFileInput}
        style={{ display: "none" }}
      />
      <IconButton
        isLoading={loading}
        aria-label="Select Image"
        variant="outline"
        onClick={() => hiddenFileInput.current!.click()}
        icon={<Icon w="24px" h="24px" as={IoMdAttach} />}
      />
    </>
  );
}
