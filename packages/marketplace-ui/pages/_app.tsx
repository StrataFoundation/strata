import { AppProps } from 'next/app';
import { FC } from 'react';
import { Toaster } from 'react-hot-toast';
import "../components/bufferFill";
import { Header } from "..//components/Header";
import { Footer } from '../components/Footer';
import { Providers } from '../components/Providers';

// Use require instead of import since order matters
require('../styles/globals.css');

const App: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <Providers>
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
};

export default App;
