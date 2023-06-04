"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

export const Nav = () => {
  const layoutSegment = useSelectedLayoutSegment();
  const baseClassName = "text-blue-700 underline rounded block py-1 px-2";

  return (
    <nav>
      <ul className="flex gap-3">
        <li>
          <Link
            className={`${baseClassName} ${
              layoutSegment === "rsc-pagination" ? "bg-slate-200" : ""
            }`}
            href="/rsc-pagination"
          >
            RSC pagination
          </Link>
        </li>
        <li>
          <Link
            className={`${baseClassName} ${
              layoutSegment === "ssr-pagination" ? "bg-slate-200" : ""
            }`}
            href="/ssr-pagination"
          >
            SSR pagination
          </Link>
        </li>
      </ul>
    </nav>
  );
};
