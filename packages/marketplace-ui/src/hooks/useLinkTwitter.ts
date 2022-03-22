import { WebAuth, AuthOptions } from "auth0-js";
import { SITE_URL } from "../constants";

export const auth0Options: AuthOptions = {
  domain: process.env.REACT_APP_AUTH0_DOMAIN || "wumbo.us.auth0.com",
  maxAge: 1,
  clientID:
    process.env.REACT_APP_AUTH0_CLIENT_ID || "GPsjYroOyNKWCScIk2woGZi4kBTGDDTW",
};

function makeId(length: number): string {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export const auth0 = new WebAuth(auth0Options);

export function useLinkTwitter(redirectUri: string = SITE_URL): {
  redirectUri: string;
  execute: () => void;
} {
  const execute = () => {
    const state = makeId(6);
    localStorage.setItem("state", state);
    localStorage.setItem("redirectUri", redirectUri);

    auth0.authorize({
      scope: "openid profile",
      redirectUri,
      responseType: "code",
      prompt: "login",
      state,
    });
  };

  return {
    redirectUri,
    execute,
  };
}
