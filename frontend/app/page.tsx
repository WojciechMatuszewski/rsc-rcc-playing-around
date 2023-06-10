import Link from "next/link";

export default function Page() {
  return (
    <ul className="list-disc">
      <li>
        <Link className="link link-hover" href="/forum">
          Forum app
        </Link>
      </li>
      <li>
        <Link className="link link-hover" href="/rsc-pagination">
          Pagination learning RSCs
        </Link>
      </li>
      <li>
        <Link className="link link-hover" href="/ssr-pagination">
          Pagination learning SSR
        </Link>
      </li>
    </ul>
  );
}
