export function isProfileComplete(user: {
  gender: string | null;
  birthDate: Date | null;
  church: string | null;
}): boolean {
  return Boolean(
    user.gender && user.birthDate && (user.church?.trim() ?? ""),
  );
}

export const profileUserSelect = {
  id: true,
  email: true,
  name: true,
  isAdmin: true,
  registrationApproved: true,
  gender: true,
  birthDate: true,
  church: true,
} as const;
