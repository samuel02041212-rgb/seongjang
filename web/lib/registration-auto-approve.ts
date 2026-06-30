export function registrationAutoApprove(): boolean {
  return (
    process.env.REGISTRATION_AUTO_APPROVE === "1" ||
    process.env.NODE_ENV === "development"
  );
}
