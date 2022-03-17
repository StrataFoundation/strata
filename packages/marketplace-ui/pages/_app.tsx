import { AppProps } from 'next/app';
import { FC } from 'react';
import { Toaster } from 'react-hot-toast';
import "../src/components/bufferFill";
import { Header } from "../src/components/Header";
import { Footer } from '../src/components/Footer';
import { Providers } from '../src/components/Providers';
import { BrowserView, MobileView } from "react-device-detect";

// Use require instead of import since order matters
require('../styles/globals.css');
require("react-circular-progressbar/dist/styles.css");
require("@solana/wallet-adapter-react-ui/styles.css");

const App: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <Providers>
      <Header />
      <Component {...pageProps} />
      <BrowserView>
        <Toaster
          position="bottom-left"
          containerStyle={{
            width: "420px",
          }}
        />
      </BrowserView>
      <MobileView>
        <Toaster
          position="bottom-center"
          containerStyle={{
            margin: "0 auto",
            width: "90%",
            maxWidth: "420px",
          }}
        />
      </MobileView>
      <Footer />
    </Providers>
  );
};

export default App;
