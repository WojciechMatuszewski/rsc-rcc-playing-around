import { gql } from "@apollo/client";
import { getClient } from "../../lib/apollo";
import { revalidatePath } from "next/cache";
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
  return (
    <div className="flex gap-2">
      <form
        action={async () => {
          "use server";
          if (shouldFail()) {
            throw new Error("boom");
          }

          await getClient().mutate({
            mutation: downVotePostMutation,
            variables: { id: post.id }
          });

          revalidatePath("/");
        }}
      >
        <button type="submit" className="px-2 py-1 bg-teal-100 rounded">
          Downvotes {post.downVotes}
        </button>
      </form>

      <form
        action={async () => {
          "use server";
          if (shouldFail()) {
            throw new Error("boom");
          }

          await getClient().mutate({
            mutation: upVotePostMutation,
            variables: { id: post.id }
          });

          revalidatePath("/");
        }}
      >
        <button type="submit" className="px-2 py-1 bg-teal-100 rounded">
          Upvotes {post.upVotes}
        </button>
      </form>
      <form
        action={async () => {
          "use server";

          if (shouldFail()) {
            throw new Error("boom");
          }

          await getClient().mutate({
            mutation: deletePostMutation,
            variables: {
              id: post.id
            }
          });

          revalidatePath("/");
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
