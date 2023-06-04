"use client";

import { gql, useMutation } from "@apollo/client";
import { postFragment } from "../../lib/operations";

const upVotePostMutation = gql`
  ${postFragment}
  mutation upVotePost($id: ID!) {
    upVotePost(id: $id) {
      ...postFragment
    }
  }
`;

const downVotePostMutation = gql`
  ${postFragment}
  mutation downVotePost($id: ID!) {
    downVotePost(id: $id) {
      ...postFragment
    }
  }
`;

const deletePostMutation = gql`
  ${postFragment}
  mutation deletePost($id: ID!) {
    deletePost(id: $id) {
      ...postFragment
    }
  }
`;

const shouldFail = () => {
  return Math.random() > 0.5;
};

export const PostActions = ({ post }: { post: any }) => {
  const [upVotePost] = useMutation(upVotePostMutation);
  const [downVotePost] = useMutation(downVotePostMutation);

  /**
   * We have to update the pagination for this one
   */
  const [deletePost] = useMutation(deletePostMutation, {
    update(cache, { data: { deletePost } }) {
      cache.modify({
        fields: {
          posts(
            existingPostsData = { posts: [], cursor: null },
            { readField }
          ) {
            const newPosts = existingPostsData.posts.filter((postRef: any) => {
              return readField("id", postRef) !== deletePost.id;
            });
            return {
              posts: newPosts,
              cursor: existingPostsData.cursor
            };
          }
        }
      });
    }
  });

  return (
    <div className="flex gap-2">
      <form
        action={async () => {
          if (shouldFail()) {
            throw new Error("boom");
          }

          await downVotePost({
            variables: { id: post.id }
          });
        }}
      >
        <button type="submit" className="px-2 py-1 bg-teal-100 rounded">
          Downvotes {post.downVotes}
        </button>
      </form>

      <form
        action={async () => {
          if (shouldFail()) {
            throw new Error("boom");
          }

          /**
           * This will automatically sync with the cache
           */
          await upVotePost({
            variables: { id: post.id }
          });
        }}
      >
        <button type="submit" className="px-2 py-1 bg-teal-100 rounded">
          Upvotes {post.upVotes}
        </button>
      </form>
      <form
        action={async () => {
          if (shouldFail()) {
            throw new Error("boom");
          }

          await deletePost({
            variables: { id: post.id }
          });
        }}
      >
        <button
          type="submit"
          className="px-2 py-1 bg-red-500 rounded text-white"
        >
          Delete
        </button>
      </form>
    </div>
  );
};
