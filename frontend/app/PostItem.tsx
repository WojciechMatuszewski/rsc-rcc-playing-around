"use client";

export const PostItem = ({
  post,
  actions
}: {
  post: any;
  actions: React.ReactNode;
}) => {
  return (
    <li className="flex gap-1 flex-col mb-4" key={post.id}>
      <div className="flex items-center">
        <span>{post.title}</span>
        <div className="mx-2">|</div>
        {actions}
      </div>
      <div>
        By: <i>{post.author}</i>
      </div>
    </li>
  );
};
