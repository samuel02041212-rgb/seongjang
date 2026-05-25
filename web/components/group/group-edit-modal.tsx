"use client";

import { useEffect, useRef, useState } from "react";

import { ProfileAvatar } from "@/components/me/profile-avatar";
import { resizeImage } from "@/lib/image-resize";
import type { GroupJson } from "@/lib/group";

type Props = {
  open: boolean;
  group: GroupJson | null;
  onClose: () => void;
  onSaved: (group: GroupJson) => void;
  patchPath?: string;
};

export function GroupEditModal({ open, group, onClose, onSaved, patchPath }: Props) {
  const [name, setName] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && group) {
      setName(group.name);
      setStatusMessage(group.statusMessage);
      setImageUrl(group.image);
      setError("");
    }
  }, [open, group]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !group) return null;

  async function pickImage(file: File) {
    setError("");
    setUploading(true);
    try {
      let uploadFile: File;
      try {
        uploadFile = await resizeImage(file, 512, 0.9);
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
      if (!res.ok) {
        setError("이미지 업로드에 실패했습니다.");
        return;
      }
      const data = (await res.json()) as { url?: string };
      if (data.url) setImageUrl(data.url);
    } catch {
      setError("네트워크 오류입니다.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSave() {
    if (!name.trim()) {
      setError("소그룹 이름을 입력해 주세요.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const res = await fetch(
        patchPath ?? `/api/groups/${encodeURIComponent(group!.id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            statusMessage: statusMessage.trim(),
            image: imageUrl,
          }),
        },
      );
      const body = (await res.json()) as {
        ok?: boolean;
        group?: GroupJson;
      };
      if (!res.ok || !body.ok || !body.group) {
        setError("저장에 실패했습니다.");
        return;
      }
      onSaved(body.group);
      onClose();
    } catch {
      setError("네트워크 오류입니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/45"
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="relative flex w-full max-w-md flex-col rounded-t-lg bg-surface shadow-xl sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">소그룹 프로필 수정</h2>
          <button
            type="button"
            className="text-xl text-muted hover:text-ink"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 px-4 py-5">
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          <div className="flex items-center gap-4">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <ProfileAvatar image={null} className="h-14 w-14" />
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void pickImage(f);
                }}
              />
              <button
                type="button"
                disabled={uploading || pending}
                onClick={() => fileRef.current?.click()}
                className="rounded-md border border-line bg-bg px-3 py-2 text-sm font-medium text-ink hover:bg-accent-soft disabled:opacity-50"
              >
                {uploading ? "올리는 중…" : "사진 변경"}
              </button>
              {imageUrl ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setImageUrl(null)}
                  className="rounded-md px-3 py-1 text-xs text-muted hover:text-ink"
                >
                  사진 제거
                </button>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="group-edit-name" className="text-sm font-medium text-ink">
              소그룹 이름
            </label>
            <input
              id="group-edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          <div>
            <label
              htmlFor="group-edit-status"
              className="text-sm font-medium text-ink"
            >
              상태 메시지
            </label>
            <input
              id="group-edit-status"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              maxLength={80}
              placeholder="한 줄 소개"
              className="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="rounded-full border border-line px-4 py-2 text-sm"
          >
            취소
          </button>
          <button
            type="button"
            disabled={pending || uploading || !name.trim()}
            onClick={() => void onSave()}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
          >
            {pending ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
