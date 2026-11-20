export type UserRole = "user" | "admin";

const ROLE_STORAGE_KEY = "caferadar_role_v1";
const ADMIN_PASSCODE =
  process.env.NEXT_PUBLIC_ADMIN_PASSCODE || "caferadar2026";

export function getStoredRole(): UserRole {
  if (typeof window === "undefined") return "user";
  try {
    return localStorage.getItem(ROLE_STORAGE_KEY) === "admin"
      ? "admin"
      : "user";
  } catch {
    return "user";
  }
}

export function loginAsAdmin(passcode: string): boolean {
  if (passcode.trim() === ADMIN_PASSCODE) {
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, "admin");
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event("caferadar-role-change"));
    return true;
  }
  return false;
}

export function logoutAdmin(): void {
  try {
    localStorage.setItem(ROLE_STORAGE_KEY, "user");
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event("caferadar-role-change"));
}
