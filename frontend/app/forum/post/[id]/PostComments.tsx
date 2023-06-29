"use client";

import { useMutation, useSuspenseQuery } from "@apollo/client";
import { FragmentType, graphql, useFragment } from "../../generated";
import {
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
  useState
} from "react";

const PostComments_Comment = graphql(`
  fragment PostComments_Comment on Comment {
    id
    content
    replies
  }
`);

const PostCommentsQuery = graphql(`
  query PostComments($id: ID!) {
    postComments(id: $id) {
      cursor
      comments {
        id
        ...PostComments_Comment
        comments {
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
  const { data, error } = useSuspenseQuery(PostCommentsDocument, {
    variables: { id: postId }
  });

  return (
    <div className="post-comments">
      <ul className="list-none p-0 m-0">
        <CommentReplyProvider>
          {data.postComments.comments.map((comment) => {
            return (
              <Comment
                depthLevel={0}
                key={comment.id}
                comment={{
                  ...comment,
                  comments: comment.comments.comments,
                  cursor: comment.comments.cursor
                }}
              />
            );
          })}
        </CommentReplyProvider>
      </ul>
      {/* {canLoadMore ? (
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
      ) : null} */}
    </div>
  );
};

const Comment = ({
  comment,
  depthLevel
}: {
  comment: FragmentType<typeof PostComments_Comment> & {
    cursor?: string | null;
    comments: FragmentType<typeof PostComments_Comment>[];
  };
  depthLevel: number;
}) => {
  const { content, id, replies } = useFragment(
    PostComments_CommentFragmentDoc,
    comment
  );
  const { showReplyModal } = useCommentReplyModal();

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
        {replies > 0 ? (
          <CommentReplies
            depthLevel={depthLevel + 1}
            comments={comment.comments}
            cursor={comment.cursor}
          />
        ) : null}
      </li>
    </>
  );
};

const CommentReplies = ({
  comments,
  depthLevel
}: {
  depthLevel: number;
  comments: FragmentType<typeof PostComments_Comment>[];
  cursor?: string | null;
}) => {
  // const [, { data, loading, fetchMore }] = useLazyQuery(
  //   PostCommentsNestedRepliesDocument
  // );

  // const initialCursor = comments?.cursor;
  // const afterActionCursor = data?.postCommentsNested.cursor;

  return (
    <div>
      <ul className="list-none m-0 p-0 pl-12">
        {comments.map((comment) => {
          return (
            <Comment
              depthLevel={depthLevel}
              comment={{
                ...comment,
                comments: []
              }}
              key={"1"}
            />
          );
        })}
      </ul>
      {/* <button
        className="btn btn-ghost btn-xs ml-1"
        disabled={loading}
        onClick={() => {
          fetchMore({
            variables: {
              cursor: initialCursor,
              limit: 1
            }
          });
        }}
      >
        + Load more
      </button> */}
    </div>
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
