// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const tokenResponse = await axios.post(
      `${process.env.ISSUER}/userinfo`,
      {},
      {
        headers: {
          authorization: `Bearer ${req.body.access_token}`,
        },
      }
    );
    res.status(200).json({ tokenResponse });
  } catch (e) {
    res.status(401).json(e);
  }
}
