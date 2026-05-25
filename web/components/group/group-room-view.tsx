"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ProfileAvatar } from "@/components/me/profile-avatar";
import type { GroupChatMsgJson, GroupMemberRow } from "@/lib/group-room";
import { resizeImage } from "@/lib/image-resize";

const MSG_POLL_MS = 3000;
const ROOM_POLL_MS = 30000;

type RoomData = {
  group: {
    id: string;
    name: string;
    image: string | null;
    statusMessage: string;
  };
  members: GroupMemberRow[];
};

function MemberRow({ m }: { m: GroupMemberRow }) {
  return (
    <li className="flex items-center gap-2 border-b border-line/60 px-3 py-2.5">
      <ProfileAvatar image={m.image} className="h-9 w-9 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-ink">{m.name}</p>
        {m.hasPostedToday && m.todayPostTitle ? (
          <p className="truncate text-[11px] text-muted">{m.todayPostTitle}</p>
        ) : (
          <p className="text-[11px] text-muted/70">오늘 묵상 없음</p>
        )}
      </div>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          m.hasPostedToday
            ? "bg-emerald-100 text-emerald-700"
            : "bg-red-100 text-red-700"
        }`}
        aria-label={m.hasPostedToday ? "묵상 완료" : "묵상 미완료"}
      >
        {m.hasPostedToday ? "✓" : "✕"}
      </span>
    </li>
  );
}

function PollBubble({
  msg,
  groupId,
  onVoted,
}: {
  msg: GroupChatMsgJson;
  groupId: string;
  onVoted: () => void;
}) {
  let data: {
    question: string;
    options: string[];
    votes?: Record<string, number>;
  };
  try {
    data = JSON.parse(msg.content) as typeof data;
  } catch {
    return <p className="text-sm">{msg.content}</p>;
  }

  const voteCounts = data.options.map((_, i) => {
    let n = 0;
    for (const v of Object.values(data.votes ?? {})) {
      if (v === i) n++;
    }
    return n;
  });
  const total = voteCounts.reduce((a, b) => a + b, 0);

  async function vote(i: number) {
    await fetch(
      `/api/groups/${encodeURIComponent(groupId)}/messages/${encodeURIComponent(msg.id)}/vote`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIndex: i }),
      },
    );
    onVoted();
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{data.question}</p>
      <ul className="space-y-1">
        {data.options.map((opt, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => void vote(i)}
              className="flex w-full items-center justify-between rounded-md border border-line bg-bg px-2 py-1.5 text-left text-xs hover:bg-accent-soft"
            >
              <span>{opt}</span>
              <span className="text-muted">
                {total > 0
                  ? `${Math.round((voteCounts[i] / total) * 100)}%`
                  : "0%"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScheduleBubble({ content }: { content: string }) {
  let data: { title: string; startAt: string; endAt?: string };
  try {
    data = JSON.parse(content) as typeof data;
  } catch {
    return <p className="text-sm">{content}</p>;
  }
  const start = new Date(data.startAt);
  const end = data.endAt ? new Date(data.endAt) : null;
  return (
    <div className="rounded-md border border-accent/40 bg-accent-soft/50 px-3 py-2">
      <p className="text-xs font-medium text-accent-foreground">일정</p>
      <p className="mt-1 text-sm font-medium text-ink">{data.title}</p>
      <p className="mt-1 text-xs text-muted">
        {start.toLocaleString("ko-KR")}
        {end ? ` ~ ${end.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}` : ""}
      </p>
    </div>
  );
}

function ChatBubble({
  msg,
  groupId,
  onPollVoted,
}: {
  msg: GroupChatMsgJson;
  groupId: string;
  onPollVoted: () => void;
}) {
  const base = msg.mine
    ? "ml-auto bg-accent text-accent-foreground"
    : "mr-auto bg-surface border border-line text-ink";

  if (msg.kind === "image") {
    return (
      <div className={`max-w-[75%] overflow-hidden rounded-lg ${base}`}>
        {!msg.mine ? (
          <p className="px-2 pt-1 text-[10px] text-muted">{msg.senderName}</p>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={msg.content} alt="" className="max-h-64 w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`max-w-[85%] rounded-lg px-3 py-2 ${base}`}>
      {!msg.mine ? (
        <p className="mb-0.5 text-[10px] font-medium opacity-70">
          {msg.senderName}
        </p>
      ) : null}
      {msg.kind === "poll" ? (
        <PollBubble msg={msg} groupId={groupId} onVoted={onPollVoted} />
      ) : msg.kind === "schedule" ? (
        <ScheduleBubble content={msg.content} />
      ) : (
        <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>
      )}
    </div>
  );
}

export function GroupRoomView({ groupId }: { groupId: string }) {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [messages, setMessages] = useState<GroupChatMsgJson[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [extra, setExtra] = useState<"poll" | "schedule" | null>(null);
  const [pollQ, setPollQ] = useState("");
  const [pollOpts, setPollOpts] = useState(["", ""]);
  const [schedTitle, setSchedTitle] = useState("");
  const [schedStart, setSchedStart] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastTimeRef = useRef<string | null>(null);

  const loadRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}/room`, {
        credentials: "include",
      });
      if (!res.ok) {
        setRoom(null);
        return;
      }
      setRoom((await res.json()) as RoomData);
    } catch {
      setRoom(null);
    }
  }, [groupId]);

  const loadMessages = useCallback(
    async (initial = false) => {
      try {
        const qs = !initial && lastTimeRef.current
          ? `?after=${encodeURIComponent(lastTimeRef.current)}`
          : "";
        const res = await fetch(
          `/api/groups/${encodeURIComponent(groupId)}/messages${qs}`,
          { credentials: "include" },
        );
        if (!res.ok) return;
        const batch = (await res.json()) as GroupChatMsgJson[];
        if (initial) {
          setMessages(batch);
        } else if (batch.length > 0) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            return [...prev, ...batch.filter((m) => !ids.has(m.id))];
          });
        }
        if (batch.length > 0) {
          lastTimeRef.current = batch[batch.length - 1].time;
        }
      } catch {
        void 0;
      }
    },
    [groupId],
  );

  useEffect(() => {
    void loadRoom();
    void loadMessages(true);
    const msgIv = setInterval(() => void loadMessages(false), MSG_POLL_MS);
    const roomIv = setInterval(() => void loadRoom(), ROOM_POLL_MS);
    return () => {
      clearInterval(msgIv);
      clearInterval(roomIv);
    };
  }, [loadRoom, loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages.length]);

  async function send(kind: string, content: string) {
    if (!content.trim()) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/groups/${encodeURIComponent(groupId)}/messages`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, content }),
        },
      );
      if (res.ok) {
        const msg = (await res.json()) as GroupChatMsgJson;
        setMessages((prev) => [...prev, msg]);
        lastTimeRef.current = msg.time;
      }
    } finally {
      setSending(false);
    }
  }

  async function sendText() {
    const v = text.trim();
    if (!v) return;
    setText("");
    await send("text", v);
  }

  async function sendImage(file: File) {
    let uploadFile: File;
    try {
      uploadFile = await resizeImage(file, 1024, 0.85);
    } catch {
      uploadFile = file;
    }
    const fd = new FormData();
    fd.append("file", uploadFile);
    const res = await fetch("/api/upload", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    if (!res.ok) return;
    const data = (await res.json()) as { url?: string };
    if (data.url) await send("image", data.url);
  }

  async function sendPoll() {
    const q = pollQ.trim();
    const opts = pollOpts.map((o) => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) return;
    await send(
      "poll",
      JSON.stringify({ question: q, options: opts, votes: {} }),
    );
    setExtra(null);
    setPollQ("");
    setPollOpts(["", ""]);
  }

  async function sendSchedule() {
    const title = schedTitle.trim();
    if (!title || !schedStart) return;
    const startAt = new Date(schedStart);
    if (Number.isNaN(startAt.getTime())) return;
    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
    await send(
      "schedule",
      JSON.stringify({
        title,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      }),
    );
    setExtra(null);
    setSchedTitle("");
    setSchedStart("");
  }

  if (!room) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted">
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        {room.group.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={room.group.image}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
            {room.group.name.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{room.group.name}</p>
          {room.group.statusMessage ? (
            <p className="truncate text-xs text-muted">
              {room.group.statusMessage}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-surface/80 sm:w-64">
          <p className="border-b border-line px-3 py-2 text-xs font-semibold text-muted">
            오늘 말씀묵상
          </p>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {room.members.map((m) => (
              <MemberRow key={m.userId} m={m} />
            ))}
          </ul>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-bg">
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((m) => (
              <ChatBubble
                key={m.id}
                msg={m}
                groupId={groupId}
                onPollVoted={() => void loadMessages(true)}
              />
            ))}
          </div>

          {extra === "poll" ? (
            <div className="border-t border-line bg-surface px-4 py-3">
              <input
                value={pollQ}
                onChange={(e) => setPollQ(e.target.value)}
                placeholder="투표 질문"
                className="mb-2 w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
              />
              {pollOpts.map((o, i) => (
                <input
                  key={i}
                  value={o}
                  onChange={(e) =>
                    setPollOpts((prev) =>
                      prev.map((x, j) => (j === i ? e.target.value : x)),
                    )
                  }
                  placeholder={`선택 ${i + 1}`}
                  className="mb-1 w-full rounded-md border border-line bg-bg px-3 py-1.5 text-sm"
                />
              ))}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => void sendPoll()}
                  className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground"
                >
                  올리기
                </button>
                <button
                  type="button"
                  onClick={() => setExtra(null)}
                  className="text-xs text-muted"
                >
                  취소
                </button>
              </div>
            </div>
          ) : null}

          {extra === "schedule" ? (
            <div className="border-t border-line bg-surface px-4 py-3">
              <input
                value={schedTitle}
                onChange={(e) => setSchedTitle(e.target.value)}
                placeholder="일정 제목"
                className="mb-2 w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
              />
              <input
                type="datetime-local"
                value={schedStart}
                onChange={(e) => setSchedStart(e.target.value)}
                className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => void sendSchedule()}
                  className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground"
                >
                  올리기
                </button>
                <button
                  type="button"
                  onClick={() => setExtra(null)}
                  className="text-xs text-muted"
                >
                  취소
                </button>
              </div>
            </div>
          ) : null}

          <div className="border-t border-line bg-surface px-3 py-2">
            <div className="mb-2 flex gap-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-md px-2 py-1 text-xs text-muted hover:bg-accent-soft hover:text-ink"
              >
                사진
              </button>
              <button
                type="button"
                onClick={() => setExtra("poll")}
                className="rounded-md px-2 py-1 text-xs text-muted hover:bg-accent-soft hover:text-ink"
              >
                투표
              </button>
              <button
                type="button"
                onClick={() => setExtra("schedule")}
                className="rounded-md px-2 py-1 text-xs text-muted hover:bg-accent-soft hover:text-ink"
              >
                일정
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void sendImage(f);
                e.target.value = "";
              }}
            />
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendText();
                  }
                }}
                placeholder="메시지 입력"
                className="min-w-0 flex-1 rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                type="button"
                disabled={sending || !text.trim()}
                onClick={() => void sendText()}
                className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
