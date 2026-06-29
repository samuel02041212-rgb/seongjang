import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildCreatedAtForFeedDate,
  feedDateRangeUtc,
  feedTodayIso,
  isFeedDateIso,
  isFeedDatePastOrToday,
} from "@/lib/feed-date";
import { buildGroupPostContent } from "@/lib/group-post-msg";
import { resolveReadingRef } from "@/lib/bible-reading-ref";
import { assertGroupMember } from "@/lib/group-room";
import { serializeFeedPost } from "@/lib/feed-serialize";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "1";
  const authorIdParam = searchParams.get("authorId")?.trim() || null;
  const dateParam = searchParams.get("date");
  const timeline = searchParams.get("timeline") === "1";
  const cursor = searchParams.get("cursor")?.trim() || null;
  const groupId = searchParams.get("groupId")?.trim() || null;

  if (mine && authorIdParam) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (authorIdParam && (timeline || groupId)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (dateParam && !isFeedDateIso(dateParam)) {
    return NextResponse.json({ error: "bad_date" }, { status: 400 });
  }

  if (timeline && dateParam) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (cursor) {
    const d = new Date(cursor);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "bad_cursor" }, { status: 400 });
    }
  }

  if (groupId && !(await assertGroupMember(session.user.id, groupId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (authorIdParam) {
    const author = await prisma.user.findUnique({
      where: { id: authorIdParam },
      select: { id: true, registrationApproved: true },
    });
    if (!author?.registrationApproved) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
  }

  try {
    const dateRange =
      !timeline && dateParam ? feedDateRangeUtc(dateParam) : null;
    const cursorDate = timeline && cursor ? new Date(cursor) : null;

    const posts = await prisma.post.findMany({
      where: {
        ...(mine ? { authorId: session.user.id, kind: "MEDITATION" as const } : {}),
        ...(authorIdParam
          ? { authorId: authorIdParam, kind: "MEDITATION" as const }
          : {}),
        ...(groupId ? { visibleGroupIds: { has: groupId } } : {}),
        ...(dateRange
          ? { createdAt: { gte: dateRange.gte, lt: dateRange.lt } }
          : {}),
        ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: timeline
        ? 30
        : mine || authorIdParam || (groupId && !dateRange)
          ? 200
          : 50,
      include: {
        _count: { select: { comments: true } },
        author: { select: { church: true } },
      },
    });

    const postIds = posts.map((p) => p.id);
    const bookmarks =
      postIds.length > 0
        ? await prisma.postBookmark.findMany({
            where: { userId: session.user.id, postId: { in: postIds } },
            select: { postId: true, folderId: true },
          })
        : [];
    const bookmarkMap = new Map<string, string[]>();
    for (const b of bookmarks) {
      const list = bookmarkMap.get(b.postId) ?? [];
      list.push(b.folderId);
      bookmarkMap.set(b.postId, list);
    }

    const normalized = posts.map((p) =>
      serializeFeedPost(p, session.user!.id, {
        bookmarkFolderIds: bookmarkMap.get(p.id) ?? [],
      }),
    );
    return NextResponse.json(normalized);
  } catch (e) {
    console.error("[GET /api/posts]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}

const bibleReadingRangeBody = z.object({
  bibleBookKey: z.string().trim().min(1),
  bibleChapterStart: z.number().int().positive(),
  bibleVerseStart: z.number().int().positive(),
  bibleChapterEnd: z.number().int().positive().optional().nullable(),
  bibleVerseEnd: z.number().int().positive().optional().nullable(),
});

const createBody = z.object({
  title: z.string().trim().min(1),
  content: z.string().min(1, "내용을 입력해 주세요."),
  bibleRef: z.string().trim().optional(),
  bibleReadingRanges: z.array(bibleReadingRangeBody).max(10).optional(),
  bibleBookKey: z.string().trim().optional(),
  otherReadingRef: z.string().trim().optional(),
  bibleChapterStart: z.number().int().positive().optional(),
  bibleVerseStart: z.number().int().positive().optional(),
  bibleChapterEnd: z.number().int().positive().optional(),
  bibleVerseEnd: z.number().int().positive().optional(),
  imageUrls: z.array(z.string().min(1)).max(20).optional().default([]),
  imagesLarge: z.boolean().optional().default(false),
  visibleGroupIds: z.array(z.string()).optional().default([]),
  feedDate: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = createBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const reading = resolveReadingRef(parsed.data);
  if (!reading.ok) {
    return NextResponse.json({ ok: false, error: reading.error }, { status: 400 });
  }

  const feedDate = parsed.data.feedDate?.trim();
  if (feedDate && !isFeedDatePastOrToday(feedDate)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });
  const authorName = user?.name?.trim() || user?.email || "사용자";

  try {
    const groupIds = [...new Set(parsed.data.visibleGroupIds)];
    const createdAt =
      feedDate && feedDate !== feedTodayIso()
        ? buildCreatedAtForFeedDate(feedDate)
        : undefined;
    const post = await prisma.post.create({
      data: {
        authorId: session.user.id,
        authorName,
        title: parsed.data.title,
        content: parsed.data.content,
        bibleRef: reading.data.bibleRef,
        bibleBookKey: reading.data.bibleBookKey,
        otherReadingRef: reading.data.otherReadingRef,
        bibleChapterStart: reading.data.bibleChapterStart,
        bibleVerseStart: reading.data.bibleVerseStart,
        bibleChapterEnd: reading.data.bibleChapterEnd,
        bibleVerseEnd: reading.data.bibleVerseEnd,
        bibleReadingRanges:
          reading.data.bibleReadingRanges.length > 0
            ? reading.data.bibleReadingRanges
            : undefined,
        imageUrls: parsed.data.imageUrls,
        imagesLarge: parsed.data.imagesLarge,
        visibleGroupIds: groupIds,
        ...(createdAt ? { createdAt } : {}),
      },
    });

    for (const groupId of groupIds) {
      if (!(await assertGroupMember(session.user.id, groupId))) continue;
      await prisma.groupChatMessage.create({
        data: {
          groupId,
          senderId: session.user.id,
          kind: "post",
          content: buildGroupPostContent(post),
        },
      });
    }

    return NextResponse.json({ ok: true, id: post.id });
  } catch (e) {
    console.error("[POST /api/posts]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
