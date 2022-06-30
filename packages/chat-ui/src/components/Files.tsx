import {
  CloseButton, Image,
  Wrap,
  WrapItem
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import filterEmoji from "src/constants/filterEmoji";

const IMAGES = new Set("png,jpg,jpeg,gif,mp4,svg".split(","));

export function Files({
  files,
  onCancelFile,
}: {
  files: { name: string; file: (string | Blob) }[];
  onCancelFile?: (file: string | Blob) => void;
}) {
  const linkStyle = {
    color: "#0645AD",
    cursor: "pointer",
  };
  // Use memo here so we don't convert blobs to urls each time
  const components = useMemo(() => {
    return files
      .map(({ file, name }, i) => {
        if (typeof file === "string") {
          const extension = file.split(".").pop();
          if (extension && IMAGES.has(extension)) {
            return {
              key: file,
              el: <Image mt={"4px"} height="300px" src={file} alt={name} />,
              file,
            };
          }
          return {
            key: file,
            el: (
              <a style={linkStyle} href={file} rel="noreferrer" target="_blank">
                {name}
              </a>
            ),
            file,
          };
        } else {
          const blob = file as Blob;
          const extension = blob.type.split("/").pop();
          if (extension && IMAGES.has(extension)) {
            return {
              key: i,
              el: (
                <Image
                  mt={"4px"}
                  height="300px"
                  src={blobToUrl(blob)}
                  alt={name}
                />
              ),
              file,
            };
          }
          return {
            key: i,
            el: (
              <a style={linkStyle} href={blobToUrl(blob)} rel="noreferrer" target="_blank">
                {name}
              </a>
            ),
            file,
          };
        }
      })
      .map(({ key, el, file }) => {
        if (onCancelFile) {
          return (
            <WrapItem key={key}>
              <div style={{ position: "relative" }}>
                {el}
                <CloseButton
                  position="absolute"
                  right="-22px"
                  top="-12px"
                  color="gray.400"
                  _hover={{ color: "gray.600", cursor: "pointer" }}
                  onClick={() => onCancelFile(file)}
                />
              </div>
            </WrapItem>
          );
        }

        return <WrapItem key={el.key}>{el}</WrapItem>;
      });
  }, [onCancelFile, files]);

  if (files.length == 0) {
    return null;
  }

  return <Wrap className="files">{components}</Wrap>;
}

function blobToUrl(blob: Blob | undefined): string | undefined {
  if (blob) {
    const urlCreator = window.URL || window.webkitURL;
    return urlCreator.createObjectURL(blob);
  }
}
