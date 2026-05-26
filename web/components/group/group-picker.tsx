"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { GroupAvatar } from "@/components/group/group-avatar";
import { useGroupPanel } from "@/components/group/group-panel";
import { HeaderLogoGlyph } from "@/components/shell/header-logo-glyph";
import type { GroupJson } from "@/lib/group-types";

export function GroupPicker({
  groups,
  showGrowthHome = false,
}: {
  groups: GroupJson[];
  showGrowthHome?: boolean;
}) {
  const router = useRouter();
  const { setGroupOpen, setActiveGroup } = useGroupPanel();

  return (
    <div className="flex flex-wrap items-start justify-center gap-8">
      {showGrowthHome ? (
        <Link
          href="/feed"
          onClick={() => {
            setGroupOpen(false);
            setActiveGroup(null);
          }}
          className="flex w-20 flex-col items-center gap-1.5 transition hover:opacity-90"
        >
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full shadow-sm ring-2 ring-accent/30">
            <HeaderLogoGlyph />
          </span>
          <span className="max-w-full truncate text-center text-xs font-medium text-ink">
            성장
          </span>
        </Link>
      ) : null}
      {groups.map((g) => (
        <button
          key={g.id}
          type="button"
          onClick={() => {
            setGroupOpen(false);
            router.push(`/group/${g.id}/feed`);
          }}
          className="flex w-20 flex-col items-center gap-1.5 transition hover:opacity-90"
        >
          <GroupAvatar
            image={g.image}
            className="h-16 w-16 shadow-sm ring-2 ring-accent/30"
          />
          <span className="max-w-full truncate text-center text-xs font-medium text-ink">
            {g.name}
          </span>
        </button>
      ))}
    </div>
  );
}
