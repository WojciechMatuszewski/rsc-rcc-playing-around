import Link from "next/link";
import { FragmentType, graphql, useFragment } from "./generated";
import { DeletePost, DownVotePost, UpVotePost } from "./post/PostActions";

const PostList_PostFragment = graphql(`
  fragment PostList_PostFragment on Post {
    id
    title
    author
  }
`);

export const PostItem = ({
  post
}: {
  post: FragmentType<typeof PostList_PostFragment>;
}) => {
  const { title, author, id } = useFragment(PostList_PostFragment, post);
  return (
    <li className="flex flex-col gap-1 m-0 p-0">
      <Link
        className="link link-hover text-lg self-start"
        href={`/forum/post/${id}`}
      >
        {title}
      </Link>
      <div className="flex flex-row gap-1 text-sm items-center">
        <span className="flex items-center mr-2">By {author}</span>
        <div className="divider divider-horizontal m-0" />
        <UpVotePost />
        <DownVotePost />
        <DeletePost postId={id} />
      </div>
    </li>
  );
};

const PostList_PostsFragment = graphql(`
  fragment PostList_PostsFragment on PostsConnection {
    posts {
      id
      ...PostList_PostFragment
    }
  }
`);

export const PostList = ({
  data
}: {
  data: FragmentType<typeof PostList_PostsFragment>;
}) => {
  const query = useFragment(PostList_PostsFragment, data);

  return (
    <ul className="list-none p-0 m-0">
      {query.posts.map((post) => {
        return <PostItem post={post} key={post.id} />;
      })}
    </ul>
  );
};
