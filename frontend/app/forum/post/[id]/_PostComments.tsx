// "use client";

// import { useMutation, useSuspenseQuery } from "@apollo/client";
// import Image from "next/image";
// import {
//   PropsWithChildren,
//   Suspense,
//   createContext,
//   useContext,
//   useId,
//   useRef,
//   useState,
//   useTransition
// } from "react";
// import { MessageCircle } from "react-feather";
// import { FragmentType, graphql, useFragment } from "../../generated";
// import {
//   PostCommentRepliesDocument,
//   PostCommentReplyDocument,
//   PostCommentsDocument
// } from "../../generated/graphql";

// const PostCommentsQuery = graphql(`
//   query PostComments($postId: ID!, $limit: Int!, $cursor: String) {
//     postComments(postId: $postId, limit: $limit, cursor: $cursor) {
//       cursor
//       comments {
//         id
//         ...PostComments_CommentFragment
//       }
//     }
//   }
// `);

// export const PostComments = ({ postId }: { postId: string }) => {
//   const { data, error, fetchMore } = useSuspenseQuery(PostCommentsDocument, {
//     variables: {
//       postId,
//       limit: 2
//     }
//   });
//   const [isPending, startTransition] = useTransition();

//   if (error) {
//     return <div>Error: {error.message}</div>;
//   }
//   const canLoadMore = data.postComments.cursor !== null;

//   return (
//     <div className="post-comments">
//       <CommentReplyProvider>
//         <ul className="list-none p-0 m-0">
//           {data.postComments.comments.map((comment) => {
//             return (
//               <Comment depthLevel={0} key={comment.id} comment={comment} />
//             );
//           })}
//         </ul>
//       </CommentReplyProvider>
//       {canLoadMore ? (
//         <button
//           className="btn btn-neutral btn-sm"
//           disabled={isPending}
//           onClick={() => {
//             startTransition(() => {
//               fetchMore({
//                 variables: {
//                   cursor: data.postComments.cursor
//                 }
//               });
//             });
//           }}
//         >
//           Load more
//         </button>
//       ) : null}
//     </div>
//   );
// };

// const PostComments_CommentFragment = graphql(`
//   fragment PostComments_CommentFragment on Comment {
//     id
//     content
//   }
// `);

// const PostCommentReply = graphql(`
//   mutation PostCommentReply($id: ID!, $comment: ReplyInput!) {
//     replyComment(id: $id, comment: $comment) {
//       id
//       content
//     }
//   }
// `);

// const Comment = ({
//   comment,
//   depthLevel
// }: {
//   comment: FragmentType<typeof PostComments_CommentFragment>;
//   depthLevel: number;
// }) => {
//   const { content, id } = useFragment(PostComments_CommentFragment, comment);
//   const { showReplyModal } = useCommentReplyModal();

//   return (
//     <>
//       <li className="p-0 m-0 relative block comment">
//         <div className={`flex not-prose gap-3 py-6 relative comment-item`}>
//           <div className="avatar self-start">
//             <div className="w-12 h-12 rounded-full self-start">
//               <Image alt="" width={48} height={48} src="/avatar.jpg" />
//             </div>
//           </div>
//           <div>
//             <p className="mb-0 bg-neutral px-3 py-2 rounded prose break-words">
//               {content}
//             </p>
//             <button
//               className="btn btn-xs btn-link text-accent no-underline -ml-2"
//               onClick={() => {
//                 showReplyModal(id);
//               }}
//             >
//               Reply <MessageCircle size="14px" />
//             </button>
//           </div>
//         </div>
//         <Suspense fallback={<div className="loading loading-spinner" />}>
//           <CommentReplies depthLevel={depthLevel + 1} commentId={id} />
//         </Suspense>
//       </li>
//     </>
//   );
// };

