"use client";

function GroupPlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="9" cy="9" r="3.2" />
      <path d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5" />
      <circle cx="17" cy="8" r="2.6" />
      <path d="M15 14.5c.6-.3 1.3-.5 2-.5 2.2 0 4 1.6 4 4" />
    </svg>
  );
}

type GroupAvatarProps = {
  image: string | null;
  className?: string;
  rounded?: "full" | "xl";
};

export function GroupAvatar({
  image,
  className = "h-16 w-16",
  rounded = "full",
}: GroupAvatarProps) {
  const round = rounded === "xl" ? "rounded-xl" : "rounded-full";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-line bg-accent-soft ${round} ${className}`}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : (
        <GroupPlaceholderIcon className="h-[55%] w-[55%] text-accent" />
      )}
    </div>
  );
}
