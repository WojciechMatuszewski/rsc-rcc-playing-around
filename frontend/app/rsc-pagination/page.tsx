import { getClient } from "../../lib/apollo";
import { getRSCPaginationPostsQuery } from "../../lib/operations";
import { PostItem } from "../PostItem";
import { InfiniteScroll } from "./InfiniteScroll";
import { PostActions } from "./PostActions";
import { PostActionsErrorBoundary } from "./PostActionsErrorBoundary";

export default async function Page() {
  const { data } = await getClient().query({
    query: getRSCPaginationPostsQuery,
    variables: {
      limit: 2
    }
  });

  return (
    <ul>
      {data.posts.posts.map((post: any) => {
        return (
          <PostItem
            actions={
              <PostActionsErrorBoundary>
                <PostActions post={post} />
              </PostActionsErrorBoundary>
            }
            post={post}
            key={post.id}
          />
        );
      })}
      <InfiniteScroll initialData={data} />
    </ul>
  );
}
