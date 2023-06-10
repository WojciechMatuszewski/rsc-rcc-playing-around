"use client";

import { useMutation } from "@apollo/client";
import { FormEventHandler, useRef, useTransition } from "react";
import { graphql } from "./generated";
import { CreatePostDocument } from "./generated/graphql";
import { useRouter } from "next/navigation";

const CreatePostMutation = graphql(`
  mutation CreatePost($post: PostInput!) {
    createPost(post: $post) {
      id
      ...PostList_PostFragment
    }
  }
`);

export const AddPost = () => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [createPost, { loading }] = useMutation(CreatePostDocument, {
    update(cache, { data }) {
      if (!data) {
        return;
      }
      const { createPost } = data;

      cache.modify({
        fields: {
          posts(
            existingPostsData = { posts: [], cursor: null },
            { toReference }
          ) {
            return {
              ...existingPostsData,
              posts: [toReference(createPost), ...existingPostsData.posts],
              cursor: existingPostsData.cursor
            };
          }
        }
      });
    },
    onCompleted(data) {
      /**
       * How to handle this state there the next page transition is slow.
       * When should I close the modal? Should I use `useEffect` on the `isPending`?
       */
      startTransition(() => {
        router.push(`/forum/post/${data.createPost.id}`);
      });
    }
  });

  const handleOnDialogOpen = () => {
    formRef.current?.reset();
    dialogRef.current?.showModal();
  };

  const handleOnSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    await createPost({
      variables: {
        post: {
          title: formData.get("title") as string,
          content: formData.get("content") as string,
          author: formData.get("author") as string
        }
      }
    });
  };

  return (
    <>
      <div className="fixed bottom-6 right-12">
        <button className="btn" onClick={handleOnDialogOpen}>
          Add post
        </button>
      </div>
      <dialog ref={dialogRef} id="create-post-modal" className="modal">
        <form
          ref={formRef}
          // We cannot use the `action` prop here since we are overriding the `method`
          method="dialog"
          className="modal-box max-w-xl"
          onSubmit={handleOnSubmit}
        >
          <fieldset disabled={loading || isPending}>
            <button
              onClick={() => {
                dialogRef.current?.close();
              }}
              type="button"
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              ✕
            </button>
            <h2 className="p-0 m-0 mb-6">Create Post</h2>
            <label htmlFor="postAuthor" className="label-text label">
              Post author
            </label>
            <input
              id="postAuthor"
              type="text"
              name="author"
              className="input input-bordered w-full mb-4"
              placeholder="Author"
              required
            />
            <label htmlFor="postTitle" className="label-text label">
              Post title
            </label>
            <input
              id="postTitle"
              type="text"
              name="title"
              className="input input-bordered w-full mb-4"
              placeholder="Title"
              required
            />
            <label htmlFor="postContent" className="label-text label">
              Content
            </label>
            <textarea
              name="content"
              className="textarea textarea-bordered h-24 w-full mb-4 resize-none"
              placeholder="Content of your post"
              required
            ></textarea>
            <div className="flex gap-4">
              <button type="submit" className="btn btn-accent">
                Create post
              </button>
              <div className="dialog-action">
                <button
                  className="btn btn-neutral"
                  type="button"
                  onClick={() => {
                    dialogRef.current?.close();
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </fieldset>
        </form>
      </dialog>
    </>
  );
};
