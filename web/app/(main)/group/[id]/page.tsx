import { redirect } from "next/navigation";

import { groupPath } from "@/lib/group-route";

export default async function GroupIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(groupPath(id, "feed"));
}
