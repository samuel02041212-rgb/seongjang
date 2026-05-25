"use client";

type ProfileAvatarProps = {
  image: string | null;
  className?: string;
  editable?: boolean;
  onEdit?: () => void;
};

function AvatarContent({ image }: { image: string | null }) {
  return (
    <>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : (
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-accent"
          aria-hidden
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      )}
    </>
  );
}

export function ProfileAvatar({
  image,
  className = "h-20 w-20",
  editable,
  onEdit,
}: ProfileAvatarProps) {
  const inner = (
    <div
      className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-accent-soft`}
    >
      <AvatarContent image={image} />
    </div>
  );

  if (editable && onEdit) {
    return (
      <button
        type="button"
        onClick={onEdit}
        aria-label="프로필 수정"
        className={`group relative shrink-0 overflow-hidden rounded-full ${className}`}
      >
        {inner}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </span>
      </button>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft ${className}`}
    >
      <AvatarContent image={image} />
    </div>
  );
}
