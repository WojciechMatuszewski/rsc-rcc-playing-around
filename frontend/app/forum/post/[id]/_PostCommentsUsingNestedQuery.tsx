// "use client";

// import { useLazyQuery, useSuspenseQuery } from "@apollo/client";
// import Image from "next/image";
// import { useTransition } from "react";
// import { MessageCircle } from "react-feather";
// import { graphql } from "../../generated";
// import {
//   PostCommentsNestedDocument,
//   PostCommentsNestedRepliesDocument
// } from "../../generated/graphql";

// const PostCommentsQuery = graphql(`
//   query PostCommentsNested($postId: ID!, $limit: Int!, $cursor: String) {
//     postCommentsNested(postId: $postId, limit: $limit, cursor: $cursor) {
//       cursor
//       comments {
//         id
//         content
//         comments(limit: $limit) {
//           cursor
//           comments {
//             id
//             content
//           }
//         }
//       }
//     }
//   }
// `);

// type Comment = {
//   id: string;
//   content: string;

//   comments?: { cursor: string | null; comments: Comment[] };
// };

// export const PostCommentsUsingNestedQuery = ({
//   postId
// }: {
//   postId: string;
// }) => {
//   const { data, error, fetchMore } = useSuspenseQuery(
//     PostCommentsNestedDocument,
//     {
//       variables: {
//         postId,
//         limit: 1
//       }
//     }
//   );
//   const [isPending, startTransition] = useTransition();

//   if (error) {
//     return <div>Error: {error.message}</div>;
//   }
//   const canLoadMore = data.postCommentsNested.cursor !== null;

//   return (
//     <div className="post-comments">
//       <ul className="list-none p-0 m-0">
//         {data.postCommentsNested.comments.map((comment) => {
//           console.log(comment);
//           return <Comment depthLevel={0} key={comment.id} comment={comment} />;
//         })}
//       </ul>
//       {canLoadMore ? (
//         <button
//           className="btn btn-neutral btn-sm"
//           disabled={isPending}
//           onClick={() => {
//             startTransition(() => {
//               fetchMore({
//                 variables: {
//                   cursor: data.postCommentsNested.cursor
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

// // const PostComments_CommentFragment = graphql(`
// //   fragment PostComments_CommentFragment on Comment {
// //     id
// //     content
// //   }
// // `);

// // const PostCommentReply = graphql(`
// //   mutation PostCommentReply($id: ID!, $comment: ReplyInput!) {
// //     replyComment(id: $id, comment: $comment) {
// //       id
// //       content
// //     }
// //   }
// // `);

// const Comment = ({
//   comment,
//   depthLevel
// }: {
//   comment: Comment;
//   //   comment: FragmentType<typeof PostComments_CommentFragment>;
//   depthLevel: number;
// }) => {
//   //   const { content, id } = useFragment(PostComments_CommentFragment, comment);
//   const { content, id, comments } = comment;
//   console.log(comments);
//   //   const { showReplyModal } = useCommentReplyModal();

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
//                 // showReplyModal(id);
//               }}
//             >
//               Reply <MessageCircle size="14px" />
//             </button>
//           </div>
//         </div>
//         <CommentReplies depthLevel={depthLevel + 1} comments={comments} />
//       </li>
//     </>
//   );
// };

// const PostCommentsRepliesQuery = graphql(`
//   query PostCommentsNestedReplies($postId: ID!, $limit: Int!, $cursor: String) {
//     postCommentsNested(postId: $postId, limit: $limit, cursor: $cursor) {
//       cursor
//       comments {
//         id
//         content
//       }
//     }
//   }
// `);

// const CommentReplies = ({
//   comments,
//   depthLevel
// }: {
//   depthLevel: number;
//   comments: Comment["comments"];
// }) => {
//   const [, { data, loading, fetchMore }] = useLazyQuery(
//     PostCommentsNestedRepliesDocument
//   );

