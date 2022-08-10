import React from "react";
import { VStack, Box, Text } from "@chakra-ui/react";
import { ICreateChatModalState, ReadPostType } from "./CreateChatModal";
import { TokenForm } from "./TokenForm";
import { NFTForm } from "./NFTForm";

interface IPermissionProps {
  state: ICreateChatModalState;
  setState: React.Dispatch<Partial<ICreateChatModalState>>;
  permissionType: "read" | "post";
  onBack: () => void;
  onNext: () => void;
}

export const Permission: React.FC<IPermissionProps> = ({
  state,
  setState,
  permissionType,
  onBack,
  onNext,
}) => {
  // @ts-ignore
  const nftOrToken = state.wizardData[`${permissionType}Type`];
  const isNFT = nftOrToken === ReadPostType.NFT;
  const isToken = nftOrToken === ReadPostType.Token;
  const wizardKey = `${permissionType}Form` as "readForm" | "postForm";

  const handleOnSubmit = (data: any) => {
    setState({
      ...state,
      wizardData: {
        ...state.wizardData,
        [wizardKey]: data,
      },
    });
    onNext();
  };

  return (
    <VStack w="full" alignItems="start" gap={6} spacing={0}>
      <Box>
        <Text fontWeight="bold" fontSize="md">
          {isToken && (
            <>Which token do you want to use to gate {permissionType} access?</>
          )}
          {isNFT && (
            <>
              What nft collection do you want to use to gate {permissionType}{" "}
              access?
            </>
          )}
        </Text>
        <Text fontSize="xs" fontWeight="normal">
          {isToken &&
            "You can either use an existing token or create a brand new one!"}
          {isNFT && "Add the NFT collection key below"}
        </Text>
      </Box>
      {isToken && (
        <TokenForm
          onBack={onBack}
          onSubmit={handleOnSubmit}
          defaultValues={state.wizardData[wizardKey]}
        />
      )}
      {isNFT && <NFTForm onBack={onBack} onSubmit={handleOnSubmit} />}
    </VStack>
  );
};
