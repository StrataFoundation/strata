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
  var bodyFormData = new FormData();
  bodyFormData.append("grant_type", "client_credentials");
  try {
    const { access_token } = (
      await axios.post(`${process.env.ISSUER}/token`, bodyFormData, {
        headers: {
          authorization: `Basic ${token}`,
        },
      })
    ).data;
    res.status(200).json({ access_token });
  } catch (e) {
    console.log(e);
    res.status(500);
  }
}
