"use client";

import { useLazyQuery, useMutation, useSuspenseQuery } from "@apollo/client";
import { FragmentType, graphql, useFragment } from "../../generated";
import {
  PostCommentDocument,
  PostCommentsDocument,
  PostComments_CommentFragmentDoc,
  ReplyCommentDocument
} from "../../generated/graphql";
import { MessageCircle } from "react-feather";
import Image from "next/image";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  useTransition
} from "react";

const PostComments_Comment = graphql(`
  fragment PostComments_Comment on Comment {
    id
    content
    replies
  }
`);

const PostCommentsQuery = graphql(`
  query PostComments(
    $id: ID!
    $cursor: String
    $limitSameLevel: Int
    $limitNextLevel: Int
  ) {
    postComments(id: $id, cursor: $cursor, limit: $limitSameLevel) {
      cursor
      comments {
        id
        ...PostComments_Comment
        comments(limit: $limitNextLevel) {
          cursor
          comments {
            id
            ...PostComments_Comment
          }
        }
      }
    }
  }
`);

export const PostComments = ({ postId }: { postId: string }) => {
  const { data, error, fetchMore } = useSuspenseQuery(PostCommentsDocument, {
    variables: { id: postId, limitSameLevel: 1, limitNextLevel: 1 }
  });

  const canFetchMore = data?.postComments.cursor != null;
  const [isPending, startTransition] = useTransition();

  return (
    <div className="post-comments -ml-12">
      <CommentReplyProvider>
        <CommentsList
          isLoadingMore={isPending}
          comments={data.postComments.comments}
          canFetchMore={canFetchMore}
          onFetchMore={() => {
            startTransition(() => {
              fetchMore({
                variables: {
                  cursor: data.postComments.cursor,
                  limitNextLevel: 1,
                  limitSameLevel: 1
                }
              });
            });
          }}
          depthLevel={0}
        />
      </CommentReplyProvider>
    </div>
  );
};

const CommentsList = ({
  comments,
  canFetchMore,
  onFetchMore,
  depthLevel,
  isLoadingMore
}: {
  comments: FragmentType<typeof PostComments_Comment>[];
  canFetchMore: boolean;
  onFetchMore: VoidFunction;
  depthLevel: number;
  isLoadingMore: boolean;
}) => {
  return (
    <>
      <ul className="list-none m-0 p-0 pl-12">
        {comments.map((comment) => {
          return (
            <Comment
              depthLevel={depthLevel}
              key={comment.id}
              comment={comment}
            />
          );
        })}
      </ul>
      {canFetchMore ? (
        <button
          className="btn btn-neutral btn-xs ml-12 block -mt-3"
          disabled={isLoadingMore}
          onClick={() => {
            onFetchMore();
          }}
        >
          Load more
        </button>
      ) : null}
    </>
  );
};

const PostCommentQuery = graphql(`
  query PostComment(
    $id: ID!
    $cursor: String
    $limitSameLevel: Int
    $limitNextLevel: Int
  ) {
    postComment(id: $id) {
      id
      comments(cursor: $cursor, limit: $limitSameLevel) {
        cursor
        comments {
          id
          ...PostComments_Comment
          comments(limit: $limitNextLevel) {
            cursor
            comments {
              id
              ...PostComments_Comment
            }
          }
        }
      }
    }
  }
`);

