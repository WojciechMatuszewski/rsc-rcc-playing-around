"use client";

import { useMutation } from "@apollo/client";
import { AnimatePresence, m, LazyMotion, domAnimation } from "framer-motion";
import { ArrowDown, ArrowUp, Trash } from "react-feather";
import { graphql } from "../generated";
import {
  DeletePostDocument,
  DownVotePostDocument,
  UpVotePostDocument
} from "../generated/graphql";

const UpVotePostMutation = graphql(`
  mutation UpVotePost($id: ID!) {
    upVotePost(id: $id) {
      id
      upVotes
    }
  }
`);

export const UpVotePost = ({
  upVotes,
  postId
}: {
  upVotes: number;
  postId: string;
}) => {
  const [upVote, { loading, error }] = useMutation(UpVotePostDocument, {
    variables: { id: postId }
  });

  return (
    <button
      disabled={loading}
      className="btn btn-ghost btn-sm"
      onClick={() => {
        upVote();
      }}
      type="button"
    >
      <ArrowUp size="16px" className="col-start-1 col-end-2" />
      <Counter count={upVotes} />
    </button>
  );
};

const DownVotePostMutation = graphql(`
  mutation DownVotePost($id: ID!) {
    downVotePost(id: $id) {
      id
      downVotes
    }
  }
`);

export const DownVotePost = ({
  downVotes,
  postId
}: {
  downVotes: number;
  postId: string;
}) => {
  const [downVote, { loading, error }] = useMutation(DownVotePostDocument, {
    variables: { id: postId }
  });

  return (
    <button
      disabled={loading}
      className="btn btn-ghost btn-sm"
      onClick={() => {
        downVote();
      }}
      type="button"
    >
      <ArrowDown size="16px" className="col-start-1 col-end-2" />
      <Counter count={downVotes} />
    </button>
  );
};

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
      className="btn btn-ghost text-sm btn-sm"
    >
      <Trash size="16px" color="hsl(var(--er))" />
    </button>
  );
};

const loadFeatures = () => {
  return import("framer-motion").then((res) => res.domAnimation);
};

const Counter = ({ count }: { count: number }) => {
  return (
    <div className="relative" style={{ fontVariantNumeric: "tabular-nums" }}>
      <div className="opacity-0">{count}</div>
      <LazyMotion features={loadFeatures} strict={true}>
        <AnimatePresence initial={false}>
          <m.div
            style={{ position: "absolute", top: 0 }}
            initial={{ opacity: 0, x: 0, y: -20 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ x: 0, y: 20, opacity: 0 }}
            key={count}
          >
            {count}
          </m.div>
        </AnimatePresence>
      </LazyMotion>
    </div>
  );
};
