"use client";

import { useSuspenseQuery } from "@apollo/experimental-nextjs-app-support/ssr";
import { Fragment, useTransition } from "react";
import { getSSRPaginationPostsQuery } from "../../lib/operations";
import { PostItem } from "../PostItem";
import { PostActions } from "./PostActions";
import { ErrorBoundary } from "react-error-boundary";

export default function Page() {
  const { data, fetchMore } = useSuspenseQuery(getSSRPaginationPostsQuery, {
    variables: { limit: 2 },
    errorPolicy: "all"
  });
  const hasMorePosts = data.posts.cursor != null;
  const [isPending, startTransition] = useTransition();

  return (
    <Fragment>
      <ul className="max-w-max">
        {data.posts.posts.map((post: any) => {
          return (
            <ErrorBoundary
              key={post.id}
              fallbackRender={({ resetErrorBoundary }) => {
                return (
                  <div className="flex gap-2 flex-col">
                    <span className="text-red-500">Something went wrong</span>
                    <button
                      className="px-2 py-1 bg-red-200 rounded"
                      type="button"
                      onClick={resetErrorBoundary}
                    >
                      Reset
                    </button>
                  </div>
                );
              }}
            >
              <PostItem
                actions={<PostActions post={post} />}
                post={post}
                key={post.id}
              />
            </ErrorBoundary>
          );
        })}
      </ul>
      <button
        className="px-2 py-1 bg-orange-500 disabled:opacity-60 text-white rounded"
        disabled={!hasMorePosts || isPending}
        onClick={() => {
          startTransition(() => {
            fetchMore({ variables: { cursor: data.posts.cursor } });
          });
        }}
      >
        {isPending ? "Fetching more..." : "Fetch more"}
      </button>
    </Fragment>
  );
}
