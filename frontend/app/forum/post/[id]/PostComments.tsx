"use client";

import { useMutation, useSuspenseQuery } from "@apollo/client";
import { FragmentType, graphql, useFragment } from "../../generated";
import {
  PostCommentRepliesDocument,
  PostCommentReplyDocument,
  PostCommentsDocument
} from "../../generated/graphql";
import { MessageCircle } from "react-feather";
import { Suspense, useRef, useTransition } from "react";

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
  const { data, error, fetchMore } = useSuspenseQuery(PostCommentsDocument, {
    variables: {
      postId,
      limit: 2
    }
  });
  const [isPending, startTransition] = useTransition();

  if (error) {
    return <div>Error: {error.message}</div>;
  }
  const canLoadMore = data.postComments.cursor !== null;

  return (
    <>
      <ul className="list-none p-0 m-0">
        {data.postComments.comments.map((comment) => {
          return <Comment key={comment.id} comment={comment} />;
        })}
      </ul>
      {canLoadMore ? (
        <button
          className="btn btn-neutral btn-sm"
          disabled={isPending}
          onClick={() => {
            startTransition(() => {
              fetchMore({
                variables: {
                  cursor: data.postComments.cursor
                }
              });
            });
          }}
        >
          Load more
        </button>
      ) : null}
    </>
  );
};

const PostComments_CommentFragment = graphql(`
  fragment PostComments_CommentFragment on Comment {
    id
    content
  }
`);

const PostCommentReply = graphql(`
  mutation PostCommentReply($id: ID!, $comment: ReplyInput!) {
    replyComment(id: $id, comment: $comment) {
      id
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
  const [commentReply, { loading }] = useMutation(PostCommentReplyDocument, {
    update: (cache, { data }) => {
      if (!data) {
        return;
      }

      cache.updateQuery(
        {
          query: PostCommentRepliesDocument,
          /**
           * We are using the connection directive
           */
          // @ts-ignore
          variables: {
            commentId: id
          }
        },
        (dataInCache) => {
          if (!dataInCache) {
            return;
          }
          return {
            ...dataInCache,
            commentReplies: {
              /**
               * This will run a merge function.
               * Since the merge function already merges the results with the cache, we do not have to do that here.
               * If we did, we would be duplicating the data.
               */
              ...dataInCache.commentReplies,
              replies: [data.replyComment]
            }
          };
        }
      );
    }
  });

  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <li className="p-0">
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

const CommentReplies = ({ commentId }: { commentId: string }) => {
  const { data, fetchMore } = useSuspenseQuery(PostCommentRepliesDocument, {
    variables: { commentId, limit: 1 }
  });
  const canLoadMore = data.commentReplies.cursor !== null;

  const [isPending, startTransition] = useTransition();

  return (
    <div className="border-s-2">
      <ul className="list-none m-0 ml-1">
        {data.commentReplies.replies.map((reply) => {
          return <Comment comment={reply} key={reply.id} />;
        })}
      </ul>
      {canLoadMore ? (
        <button
          className="btn btn-ghost btn-xs ml-1"
          onClick={() => {
            startTransition(() => {
              fetchMore({
                variables: {
                  cursor: data.commentReplies.cursor
                }
              });
            });
          }}
        >
          + Load more
        </button>
      ) : null}
    </div>
  );
};
