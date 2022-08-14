import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { TextEncoder as NodeTextEncoder } from "util";
import {
  toString as uint8arrayToString
} from "uint8arrays";

const NodeAndWebTextEncoder = typeof TextEncoder === "undefined" ? NodeTextEncoder : TextEncoder;

export const AUTH_SIGNATURE_BODY =
  "I am creating an account to use Lit Protocol at {{timestamp}}";

export type MessageSigner = {
  signMessage: (data: Uint8Array, encoding: string) => Uint8Array;
};


export async function getAuthSig(
  publicKey: PublicKey,
  signer:
    | Uint8Array
    | MessageSigner
) {
  const now = new Date().toISOString();
  const body = AUTH_SIGNATURE_BODY.replace("{{timestamp}}", now);

  const data = new NodeAndWebTextEncoder().encode(body);
  let signed: Uint8Array;
  if (signer instanceof Uint8Array) {
    // @ts-ignore
    signed = nacl.sign.detached(data, signer);
  } else {
    try {
      // @ts-ignore
      signed = await signer.signMessage(data, "utf8");
    } catch (e: any) {
      throw new Error(`Error signing lit message. This may be because you are using a Ledger, which does not support signMessage. ${e}`);
    }
  }

  const hexSig = uint8arrayToString(signed, "base16");

  const authSig = {
    sig: hexSig,
    derivedVia: "solana.signMessage",
    signedMessage: body,
    address: publicKey.toBase58(),
  };

  return authSig;
}
