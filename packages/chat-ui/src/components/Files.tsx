import { CloseButton, Image, Wrap, WrapItem } from "@chakra-ui/react";
import React, { useMemo } from "react";

const IMAGES = new Set("png,jpg,jpeg,gif,mp4,svg".split(","));

type NamedFile = { name: string; file: string | Blob };

export function Files({
  files,
  onCancelFile,
}: {
  files: NamedFile[];
  onCancelFile?: (file: string | Blob) => void;
}) {
  const linkStyle = {
    color: "#0645AD",
    cursor: "pointer",
  };
  // Use memo here so we don't convert blobs to urls each time
  const components = useMemo(() => {
    return files
      .map(({ file, name }) => {
        const extension = name.split(".").pop();
        if (extension && IMAGES.has(extension)) {
          return {
            key: name,
            el: (
              <Image
                mt={"4px"}
                height="300px"
                src={typeof file == "string" ? file : blobToUrl(file)}
                alt={name}
              />
            ),
            file,
          };
        }
        return {
          key: name,
          el: (
            <a
              style={linkStyle}
              href={typeof file == "string" ? file : blobToUrl(file)}
              rel="noreferrer"
              target="_blank"
            >
              {name}
            </a>
          ),
          file,
        };
      })
      .map(({ key, el, file }) => {
        if (onCancelFile) {
          return (
            <WrapItem key={key}>
              <div style={{ position: "relative" }}>
                {el}
                <CloseButton
                  position="absolute"
                  right="-18px"
                  top="-12px"
                  color="gray.400"
                  _hover={{ color: "gray.600", cursor: "pointer" }}
                  onClick={() => onCancelFile(file)}
                />
              </div>
            </WrapItem>
          );
        }

        return <WrapItem key={key}>{el}</WrapItem>;
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
