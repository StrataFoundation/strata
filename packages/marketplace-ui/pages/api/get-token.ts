import { Base64 } from "js-base64";
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

import Cors from "cors";
import initMiddleware from "../../src/utils/initMiddleware";

const domain =
  process.env.NODE_ENV === "development"
    ? "localhost:.*$"
    : "strataprotocol.com$";
// Initialize the cors middleware
const cors = initMiddleware(
  // You can read more about the available options here: https://github.com/expressjs/cors#configuration-options

  Cors({
    // Only allow requests with GET
    methods: ["GET"],
    origin: [
      new RegExp(`\.${domain}`),
      new RegExp(domain),
    ],
  })
);

type Data = {
  access_token: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await cors(req, res);

  const token = Base64.encode(
    `${process.env.NEXT_PUBLIC_CLIENT_ID}:${process.env.NEXT_PUBLIC_CLIENT_SECRET}`
  );
  try {
    const { access_token } = (
      await axios.post(
        `${process.env.NEXT_PUBLIC_ISSUER}/token`,
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
