import { Container } from '@chakra-ui/react';
import type { NextPage } from 'next';
import Head from 'next/head';
import React from 'react';
import { SaleForm } from '../components/form/SaleForm';

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
          <SaleForm />
        </Container>
      </main>
    </div>
  );
};

export default Home;