//   const initialCursor = comments?.cursor;
//   const afterActionCursor = data?.postCommentsNested.cursor;

//   return (
//     <div>
//       <ul className="list-none m-0 p-0 pl-12">
//         {comments?.comments.map((comment) => {
//           return (
//             <Comment
//               depthLevel={depthLevel}
//               comment={comment}
//               key={comment.id}
//             />
//           );
//         })}
//       </ul>
//       <button
//         className="btn btn-ghost btn-xs ml-1"
//         disabled={loading}
//         onClick={() => {
//           fetchMore({
//             variables: {
//               cursor: initialCursor,
//               limit: 1
//             }
//           });
//         }}
//       >
//         + Load more
//       </button>
//     </div>
//   );
// };

// // const CommentReplyContext = createContext<{
// //   showReplyModal: (commentId: string) => void;
// // } | null>(null);

// // const CommentReplyProvider = ({ children }: PropsWithChildren) => {
// //   const dialogRef = useRef<HTMLDialogElement>(null);
// //   const formRef = useRef<HTMLFormElement>(null);
// //   const modalId = useId();

// //   const [commentId, setCommentId] = useState<string | null>(null);

// //   const [commentReply, { loading }] = useMutation(PostCommentReplyDocument, {
// //     update: (cache, { data }) => {
// //       if (!data) {
// //         return;
// //       }

// //       if (!commentId) {
// //         return;
// //       }

// //       cache.updateQuery(
// //         {
// //           query: PostCommentRepliesDocument,
// //           /**
// //            * We are using the connection directive
// //            */
// //           // @ts-ignore
// //           variables: {
// //             commentId
// //           }
// //         },
// //         (dataInCache) => {
// //           if (!dataInCache) {
// //             return;
// //           }
// //           return {
// //             ...dataInCache,
// //             commentReplies: {
// //               /**
// //                * This will run a merge function.
// //                * Since the merge function already merges the results with the cache, we do not have to do that here.
// //                * If we did, we would be duplicating the data.
// //                */
// //               ...dataInCache.commentReplies,
// //               replies: [data.replyComment]
// //             }
// //           };
// //         }
// //       );
// //     }
// //   });

// //   const showReplyModal = (commentId: string) => {
// //     setCommentId(commentId);
// //     dialogRef.current?.showModal();
// //   };

// //   return (
// //     <>
// //       <dialog ref={dialogRef} className="modal" id={`reply-modal-${modalId}`}>
// //         <form
// //           className="modal-box max-w-xl"
// //           ref={formRef}
// //           action={async (formData) => {
// //             if (!commentId) {
// //               return;
// //             }

// //             await commentReply({
// //               variables: {
// //                 id: commentId,
// //                 comment: {
// //                   content: formData.get("content") as string
// //                 }
// //               }
// //             });
// //             formRef.current?.reset();
// //             dialogRef.current?.close();
// //             setCommentId(null);
// //           }}
// //         >
// //           <div className="flex flex-col gap-2">
// //             <label htmlFor="content">Comment</label>
// //             <textarea
// //               id="content"
// //               className="textarea textarea-primary"
// //               name="content"
// //               placeholder="Comment on the post"
// //               required
// //             />
// //           </div>
// //           <div className="mt-4">
// //             <button type="submit" className="btn btn-info">
// //               Reply
// //               {loading ? (
// //                 <span className="loading loading-spinner"></span>
// //               ) : null}
// //             </button>
// //           </div>
// //         </form>
// //       </dialog>
// //       <CommentReplyContext.Provider value={{ showReplyModal }}>
// //         {children}
// //       </CommentReplyContext.Provider>
// //     </>
// //   );
// // };

// // const useCommentReplyModal = () => {
// //   const context = useContext(CommentReplyContext);

// //   if (!context) {
// //     throw new Error(
// //       "useCommentReplyModal must be used within a CommentReplyProvider"
// //     );
// //   }

// //   return context;
// // };
