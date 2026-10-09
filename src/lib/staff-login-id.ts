export function workerLoginEmail(loginId: string): string {
  const normalized = loginId.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{2,39}$/.test(normalized)) {
    throw new Error("Enter a valid staff ID.");
  }
  return `${normalized}@staff.mynus360.invalid`;
}