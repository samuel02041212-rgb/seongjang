"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

function pad2(n: string): string {
  return n.length >= 2 ? n : `0${n}`;
}

export function RegisterForm({
  mode = "email",
  initialName = "",
}: {
  mode?: "email" | "kakao";
  initialName?: string;
}) {
  const router = useRouter();
  const { update } = useSession();
  const isKakao = mode === "kakao";
  const [name, setName] = useState(initialName);
  const [gender, setGender] = useState<"" | "M" | "F">("");
  const maxYear = useMemo(() => new Date().getFullYear() - 10, []);
  const minYear = 1920;
  const yearOptions = useMemo(
    () =>
      Array.from(
        { length: maxYear - minYear + 1 },
        (_, i) => String(maxYear - i),
      ),
    [maxYear],
  );

  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");

  const daysInMonth = useMemo(() => {
    if (!birthYear || !birthMonth) return 31;
    const y = Number(birthYear);
    const m = Number(birthMonth);
    if (!y || !m) return 31;
    return new Date(y, m, 0).getDate();
  }, [birthYear, birthMonth]);

  useEffect(() => {
    if (!birthDay) return;
    const d = Number(birthDay);
    if (d > daysInMonth) setBirthDay(String(daysInMonth));
  }, [birthYear, birthMonth, daysInMonth, birthDay]);

  useEffect(() => {
    if (initialName) setName(initialName);
  }, [initialName]);

  const birthDate = useMemo(() => {
    if (!birthYear || !birthMonth || !birthDay) return "";
    const y = birthYear;
    const m = pad2(birthMonth);
    const d = pad2(birthDay);
    const iso = `${y}-${m}-${d}`;
    const dt = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(dt.getTime())) return "";
    if (
      dt.getFullYear() !== Number(y) ||
      dt.getMonth() + 1 !== Number(birthMonth) ||
      dt.getDate() !== Number(birthDay)
    ) {
      return "";
    }
    return iso;
  }, [birthYear, birthMonth, birthDay]);

  const [church, setChurch] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupSource, setSignupSource] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const dayOptions = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => String(i + 1)),
    [daysInMonth],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!birthDate) {
      setError("생년월일을 모두 선택해 주세요.");
      return;
    }
    setPending(true);
    try {
      const payload = {
        name: name.trim(),
        gender: gender || undefined,
        birthDate,
        church: church.trim(),
        signupSource: signupSource.trim() || undefined,
        ...(isKakao
          ? {}
          : { email: email.trim(), password }),
      };

      const res = await fetch(isKakao ? "/api/register/kakao" : "/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "가입에 실패했습니다.");
        return;
      }
      if (isKakao) {
        await update();
        router.push("/register/pending");
        router.refresh();
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
    <div className="w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-sm sm:p-8">
      <h1 className="font-display text-xl text-ink">
        {isKakao ? "카카오 회원가입" : "회원가입"}
      </h1>
      {isKakao ? (
        <p className="mt-1 text-sm text-muted">
          추가 정보를 입력해 주세요. 관리자 승인 후 이용할 수 있습니다.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <div>
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
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
                className="mt-1 h-10 w-full rounded-md border border-line bg-bg px-3 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
              />
            </div>
            <fieldset className="shrink-0">
              <legend className="text-sm font-medium text-ink">성별</legend>
              <div className="mt-1 flex h-10" role="radiogroup" aria-label="성별">
                <label
                  className={`flex h-full min-w-[2.75rem] cursor-pointer items-center justify-center border border-line px-3 text-sm transition ${
                    gender === "M"
                      ? "relative z-10 border-accent bg-accent font-medium text-accent-foreground"
                      : "bg-bg text-ink hover:bg-accent-soft/60"
                  } rounded-l-md`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value="M"
                    checked={gender === "M"}
                    onChange={() => setGender("M")}
                    required
                    className="sr-only"
                  />
                  남
                </label>
                <label
                  className={`flex h-full min-w-[2.75rem] cursor-pointer items-center justify-center border border-line -ml-px px-3 text-sm transition ${
                    gender === "F"
                      ? "relative z-10 border-accent bg-accent font-medium text-accent-foreground"
                      : "bg-bg text-ink hover:bg-accent-soft/60"
                  } rounded-r-md`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value="F"
                    checked={gender === "F"}
                    onChange={() => setGender("F")}
                    className="sr-only"
                  />
                  여
                </label>
              </div>
            </fieldset>
          </div>
        </div>
        <div>
          <span id="reg-birth-label" className="text-sm font-medium text-ink">
            생년월일
          </span>
          <div
            className="mt-1 flex flex-wrap gap-2"
            role="group"
            aria-labelledby="reg-birth-label"
          >
            <select
              id="reg-birth-year"
              name="birthYear"
              required
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="min-w-[5.5rem] flex-1 rounded-md border border-line bg-bg px-2 py-2.5 text-sm text-ink outline-none ring-accent/30 focus:ring-2 sm:flex-none sm:min-w-[6.5rem]"
            >
              <option value="">년</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              id="reg-birth-month"
              name="birthMonth"
              required
              value={birthMonth}
              onChange={(e) => setBirthMonth(e.target.value)}
              className="min-w-[4.5rem] flex-1 rounded-md border border-line bg-bg px-2 py-2.5 text-sm text-ink outline-none ring-accent/30 focus:ring-2 sm:flex-none"
            >
              <option value="">월</option>
              {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              id="reg-birth-day"
              name="birthDay"
              required
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value)}
              className="min-w-[4.5rem] flex-1 rounded-md border border-line bg-bg px-2 py-2.5 text-sm text-ink outline-none ring-accent/30 focus:ring-2 sm:flex-none"
            >
              <option value="">일</option>
              {dayOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
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
            className="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        {!isKakao ? (
          <>
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
                className="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
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
                className="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
              />
            </div>
          </>
        ) : null}
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
            className="mt-1 w-full rounded-md border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-accent py-3 text-sm font-semibold text-accent-foreground shadow-sm transition hover:bg-accent/90 disabled:opacity-60"
        >
          {pending ? "처리 중…" : isKakao ? "가입 신청하기" : "가입하기"}
        </button>
      </form>

      {!isKakao ? (
        <p className="mt-6 text-center text-sm text-muted">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="font-semibold text-ink underline underline-offset-2"
          >
            로그인
          </Link>
        </p>
      ) : null}
    </div>
  );
}
