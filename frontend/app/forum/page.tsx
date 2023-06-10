"use client";

import { useSuspenseQuery } from "@apollo/experimental-nextjs-app-support/ssr";
import { PostList } from "./Post";
import { graphql } from "./generated";
import { PostsQueryDocument } from "./generated/graphql";
import { useTransition } from "react";

const PostsQuery = graphql(`
  query PostsQuery($limit: Int!, $cursor: String) {
    posts(limit: $limit, cursor: $cursor) {
      cursor
      ...PostList_PostsFragment
    }
  }
`);

export default function Page() {
  const {
    data: { posts },
    fetchMore
  } = useSuspenseQuery(PostsQueryDocument, {
    variables: { limit: 10 }
  });

  const [isPending, startTransition] = useTransition();
  const handleFetchMore = () => {
    startTransition(() => {
      fetchMore({
        variables: { cursor: posts.cursor }
      });
    });
  };

  return (
    <>
      <PostList data={posts} />
      {posts.cursor != null ? (
        <button
          disabled={isPending}
          type="button"
          onClick={handleFetchMore}
          className="btn btn-neutral mt-4"
        >
          Load more
          {isPending ? <span className="loading loading-spinner" /> : null}
        </button>
      ) : null}
    </>
  );
}
