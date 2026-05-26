"use client";

import { useEffect } from "react";

import { useGroupPanel } from "@/components/group/group-panel";

export function GroupRouteShell({
  groupId,
  children,
}: {
  groupId: string;
  children: React.ReactNode;
}) {
  const { joinedGroups, setActiveGroup } = useGroupPanel();

  useEffect(() => {
    let cancelled = false;

    function apply(g: {
      id: string;
      name: string;
      image: string | null;
      isAdmin: boolean;
    }) {
      if (!cancelled) setActiveGroup(g);
    }

    const g = joinedGroups.find((x) => x.id === groupId);
    if (g) {
      apply({
        id: g.id,
        name: g.name,
        image: g.image,
        isAdmin: g.isAdmin,
      });
    } else {
      void (async () => {
        try {
          const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}`, {
            credentials: "include",
          });
          if (!res.ok || cancelled) return;
          const data = (await res.json()) as {
            id: string;
            name: string;
            image: string | null;
            isAdmin: boolean;
          };
          apply(data);
        } catch {
          void 0;
        }
      })();
    }

    return () => {
      cancelled = true;
      setActiveGroup(null);
    };
  }, [groupId, joinedGroups, setActiveGroup]);

  return children;
}
