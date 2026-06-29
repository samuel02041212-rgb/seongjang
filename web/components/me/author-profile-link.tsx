"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import type { MouseEvent } from "react";

type AuthorProfileLinkProps = {
  authorId?: string;
  authorName: string;
  authorChurch?: string;
  linkable?: boolean;
  className?: string;
  onClick?: (e: MouseEvent) => void;
};

export function AuthorProfileLink({
  authorId,
  authorName,
  authorChurch,
  linkable = true,
  className = "",
  onClick,
}: AuthorProfileLinkProps) {
  const { data: session } = useSession();
  const label = authorChurch ? `${authorName}, ${authorChurch}` : authorName;

  if (!linkable || !authorId || !authorName) {
    return <span className={className}>{label}</span>;
  }

  const href =
    session?.user?.id === authorId ? "/me" : `/user/${authorId}`;

  return (
    <Link
      href={href}
      className={`hover:text-ink hover:underline ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      {label}
    </Link>
  );
}