// const CommentReplies = ({
//   commentId,
//   depthLevel
// }: {
//   commentId: string;
//   depthLevel: number;
// }) => {
//   const { data, fetchMore } = useSuspenseQuery(PostCommentRepliesDocument, {
//     variables: { commentId, limit: 1 }
//   });
//   const canLoadMore = data.commentReplies.cursor !== null;
//   const [isPending, startTransition] = useTransition();

//   if (data.commentReplies.replies.length === 0) {
//     return null;
//   }

//   return (
//     <div>
//       <ul className="list-none m-0 p-0 pl-12">
//         {data.commentReplies.replies.map((reply) => {
//           return (
//             <Comment depthLevel={depthLevel} comment={reply} key={reply.id} />
//           );
//         })}
//       </ul>
//       {canLoadMore ? (
//         <button
//           className="btn btn-ghost btn-xs ml-1"
//           disabled={isPending}
//           onClick={() => {
//             startTransition(() => {
//               fetchMore({
//                 variables: {
//                   cursor: data.commentReplies.cursor
//                 }
//               });
//             });
//           }}
//         >
//           + Load more
//         </button>
//       ) : null}
//     </div>
//   );
// };

// const CommentReplyContext = createContext<{
//   showReplyModal: (commentId: string) => void;
// } | null>(null);

// const CommentReplyProvider = ({ children }: PropsWithChildren) => {
//   const dialogRef = useRef<HTMLDialogElement>(null);
//   const formRef = useRef<HTMLFormElement>(null);
//   const modalId = useId();

//   const [commentId, setCommentId] = useState<string | null>(null);

//   const [commentReply, { loading }] = useMutation(PostCommentReplyDocument, {
//     update: (cache, { data }) => {
//       if (!data) {
//         return;
//       }

//       if (!commentId) {
//         return;
//       }

//       cache.updateQuery(
//         {
//           query: PostCommentRepliesDocument,
//           /**
//            * We are using the connection directive
//            */
//           // @ts-ignore
//           variables: {
//             commentId
//           }
//         },
//         (dataInCache) => {
//           if (!dataInCache) {
//             return;
//           }
//           return {
//             ...dataInCache,
//             commentReplies: {
//               /**
//                * This will run a merge function.
//                * Since the merge function already merges the results with the cache, we do not have to do that here.
//                * If we did, we would be duplicating the data.
//                */
//               ...dataInCache.commentReplies,
//               replies: [data.replyComment]
//             }
//           };
//         }
//       );
//     }
//   });

//   const showReplyModal = (commentId: string) => {
//     setCommentId(commentId);
//     dialogRef.current?.showModal();
//   };

//   return (
//     <>
//       <dialog ref={dialogRef} className="modal" id={`reply-modal-${modalId}`}>
//         <form
//           className="modal-box max-w-xl"
//           ref={formRef}
//           action={async (formData) => {
//             if (!commentId) {
//               return;
//             }

//             await commentReply({
//               variables: {
//                 id: commentId,
//                 comment: {
//                   content: formData.get("content") as string
//                 }
//               }
//             });
//             formRef.current?.reset();
//             dialogRef.current?.close();
//             setCommentId(null);
//           }}
//         >
//           <div className="flex flex-col gap-2">
//             <label htmlFor="content">Comment</label>
//             <textarea
//               id="content"
//               className="textarea textarea-primary"
//               name="content"
//               placeholder="Comment on the post"
//               required
//             />
//           </div>
//           <div className="mt-4">
//             <button type="submit" className="btn btn-info">
//               Reply
//               {loading ? (
//                 <span className="loading loading-spinner"></span>
//               ) : null}
//             </button>
//           </div>
//         </form>
//       </dialog>
//       <CommentReplyContext.Provider value={{ showReplyModal }}>
//         {children}
//       </CommentReplyContext.Provider>
//     </>
//   );
// };

// const useCommentReplyModal = () => {
//   const context = useContext(CommentReplyContext);

//   if (!context) {
//     throw new Error(
//       "useCommentReplyModal must be used within a CommentReplyProvider"
//     );
//   }

//   return context;
// };
