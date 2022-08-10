import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import React, { ReactNode } from "react";

const holaplex = new HttpLink({
  uri: "https://graph.holaplex.com/v1",
});
const vybe = new HttpLink({
  uri: "https://api.vybenetwork.com/v1/graphql",
});
const strata = new HttpLink({
  uri: "https://prod-api.teamwumbo.com/graphql",
});

const VYBE_TOKEN =
  process.env.NEXT_PUBLIC_VYBE_TOKEN || process.env.REACT_APP_VYBE_TOKEN;

const client = new ApolloClient({
  cache: new InMemoryCache({
    resultCaching: false,
  }),
  link: ApolloLink.concat(
    new ApolloLink((operation, forward) => {
      // add the authorization to the headers
      const token = VYBE_TOKEN;
      operation.setContext({
        headers: {
          authorization: token ? token : "",
        },
      });
      return forward(operation);
    }),
    ApolloLink.split(
      (operation) => operation.getContext().clientName === "vybe",
      vybe, //if above
      ApolloLink.split(
        (operation) => operation.getContext().clientName === "strata",
        strata,
        holaplex
      )
    )
  ),
});

export const GraphqlProvider = ({
  children,
}: {
  children: ReactNode | ReactNode[];
}) => {
  // @ts-ignore
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
