import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { registerApolloClient } from "@apollo/experimental-nextjs-app-support/rsc";

export const { getClient } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_API_KEY
      },
      uri: process.env.NEXT_PUBLIC_API_URL
    })
  });
});
