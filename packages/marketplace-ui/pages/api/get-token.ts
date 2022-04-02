import { Base64 } from "js-base64";
import type { NextApiRequest, NextApiResponse } from "next";
import request from "request-promise";

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
    const { token_type, access_token } = await request({
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
    console.log({ token_type, access_token });
    res.status(200).json({ access_token });
  } catch (e) {
    console.log(e);
    res.status(500);
  }
}
