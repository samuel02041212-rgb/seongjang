"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  feedDateAddDays,
  feedTodayIso,
} from "@/lib/feed-date";
import { readFeedBrowse, saveFeedBrowse } from "@/lib/feed-session";

type FeedBrowseValue = {
  feedDate: string;
  today: string;
  canGoNewer: boolean;
  pickDate: (iso: string) => void;
  goOlder: () => void;
  goNewer: () => void;
};

const FeedBrowseContext = createContext<FeedBrowseValue | null>(null);

export function FeedBrowseProvider({ children }: { children: ReactNode }) {
  const [feedDate, setFeedDate] = useState(
    () => readFeedBrowse()?.feedDate ?? feedTodayIso(),
  );
  const today = feedTodayIso();
  const canGoNewer = feedDate < today;

  const pickDate = useCallback((next: string) => {
    saveFeedBrowse({
      feedDate: next,
      scrollY: 0,
      postId: null,
      detailPostId: null,
    });
    setFeedDate(next);
  }, []);

  const goOlder = useCallback(
    () => pickDate(feedDateAddDays(feedDate, -1)),
    [feedDate, pickDate],
  );

  const goNewer = useCallback(() => {
    if (feedDate >= today) return;
    pickDate(feedDateAddDays(feedDate, 1));
  }, [feedDate, today, pickDate]);

  const value = useMemo(
    () => ({
      feedDate,
      today,
      canGoNewer,
      pickDate,
      goOlder,
      goNewer,
    }),
    [feedDate, today, canGoNewer, pickDate, goOlder, goNewer],
  );

  return (
    <FeedBrowseContext.Provider value={value}>
      {children}
    </FeedBrowseContext.Provider>
  );
}

export function useFeedBrowse() {
  const v = useContext(FeedBrowseContext);
  if (!v) throw new Error("useFeedBrowse requires FeedBrowseProvider");
  return v;
}
