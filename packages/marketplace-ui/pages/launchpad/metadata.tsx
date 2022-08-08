import React, { FC } from "react";
import { useRouter } from "next/router";
import { LaunchpadLayout } from "../../src/components/launchpad";

export const Metadata: FC = () => {
  const router = useRouter();
  //@ts-ignore
  const handleOnNext = async () => {
    //@ts-ignore
    alert(`Submit form and get mintKey for redirecting here`);
    router.push("/launchpad/sell-options");
  };

  return (
    <LaunchpadLayout
      heading="Help us understand more about your token."
      subHeading="Please fill out the brief form below:"
      backVisible
      nextDisabled={false}
      onNext={handleOnNext}
    >
      <span>Metadata ShortForm Here</span>
    </LaunchpadLayout>
  );
};

export default Metadata;
