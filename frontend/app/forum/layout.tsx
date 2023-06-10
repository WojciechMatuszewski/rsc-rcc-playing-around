import { AddPost } from "./AddPost";

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <main className="max-w-xl m-auto prose pt-4 pb-4">
      <h1>Random forum</h1>
      {children}
      <AddPost />
    </main>
  );
}
