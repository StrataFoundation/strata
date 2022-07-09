import { Container } from '@chakra-ui/react';
import type { NextPage } from 'next';
import Head from 'next/head';
import React from 'react';
import { FixedPriceForm } from '../src/components/form/FixedPriceForm';

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Strata Marketplace</title>
        <meta name="description" content="Marketplace powered by strata protocol" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Container>
          <FixedPriceForm />
        </Container>
      </main>
    </div>
  );
};

export default Home;
