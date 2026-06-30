import { redirect } from "next/navigation";

import { MainNavShell } from "@/components/shell/main-nav-shell";
import { auth } from "@/lib/server-auth";

export default async function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const u = session?.user;

  if (u?.id) {
    if (!u.profileComplete) redirect("/register/kakao");
    if (!u.registrationApproved) redirect("/register/pending");
  }

  return (
    <MainNavShell
      isAuthenticated={!!u?.id}
      isAdmin={!!u?.isAdmin}
    >
      {children}
    </MainNavShell>
  );
}
