export type GroupJson = {
  id: string;
  name: string;
  image: string | null;
  statusMessage: string;
  description: string;
  adminId: string;
  isAdmin: boolean;
  isMember: boolean;
  joinStatus: "none" | "pending" | "member";
};

export type GroupMemberRow = {
  userId: string;
  name: string;
  image: string | null;
  todayPostTitle: string | null;
  hasPostedToday: boolean;
};

export type GroupChatMsgJson = {
  id: string;
  mine: boolean;
  kind: string;
  content: string;
  senderName: string;
  time: string;
};

export function formatMemberName(name: string | null, email: string): string {
  return name?.trim() || email.split("@")[0] || "회원";
}
