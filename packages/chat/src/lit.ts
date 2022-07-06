import { AnchorProvider, Provider, Wallet } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import {
  toString as uint8arrayToString,
} from "uint8arrays";

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

  const data = new TextEncoder().encode(body);
  let signed: Uint8Array;
  if (signer instanceof Uint8Array) {
    signed = nacl.sign.detached(data, signer);
  } else {
    signed = await signer.signMessage(data, "utf8");
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
