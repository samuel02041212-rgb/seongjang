"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"" | "M" | "F">("");
  const [birthDate, setBirthDate] = useState("");
  const [church, setChurch] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupSource, setSignupSource] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          gender: gender || undefined,
          birthDate: birthDate.trim(),
          church: church.trim(),
          email: email.trim(),
          password,
          signupSource: signupSource.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? "가입에 실패했습니다.");
        return;
      }
      router.push("/login?registered=1");
    } catch {
      setError("네트워크 오류입니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
      <h1 className="text-xl font-semibold text-ink">회원가입</h1>
      <p className="mt-1 text-sm text-muted">
        가입 후에는 이메일과 비밀번호로 로그인합니다. 운영 정책에 따라 승인 후
        로그인이 필요할 수 있습니다.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <div>
          <label htmlFor="reg-name" className="text-sm font-medium text-ink">
            이름
          </label>
          <input
            id="reg-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <fieldset>
          <legend className="text-sm font-medium text-ink">성별</legend>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="gender"
                value="M"
                checked={gender === "M"}
                onChange={() => setGender("M")}
                required
              />
              남성
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="gender"
                value="F"
                checked={gender === "F"}
                onChange={() => setGender("F")}
              />
              여성
            </label>
          </div>
        </fieldset>
        <div>
          <label htmlFor="reg-birth" className="text-sm font-medium text-ink">
            생년월일
          </label>
          <input
            id="reg-birth"
            name="birthDate"
            type="date"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="reg-church" className="text-sm font-medium text-ink">
            출석 교회
          </label>
          <input
            id="reg-church"
            name="church"
            type="text"
            autoComplete="organization"
            required
            value={church}
            onChange={(e) => setChurch(e.target.value)}
            placeholder="예: ○○교회"
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="reg-email" className="text-sm font-medium text-ink">
            이메일 (로그인 ID)
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="reg-password" className="text-sm font-medium text-ink">
            비밀번호 (8자 이상)
          </label>
          <input
            id="reg-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="reg-source" className="text-sm font-medium text-ink">
            가입 경로 <span className="font-normal text-muted">(선택)</span>
          </label>
          <input
            id="reg-source"
            name="signupSource"
            type="text"
            value={signupSource}
            onChange={(e) => setSignupSource(e.target.value)}
            placeholder="예: 지인 소개, 검색 등"
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground shadow-sm transition hover:bg-accent/90 disabled:opacity-60"
        >
          {pending ? "처리 중…" : "가입하기"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        이미 계정이 있으신가요?{" "}
        <Link
          href="/login"
          className="font-medium text-accent-foreground underline-offset-2 hover:underline"
        >
          로그인
        </Link>
      </p>
    </div>
  );
}
