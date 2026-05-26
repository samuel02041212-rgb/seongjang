import { MainNavShell } from "@/components/shell/main-nav-shell";
import { auth } from "@/lib/server-auth";

export default async function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const u = session?.user;

  return (
    <MainNavShell
      isAuthenticated={!!u?.id}
      isAdmin={!!u?.isAdmin}
    >
      {children}
    </MainNavShell>
  );
}
