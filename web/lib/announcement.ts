export const SITE_ANNOUNCEMENT_AUTHOR = "성경나눔장소";

export type AnnouncementJson = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  imageUrls: string[];
  imagesLarge: boolean;
  feedPinned: boolean;
  createdAt: string;
};

export type PinnedAnnouncementJson = {
  id: string;
  title: string;
};

export const announcementCreateBody = {
  titleMin: 1,
  contentMin: 1,
} as const;
