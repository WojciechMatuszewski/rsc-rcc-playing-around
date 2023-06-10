import { ApolloProvider } from "./ApolloProvider";
import "./globals.css";

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-base-100 min-w-[100%] min-h-[100svh]">
        <ApolloProvider>{children}</ApolloProvider>
      </body>
    </html>
  );
}
