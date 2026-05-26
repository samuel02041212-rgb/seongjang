"use client";

import { usePathname, useRouter } from "next/navigation";

import { FeedComposer } from "@/components/feed/feed-composer";
import { groupPath, parseGroupRoute } from "@/lib/group-route";

import { MeditationBiblePanel } from "./meditation-bible-panel";

export function MeditationPageClient({ groupId }: { groupId?: string } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const routeGroupId = parseGroupRoute(pathname)?.groupId;
  const activeGroupId = groupId ?? routeGroupId;

  return (
    <div className="mx-auto w-full">
      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="w-full shrink-0 lg:w-[calc(36rem*1.3)]">
          <FeedComposer
            defaultGroupId={activeGroupId}
            pickGroupsOnSubmit={!activeGroupId}
            isAuthenticated
            onPosted={() => {
              router.push(
                activeGroupId ? groupPath(activeGroupId, "feed") : "/feed",
              );
              router.refresh();
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <MeditationBiblePanel />
        </div>
      </div>
    </div>
  );
}
