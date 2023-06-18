"use client";

import { useMutation, useSuspenseQuery } from "@apollo/client";
import { FragmentType, graphql, useFragment } from "../../generated";
import {
  PostCommentRepliesDocument,
  PostCommentReplyDocument,
  PostCommentsDocument
} from "../../generated/graphql";
import { MessageCircle } from "react-feather";
import { Suspense, useRef } from "react";

const PostCommentsQuery = graphql(`
  query PostComments($postId: ID!, $limit: Int!, $cursor: String) {
    postComments(postId: $postId, limit: $limit, cursor: $cursor) {
      cursor
      comments {
        id
        ...PostComments_CommentFragment
      }
    }
  }
`);

export const PostComments = ({ postId }: { postId: string }) => {
  const { data, error } = useSuspenseQuery(PostCommentsDocument, {
    variables: {
      postId,
      limit: 10
    }
  });

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <ul className="list-none p-0 m-0">
      {data.postComments.comments.map((comment) => {
        return <Comment key={comment.id} comment={comment} />;
      })}
    </ul>
  );
};

const PostComments_CommentFragment = graphql(`
  fragment PostComments_CommentFragment on Comment {
    id
    postId
    content
  }
`);

const PostCommentsRepliesQuery = graphql(`
  query PostCommentsReplies($commentId: ID!, $limit: Int!, $cursor: String) {
    commentReplies(commentId: $commentId, limit: $limit, cursor: $cursor) {
      cursor
      replies {
        id
        commentId
        content
      }
    }
  }
`);

//   replyComment(id: ID!, comment: ReplyInput!): Reply!

const PostCommentReply = graphql(`
  mutation PostCommentReply($id: ID!, $comment: ReplyInput!) {
    replyComment(id: $id, comment: $comment) {
      id
      commentId
      content
    }
  }
`);

const Comment = ({
  comment
}: {
  comment: FragmentType<typeof PostComments_CommentFragment>;
}) => {
  const { content, id } = useFragment(PostComments_CommentFragment, comment);
  const [commentReply, { loading }] = useMutation(PostCommentReplyDocument);

  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <li>
        <p className="mb-0">{content}</p>
        <button
          className="btn btn-xs btn-ghost -ml-2"
          onClick={() => {
            dialogRef.current?.showModal();
          }}
        >
          Reply <MessageCircle size="14px" />
        </button>
        <Suspense fallback={<div className="loading loading-spinner" />}>
          <CommentReplies commentId={id} />
        </Suspense>
      </li>
      <dialog ref={dialogRef} className="modal" id={`reply-modal-${id}`}>
        <form
          className="modal-box max-w-xl"
          ref={formRef}
          action={async (formData) => {
            await commentReply({
              variables: {
                id,
                comment: {
                  content: formData.get("content")
                }
              }
            });
            formRef.current?.reset();
            dialogRef.current?.close();
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
              Reply
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : null}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
};

const PostCommentReplies = graphql(`
  query PostCommentReplies($commentId: ID!, $limit: Int!, $cursor: String) {
    commentReplies(commentId: $commentId, limit: $limit, cursor: $cursor) {
      cursor
      replies {
        id
        commentId
        content
      }
    }
  }
`);

const CommentReplies = ({ commentId }: { commentId: string }) => {
  const { data } = useSuspenseQuery(PostCommentRepliesDocument, {
    variables: { commentId, limit: 10 }
  });

  return (
    <ul>
      {data.commentReplies.replies.map((reply) => {
        return <li key={reply.id}>{reply.content}</li>;
      })}
    </ul>
  );
};
