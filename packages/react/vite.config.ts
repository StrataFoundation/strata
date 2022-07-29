import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        react(),
        dts({
            insertTypesEntry: true,
        }),
    ],
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'MyLib',
            formats: ['es', 'umd'],
            fileName: (format) => `my-lib.${format}.js`,
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'styled-components', 'chakra-ui', '@emotion/react', 'crypto',
                "@apollo/client",
                "@bonfida/spl-name-service",
                "@chakra-ui/icons",
                "@chakra-ui/react",
                "@emotion/react",
                "@emotion/styled",
                "@hookform/resolvers",
                "@project-serum/anchor",
                "@project-serum/serum",
                "@solana/spl-governance",
                "@solana/spl-token",
                "@solana/spl-token-registry",
                "@solana/wallet-adapter-base",
                "@solana/wallet-adapter-react",
                "@solana/wallet-adapter-wallets",
                "@solana/web3.js",
                "@strata-foundation/accelerator",
                "@strata-foundation/fungible-entangler",
                "@strata-foundation/marketplace-sdk",
                "@strata-foundation/spl-token-bonding",
                "@strata-foundation/spl-token-collective",
                "@strata-foundation/spl-utils",
                "@toruslabs/solana-embed",
                "@types/lru-cache",
                "axios",
                "borsh",
                "buffer",
                "dotenv",
                "eventemitter3",
                "framer-motion",
                "fuse.js",
                "graphql",
                "lru-cache",
                "path",
                "query-string",
                "react-async-hook",
                "react-hook-form",
                "react-hot-toast",
                "react-icons",
                "yup"
            ],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    'styled-components': 'styled',
                },
            },
        },
    },
});

