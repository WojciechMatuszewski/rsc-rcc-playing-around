"use client";

import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  SuspenseCache
} from "@apollo/client";
import {
  ApolloNextAppProvider,
  NextSSRInMemoryCache,
  SSRMultipartLink
} from "@apollo/experimental-nextjs-app-support/ssr";

// have a function to create a client for you
function makeClient() {
  const httpLink = new HttpLink({
    headers: {
      "x-api-key": process.env.NEXT_PUBLIC_API_KEY
    },
    uri: process.env.NEXT_PUBLIC_API_URL,
    // you can disable result caching here if you want to
    // (this does not work if you are rendering your page with `export const dynamic = "force-static"`)
    fetchOptions: { cache: "no-store" }
  });

  return new ApolloClient({
    // use the `NextSSRInMemoryCache`, not the normal `InMemoryCache`
    cache: new NextSSRInMemoryCache({
      possibleTypes: { Comment: ["PostComment"] },

      // TODO: how do I update the cache?

      typePolicies: {
        // Query: {
        //   fields: {
        //     postComments: {
        //       keyArgs: false,
        //       merge(existing = { comments: [] }, incoming, { args }) {
        //         console.log("postComments on a query", { existing, incoming });
        //         return {
        //           ...incoming,
        //           comments: [...existing.comments, ...incoming.comments]
        //         };
        //       }
        //     }
        //   }
        // },
        Comment: {
          keyFields: ["id"],
          fields: {
            comments: {
              keyArgs: (args, context) => {
                if (!context.variables?.id) {
                  throw new Error("id is required");
                }

                return `comments-${context.variables.id}`;
              },
              merge(existing = { comments: [] }, incoming, { args }) {
                const mergeResult = {
                  ...incoming,
                  comments: [...existing.comments, ...incoming.comments]
                };

                console.log("comments on a comment", {
                  existing,
                  incoming,
                  mergeResult
                });
                return mergeResult;
              }
            }
          }
        }
      }
    }),
    link:
      typeof window === "undefined"
        ? ApolloLink.from([
            // in a SSR environment, if you use multipart features like
            // @defer, you need to decide how to handle these.
            // This strips all interfaces with a `@defer` directive from your queries.
            new SSRMultipartLink({
              stripDefer: true
            }),
            httpLink
          ])
        : httpLink
  });
}

// also have a function to create a suspense cache
function makeSuspenseCache() {
  return new SuspenseCache();
}

// you need to create a component to wrap your app in
export function ApolloProvider({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider
      makeClient={makeClient}
      makeSuspenseCache={makeSuspenseCache}
    >
      {children}
    </ApolloNextAppProvider>
  );
}
