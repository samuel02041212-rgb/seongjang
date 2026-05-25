import { MainNavShell } from "@/components/shell/main-nav-shell";
import { userManagesAnyGroup } from "@/lib/group";
import { auth } from "@/lib/server-auth";

export default async function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const u = session?.user;

  const displayName =
    u?.name?.trim() || u?.email?.split("@")[0] || "회원";

  const isGroupAdmin =
    !!u?.id && (await userManagesAnyGroup(u.id));

  return (
    <MainNavShell
      joinedGroups={[]}
      userName={displayName}
      userImage={u?.image ?? null}
      isAuthenticated={!!u?.id}
      isAdmin={!!u?.isAdmin}
      isGroupAdmin={isGroupAdmin}
    >
      {children}
    </MainNavShell>
  );
}