const Comment = ({
  comment,
  depthLevel
}: {
  comment: FragmentType<typeof PostComments_Comment> & {
    comments?: {
      cursor?: string | null;
      comments: FragmentType<typeof PostComments_Comment>[];
    };
  };
  depthLevel: number;
}) => {
  const { content, id, replies } = useFragment(
    PostComments_CommentFragmentDoc,
    comment
  );
  const { showReplyModal } = useCommentReplyModal();

  const [fetchComments, { data, loading, error, fetchMore, called }] =
    useLazyQuery(PostCommentDocument);

  const hasReplies = replies > 0;

  const initialCursor = comment.comments?.cursor;
  const fetchedCursor = data?.postComment.comments.cursor;
  const canFetchMore = called
    ? fetchedCursor != null
    : hasReplies && replies > 1;

  const handleOnFetchMore = () => {
    if (!called) {
      return fetchComments({
        variables: {
          cursor: initialCursor,
          limitNextLevel: 1,
          limitSameLevel: 1,
          id
        }
      });
    }

    return fetchMore({
      variables: {
        cursor: fetchedCursor,
        limitNextLevel: 1,
        limitSameLevel: 1,
        id
      }
    });
  };

  const fetchedComments = data?.postComment.comments.comments ?? [];
  const initialComments = comment.comments?.comments ?? [];
  const allComments = [...initialComments, ...fetchedComments];

  return (
    <>
      <li className="p-0 m-0 relative block comment">
        <div className={`flex not-prose gap-3 py-6 relative comment-item`}>
          <div className="avatar self-start">
            <div className="w-12 h-12 rounded-full self-start">
              <Image alt="" width={48} height={48} src="/avatar.jpg" />
            </div>
          </div>
          <div>
            <p className="mb-0 bg-neutral px-3 py-2 rounded prose break-words">
              {content}
              <br />
              <span className="text-xs">{id}</span>
            </p>
            <button
              className="btn btn-xs btn-link text-accent no-underline -ml-2"
              onClick={() => {
                showReplyModal(id);
              }}
            >
              Reply <MessageCircle size="14px" />
            </button>
          </div>
        </div>
        {allComments.length > 0 ? (
          <CommentsList
            isLoadingMore={loading}
            comments={allComments}
            depthLevel={depthLevel + 1}
            canFetchMore={canFetchMore}
            onFetchMore={handleOnFetchMore}
          />
        ) : null}
      </li>
    </>
  );
};

const ReplyCommentMutation = graphql(`
  mutation ReplyComment($id: ID!, $comment: ReplyInput!) {
    replyComment(id: $id, comment: $comment) {
      ...PostComments_Comment
    }
  }
`);

const CommentReplyContext = createContext<{
  showReplyModal: (commentId: string) => void;
} | null>(null);

const CommentReplyProvider = ({ children }: PropsWithChildren) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const modalId = useId();

  const [commentId, setCommentId] = useState<string | null>(null);

  const [commentReply, { loading }] = useMutation(ReplyCommentDocument, {
    update: (cache, { data }) => {
      //   if (!data) {
      //     return;
      //   }
      //   if (!commentId) {
      //     return;
      //   }
      //   cache.updateQuery(
      //     {
      //       query: PostCommentRepliesDocument,
      //       /**
      //        * We are using the connection directive
      //        */
      //       // @ts-ignore
      //       variables: {
      //         commentId
      //       }
      //     },
      //     (dataInCache) => {
      //       if (!dataInCache) {
      //         return;
      //       }
      //       return {
      //         ...dataInCache,
      //         commentReplies: {
      //           /**
      //            * This will run a merge function.
      //            * Since the merge function already merges the results with the cache, we do not have to do that here.
      //            * If we did, we would be duplicating the data.
      //            */
      //           ...dataInCache.commentReplies,
      //           replies: [data.replyComment]
      //         }
      //       };
      //     }
      //   );
    }
  });

  const showReplyModal = (commentId: string) => {
    setCommentId(commentId);
    dialogRef.current?.showModal();
  };

  return (
    <>
      <dialog ref={dialogRef} className="modal" id={`reply-modal-${modalId}`}>
        <form
          className="modal-box max-w-xl"
          ref={formRef}
          action={async (formData) => {
            if (!commentId) {
              return;
            }

            await commentReply({
              variables: {
                id: commentId,
                comment: {
                  content: formData.get("content") as string
                }
              }
            });
            formRef.current?.reset();
            dialogRef.current?.close();
            setCommentId(null);
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
      <CommentReplyContext.Provider value={{ showReplyModal }}>
        {children}
      </CommentReplyContext.Provider>
    </>
  );
};

const useCommentReplyModal = () => {
  const context = useContext(CommentReplyContext);

  if (!context) {
    throw new Error(
      "useCommentReplyModal must be used within a CommentReplyProvider"
    );
  }

  return context;
};
