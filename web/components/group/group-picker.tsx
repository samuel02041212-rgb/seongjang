"use client";

import { useRouter } from "next/navigation";

import { useGroupPanel } from "@/components/group/group-panel";
import type { GroupJson } from "@/lib/group";

function GroupAvatar({
  group,
  onClick,
}: {
  group: GroupJson;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-20 flex-col items-center gap-1.5 transition hover:opacity-90"
    >
      {group.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={group.image}
          alt=""
          className="h-16 w-16 rounded-full border-2 border-line object-cover shadow-sm ring-2 ring-accent/30"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-line bg-accent-soft text-xl font-semibold text-accent shadow-sm ring-2 ring-accent/30">
          {group.name.slice(0, 1)}
        </div>
      )}
      <span className="max-w-full truncate text-center text-xs font-medium text-ink">
        {group.name}
      </span>
    </button>
  );
}

export function GroupPicker({ groups }: { groups: GroupJson[] }) {
  const router = useRouter();
  const { setGroupOpen } = useGroupPanel();

  return (
    <div className="flex flex-wrap items-start justify-center gap-8">
      {groups.map((g) => (
        <GroupAvatar
          key={g.id}
          group={g}
          onClick={() => {
            setGroupOpen(false);
            router.push(`/group/${g.id}`);
          }}
        />
      ))}
    </div>
  );
}
