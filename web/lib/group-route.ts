const GROUP_LIST_PATHS = new Set(["/group/mygroups", "/group/manage"]);

export function parseGroupRoute(pathname: string): { groupId: string } | null {
  if (!pathname.startsWith("/group/")) return null;
  if (GROUP_LIST_PATHS.has(pathname)) return null;
  const rest = pathname.slice("/group/".length);
  const groupId = rest.split("/")[0];
  if (!groupId) return null;
  return { groupId };
}

export function groupPath(
  groupId: string,
  section: "feed" | "chat" | "meditation" | "record" | "settings" | "manage",
) {
  return `/group/${groupId}/${section}`;
}
