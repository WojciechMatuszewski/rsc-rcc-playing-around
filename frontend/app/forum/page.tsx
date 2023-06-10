"use client";

import { useSuspenseQuery } from "@apollo/experimental-nextjs-app-support/ssr";
import { PostList } from "./Post";
import { graphql } from "./generated";
import { PostsDocument } from "./generated/graphql";

const PostsQuery = graphql(`
  query Posts($limit: Int!) {
    posts(limit: $limit) {
      cursor
      ...PostList_PostsFragment
    }
  }
`);

export default function Page() {
  const fetchedData = useSuspenseQuery(PostsDocument, {
    variables: { limit: 10 }
  });

  return (
    <>
      <PostList data={fetchedData.data.posts} />
    </>
  );
}
