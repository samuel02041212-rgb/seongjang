import { GroupRouteShell } from "@/components/group/group-route-shell";

export default async function GroupIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GroupRouteShell groupId={id}>{children}</GroupRouteShell>;
}
