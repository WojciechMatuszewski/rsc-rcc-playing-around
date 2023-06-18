"use client";

import { useMutation } from "@apollo/client";
import { graphql } from "../../generated";
import { useRef } from "react";
import { CommentPostDocument } from "../../generated/graphql";

const CommentPostMutation = graphql(`
  mutation CommentPost($postId: ID!, $input: CommentInput!) {
    commentPost(id: $postId, comment: $input) {
      id
      content
      postId
    }
  }
`);

export const AddComment = ({ postId }: { postId: string }) => {
  const [commentPost, { loading }] = useMutation(CommentPostDocument);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await commentPost({
          variables: {
            postId: postId,
            input: {
              content: formData.get("content")
            }
          }
        });
        formRef.current?.reset();
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="content">Comment</label>
        <textarea
          id="content"
          className="textarea textarea-primary"
          name="content"
          placeholder="Comment on the post"
          required
        />
      </div>
      <div className="mt-4">
        <button type="submit" className="btn btn-info">
          Create comment
          {loading ? <span className="loading loading-spinner"></span> : null}
        </button>
      </div>
    </form>
  );
};
