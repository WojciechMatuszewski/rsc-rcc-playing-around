import { useMutation } from "@apollo/client";
import { graphql } from "./generated";
import { DeletePostDocument } from "./generated/graphql";

const DeletePostMutation = graphql(`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      id
    }
  }
`);

export const DeletePost = ({ postId }: { postId: string }) => {
  const [deletePost, { loading }] = useMutation(DeletePostDocument, {
    variables: { id: postId },

    update(cache, { data }) {
      if (!data) {
        return;
      }

      const { deletePost } = data;
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
              ...existingPostsData,
              posts: newPosts,
              cursor: existingPostsData.cursor
            };
          }
        }
      });
    }
  });

  return (
    <button
      disabled={loading}
      onClick={() => {
        deletePost();
      }}
      className="btn btn-outline btn-error text-sm btn-xs -ml-1"
    >
      Delete
    </button>
  );
};
