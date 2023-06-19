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
      possibleTypes: { Comment: ["PostComment", "CommentReply"] },

      typePolicies: {
        Query: {
          fields: {
            posts: {
              keyArgs: false,
              merge(existing = {}, incoming, { readField }) {
                const existingPosts = existing.posts ?? [];
                const incomingPosts = incoming.posts ?? [];
                const result = {
                  /**
                   * Typename was missing so the fragments did not resolve.
                   */
                  ...incoming,
                  posts: [...existingPosts, ...incomingPosts]
                };
                return result;
              }
            },
            postComments: {
              keyArgs: ["id"],
              merge(existing = {}, incoming, { readField }) {
                const existingComments = existing.comments ?? [];
                const incomingComments = incoming.comments ?? [];
                const result = {
                  /**
                   * Typename was missing so the fragments did not resolve.
                   */
                  ...incoming,
                  comments: [...existingComments, ...incomingComments]
                };
                return result;
              }
            },
            commentReplies: {
              keyArgs: ["commentId"],
              merge(existing = {}, incoming, { readField }) {
                const existingReplies = existing.replies ?? [];
                const incomingReplies = incoming.replies ?? [];
                const result = {
                  /**
                   * Typename was missing so the fragments did not resolve.
                   */
                  ...incoming,
                  replies: [...existingReplies, ...incomingReplies]
                };
                return result;
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
