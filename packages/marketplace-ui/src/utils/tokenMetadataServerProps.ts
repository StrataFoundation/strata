import { GetServerSideProps } from "next";

export const mintMetadataServerSideProps: GetServerSideProps = async (
) => {
  return {
    props: {
      name: null,
      description:  null,
      image: null,
    },
  };
};
