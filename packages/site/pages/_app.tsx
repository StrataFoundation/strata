import SEO from "../next-seo.config";
import "../styles/globals.css";
import { FC } from "react";
import "@/utils/bufferFill";
import { AppProps } from "next/app";
import { DefaultSeo } from "next-seo";
import { Toaster } from "react-hot-toast";

import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const App: FC<AppProps> = ({ Component, pageProps }) => (
  <Providers>
    <DefaultSeo {...SEO} />
    <Header />
    <Component {...pageProps} />
    <Toaster
      position="bottom-center"
      containerStyle={{
        margin: "auto",
        width: "420px",
      }}
    />
    <Footer />
  </Providers>
);

export default App;
