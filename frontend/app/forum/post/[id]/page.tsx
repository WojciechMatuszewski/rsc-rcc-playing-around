import { Suspense } from "react";
import { getClient } from "../../../../lib/apollo";
import { graphql } from "../../generated";
import { GetPostDocument } from "../../generated/graphql";
import { AddComment } from "./AddComment";
import { PostComments } from "./PostComments";
import { PostCommentsUsingNestedQuery } from "./PostCommentsUsingNestedQuery";

const GetPostQuery = graphql(`
  query GetPost($id: ID!) {
    post(id: $id) {
      id
      title
      content
    }
  }
`);

export default async function Page({
  params: { id }
}: {
  params: { id: string };
}) {
  const { data } = await getClient().query({
    query: GetPostDocument,
    variables: { id }
  });

  return (
    <article className="flex flex-col w-full">
      <h2>{data.post.title}</h2>
      <p>{data.post.content}</p>
      <div className="divider" />
      <AddComment postId={id} />
      <div className="mt-4">
        <Suspense fallback={<div className="loading loading-spinner" />}>
          <PostCommentsUsingNestedQuery postId={id} />
          {/* <PostComments postId={id} /> */}
        </Suspense>
      </div>
    </article>
  );
}
