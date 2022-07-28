import React from "react";
import { Divider, Avatar, AvatarProps } from "@chakra-ui/react";
import { RiCheckLine } from "react-icons/ri";

interface IProgressStepProps extends AvatarProps {
  step: number;
  isActive: boolean;
  isCompleted: boolean;
  isLast?: boolean;
}

export const ProgressStep: React.FC<IProgressStepProps> = ({
  step,
  isActive,
  isCompleted,
  isLast,
  ...avatarProps
}) => {
  const nameOrIcon = isCompleted
    ? { icon: <RiCheckLine fontSize="1.2rem" color="white" /> }
    : { name: `${step}` };

  const bg = isActive
    ? { bg: "primary.500" }
    : isCompleted
    ? { bg: "green.500" }
    : { bg: "gray.300", _dark: { bg: "gray.800" } };

  const dividerColor = isCompleted
    ? { borderColor: "green.500" }
    : { borderColor: "gray.300", _dark: { borderColor: "gray.800" } };

  return (
    <>
      <Avatar
        ariaLabel={`Progress Step ${step}`}
        {...nameOrIcon}
        {...bg}
        {...avatarProps}
      />
      {!isLast && <Divider {...dividerColor} />}
    </>
  );
};
