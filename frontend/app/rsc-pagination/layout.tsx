import Link from "next/link";
import { Nav } from "../Nav";
import { CreatePost } from "../CreatePost";

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <>
      <Nav />
      <main>
        <h1 className="font-semibold text-2xl mb-6">
          <Link href="/">RSC Forum</Link>
        </h1>
        <CreatePost />
        {children}
      </main>
    </>
  );
}
