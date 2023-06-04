import Link from "next/link";
import "./globals.css";
import { ApolloProvider } from "./ApolloProvider";
import { CreatePost } from "./CreatePost";
import { Nav } from "./Nav";

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-teal-50 min-w-[100svw] min-h-[100svh] p-6">
        <Nav />
        <main>
          <h1 className="font-semibold text-2xl text-blue-700 mb-6">
            <Link href="/">RSC Forum</Link>
          </h1>
          <ApolloProvider>
            <CreatePost />
            {children}
          </ApolloProvider>
        </main>
      </body>
    </html>
  );
}
