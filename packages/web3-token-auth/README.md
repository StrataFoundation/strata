# Web3 Token Auth middleware

A simple fetch middleware for Solana web3.js that can auth using Bearer tokens.

## Usage

```js
import { Connection } from "@solana/web3.js";
import { tokenAuthFetchMiddleware } from "@strata-foundation/web3-token-auth";

async function getToken(): Promise<string> {
  // Logic to get an auth token
}

const connection = new Connection("...", { 
  fetchMiddleware: tokenAuthFetchMiddleware({
    getToken
  })
})
```

## GenesysGo

The main use case for this was GenesysGo adding auth to the RPC. Here's how to set that up:

### Client Code

If you're using client code (eg React), you'll want to set up a server side endpoint that uses your gengo credentials to get the access token. This way, nobody can abuse your credentials.

If you're using nextjs, you can set an endpoint up at `"/api/get-token"`:

```
ISSUER=https://auth.genesysgo.net/auth/realms/RPCs/protocol/openid-connect
CLIENT_ID=
CLIENT_SECRET=
```

```ts
import { Base64 } from "js-base64";
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

type Data = {
  access_token: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const token = Base64.encode(
    `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
  );
  try {
    const { token_type, access_token } = (
      await axios.post(
        `${process.env.ISSUER}/token`,
        "grant_type=client_credentials",
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${token}`,
          },
        }
      )
    ).data;
    res.status(200).json({ access_token });
  } catch (e) {
    console.log(e);
    res.status(500);
  }
}
```

Then, on the client side, you can do something like this:

```ts
export const getToken = async (url: string) => {
  const req = await fetch("/api/get-token");
  const { access_token }: { access_token: string } = await req.json();
  return access_token;
};

...

    <ConnectionProvider
      endpoint={cluster || endpoint}
      config={{
        fetchMiddleware: tokenAuthFetchMiddleware({
          getToken,
        }),
      }}
    >
     ...
    </ConnectionProvider>
...
```

### NodeJS Code

```ts
import { Connection } from "@solana/web3.js";
import { tokenAuthFetchMiddleware } from "@strata-foundation/web3-token-auth";
import request from "request-promise";
import { Base64 } from "js-base64";

async function getToken(): Promise<string> {
  const token = Base64.encode(
    `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
  );
  const { access_token } = await request({
    uri: `${process.env.ISSUER}/token`,
    json: true,
    method: "POST",
    headers: {
      authorization: `Basic ${token}`,
    },
    form: {
      grant_type: "client_credentials",
    },
  });

  return access_token;
}

const connection = new Connection("...", { 
  fetchMiddleware: tokenAuthFetchMiddleware({
    getToken
  })
})
```
