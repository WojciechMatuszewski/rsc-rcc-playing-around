"use client";

import { useLazyQuery } from "@apollo/client";
import { getRSCPaginationPostsQuery } from "../../lib/operations";
import { PostItem } from "../PostItem";

export const InfiniteScroll = ({ initialData }: { initialData: any }) => {
  const [fetchPosts, { fetchMore, data, error, loading }] = useLazyQuery(
    getRSCPaginationPostsQuery,
    { variables: { limit: 2 } }
  );

  if (error) {
    return <div>error!</div>;
  }

  const posts = data?.posts?.posts ?? [];
  const nextCursor =
    posts.length === 0 ? initialData.posts.cursor : data?.posts?.cursor;

  const hasMorePosts = nextCursor !== null;
  return (
    <>
      {posts.map((post: any) => {
        return <PostItem actions={null} post={post} key={post.id} />;
      })}
      <button
        className="px-2 py-1 bg-orange-500 disabled:opacity-60 text-white rounded"
        disabled={!hasMorePosts || loading}
        onClick={() => {
          const method = posts.length == 0 ? fetchPosts : fetchMore;
          method({ variables: { cursor: nextCursor } });
        }}
      >
        {loading ? "Fetching more..." : "Fetch more"}
      </button>
    </>
  );
};
