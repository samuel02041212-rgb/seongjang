"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { GroupJson } from "@/lib/group-types";

import { GroupPickerOverlay } from "@/components/group/group-picker-overlay";

type GroupPanelContextValue = {
  groupOpen: boolean;
  setGroupOpen: (v: boolean) => void;
  closeGroup: () => void;
  refreshPicker: () => void;
  joinedGroups: GroupJson[];
  groupsLoaded: boolean;
  activeGroup: { id: string; name: string; image: string | null; isAdmin: boolean } | null;
  setActiveGroup: (
    g: { id: string; name: string; image: string | null; isAdmin: boolean } | null,
  ) => void;
};

const GroupPanelContext = createContext<GroupPanelContextValue | null>(null);

export function useGroupPanel() {
  const v = useContext(GroupPanelContext);
  if (!v) throw new Error("useGroupPanel must be used within GroupProvider");
  return v;
}

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [groupOpen, setGroupOpen] = useState(false);
  const [joinedGroups, setJoinedGroups] = useState<GroupJson[]>([]);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);
  const [activeGroup, setActiveGroup] = useState<{
    id: string;
    name: string;
    image: string | null;
    isAdmin: boolean;
  } | null>(null);

  const loadGroups = useCallback(async () => {
    setGroupsLoaded(false);
    try {
      const res = await fetch("/api/groups/mine", { credentials: "include" });
      setJoinedGroups(res.ok ? ((await res.json()) as GroupJson[]) : []);
    } catch {
      setJoinedGroups([]);
    } finally {
      setGroupsLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups, pickerKey]);

  const closeGroup = useCallback(() => {
    setGroupOpen(false);
  }, []);

  const refreshPicker = useCallback(() => {
    setPickerKey((k) => k + 1);
  }, []);

  const value = useMemo(
    () => ({
      groupOpen,
      setGroupOpen,
      closeGroup,
      refreshPicker,
      joinedGroups,
      groupsLoaded,
      activeGroup,
      setActiveGroup,
    }),
    [
      groupOpen,
      closeGroup,
      refreshPicker,
      joinedGroups,
      groupsLoaded,
      activeGroup,
    ],
  );

  return (
    <GroupPanelContext.Provider value={value}>
      {children}
      <GroupPickerOverlay />
    </GroupPanelContext.Provider>
  );
}
