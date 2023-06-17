"use client";

import { useMutation } from "@apollo/client";
import { ArrowDown, ArrowUp, Trash } from "react-feather";
import { DeletePostDocument } from "../generated/graphql";
import { graphql } from "../generated";
import { useEffect, useRef } from "react";

export const UpVotePost = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInterval(() => {
      if (ref.current) {
        let currentNumber = ref.current.style.getPropertyValue("--num");
        if (Number.isNaN(currentNumber) || currentNumber === "NaN") {
          currentNumber = "0";
        }
        // console.log({ currentNumber });

        console.log({
          currentNumber,
          setting: `${parseFloat(currentNumber) + 1}`
        });

        ref.current.style.setProperty(
          "--num",
          `${parseFloat(currentNumber) + 1}`
        );
      }
    }, 1000);
  }, []);

  return (
    <button className="btn btn-ghost btn-sm">
      <ArrowUp size="16px" />
      <div className="counter" ref={ref}></div>
    </button>
  );
};

export const DownVotePost = () => {
  return (
    <button className="btn btn-ghost btn-sm">
      <ArrowDown size="16px" />
      <span>20</span>
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
