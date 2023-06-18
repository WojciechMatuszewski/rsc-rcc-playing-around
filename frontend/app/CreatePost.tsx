"use client";

import { gql, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { postFragment } from "../lib/operations";

const createPostMutation = gql`
  ${postFragment}
  mutation createPost($post: PostInput!) {
    createPost(post: $post) {
      ...postFragment
    }
  }
`;

export const CreatePost = () => {
  const [mutate, { loading }] = useMutation(createPostMutation, {
    /**
     * Refetching will re-execute the query.
     * This will work for simple non-paginated queries.
     *
     * For paginated queries, this will cause the query to display only the initially loaded items,
     * and not "refresh" the query at the state where the user is in pagination.
     */
    // refetchQueries: [getSSRPaginationPostsQuery]
    update(cache, { data: { createPost } }) {
      cache.modify({
        fields: {
          posts(existingPostsData = { posts: [], cursor: null }) {
            const newPostRef = cache.writeFragment({
              data: createPost,
              fragment: postFragment
            });
            return {
              posts: [newPostRef, ...existingPostsData.posts],
              cursor: existingPostsData.cursor
            };
          }
        }
      });
    }
  });
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="max-w-md mb-6 flex gap-2 flex-col"
      action={async (formData) => {
        await mutate({
          variables: {
            post: {
              title: formData.get("title"),
              author: formData.get("author"),
              content: formData.get("content")
            }
          }
        });
        formRef.current?.reset();
        /**
         * Refresh will refresh RSC
         */
        router.refresh();
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="title">Title</label>
        <input
          type="text"
          className="input input-primary"
          name="title"
          id="title"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="author">Author</label>
        <input
          type="text"
          className="input input-primary"
          name="author"
          id="author"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="content">Content</label>
        <textarea
          id="content"
          className="textarea textarea-primary"
          name="content"
          required
        />
      </div>

      <button
        disabled={loading}
        type="submit"
        className="bg-blue-400 rounded px-2 py-1 text-white self-start disabled:bg-gray-400"
      >
        Create
      </button>
    </form>
  );
};
