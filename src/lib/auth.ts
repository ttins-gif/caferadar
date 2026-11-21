export type UserRole = "user" | "admin";

export interface UserAccount {
  id: string;
  username: string; // Không thể đổi sau khi tạo
  displayName: string; // Được đổi sau mỗi 7 ngày
  displayNameUpdatedAt: string | null; // ISO timestamp lần đổi tên hiển thị gần nhất
  passwordHash?: string;
  gmail?: string;
  provider: "local" | "google";
  avatarUrl?: string;
  role: UserRole;
  /** Admin có thể tự bật/tắt đặc quyền Người dùng năng nổ cho bản thân */
  activeContributorOverride?: boolean;
  createdAt: string;
}

const ACCOUNTS_STORAGE_KEY = "caferadar_accounts_v1";
const CURRENT_USER_ID_KEY = "caferadar_current_user_id_v1";
const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS || "doletrungtin2110@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
export const DISPLAY_NAME_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày

export function isAdminEmail(email?: string): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

function emitAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("caferadar-role-change"));
    window.dispatchEvent(new Event("caferadar-auth-change"));
  }
}

/** Hash mật khẩu đơn giản trên client (cho bản MVP localStorage) */
function simpleHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `h_${(h >>> 0).toString(16)}`;
}

export function loadAllAccounts(): UserAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAllAccounts(accounts: UserAccount[]) {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // ignore
  }
}

export function getCurrentUser(): UserAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const id = localStorage.getItem(CURRENT_USER_ID_KEY);
    if (!id) return null;
    return loadAllAccounts().find((a) => a.id === id) ?? null;
  } catch {
    return null;
  }
}

export function getStoredRole(): UserRole {
  const user = getCurrentUser();
  if (!user) return "user";
  return isAdminEmail(user.gmail) || user.role === "admin" ? "admin" : "user";
}

export function logoutUser(): void {
  try {
    localStorage.removeItem(CURRENT_USER_ID_KEY);
  } catch {
    // ignore
  }
  emitAuthChange();
}

export function registerLocalAccount(params: {
  username: string;
  displayName: string;
  password: string;
  gmail?: string;
  avatarUrl?: string;
}): { ok: boolean; error?: string; user?: UserAccount } {
  const cleanUsername = params.username.trim().toLowerCase();
  const cleanDisplayName = params.displayName.trim();
  const cleanGmail = params.gmail?.trim().toLowerCase() || undefined;

  if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
    return {
      ok: false,
      error:
        "Tên đăng nhập phải từ 3–24 ký tự, chỉ gồm chữ thường không dấu, số và dấu gạch dưới (_).",
    };
  }
  if (cleanDisplayName.length < 2) {
    return { ok: false, error: "Tên hiển thị phải có ít nhất 2 ký tự." };
  }
  if (params.password.length < 6) {
    return { ok: false, error: "Mật khẩu phải có ít nhất 6 ký tự." };
  }
  if (cleanGmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanGmail)) {
    return { ok: false, error: "Địa chỉ Gmail không hợp lệ." };
  }

  const accounts = loadAllAccounts();
  if (accounts.some((a) => a.username === cleanUsername)) {
    return { ok: false, error: "Tên đăng nhập này đã có người sử dụng." };
  }
  if (cleanGmail && accounts.some((a) => a.gmail === cleanGmail)) {
    return { ok: false, error: "Gmail này đã được liên kết với tài khoản khác." };
  }

  const now = new Date().toISOString();
  const newUser: UserAccount = {
    id: `usr_${Date.now()}`,
    username: cleanUsername,
    displayName: cleanDisplayName,
    displayNameUpdatedAt: null,
    passwordHash: simpleHash(params.password),
    gmail: cleanGmail,
    provider: "local",
    avatarUrl: params.avatarUrl || undefined,
    role: isAdminEmail(cleanGmail) ? "admin" : "user",
    createdAt: now,
  };

  saveAllAccounts([newUser, ...accounts]);
  try {
    localStorage.setItem(CURRENT_USER_ID_KEY, newUser.id);
  } catch {
    // ignore
  }
  emitAuthChange();
  return { ok: true, user: newUser };
}

export function loginLocalAccount(
  identifier: string,
  password: string
): { ok: boolean; error?: string; user?: UserAccount } {
  const key = identifier.trim().toLowerCase();
  const accounts = loadAllAccounts();
  const found = accounts.find(
    (a) => a.username === key || (a.gmail && a.gmail.toLowerCase() === key)
  );
  if (!found || found.provider !== "local") {
    return { ok: false, error: "Tài khoản không tồn tại hoặc sai mật khẩu." };
  }
  if (found.passwordHash !== simpleHash(password)) {
    return { ok: false, error: "Mật khẩu không chính xác." };
  }

  try {
    localStorage.setItem(CURRENT_USER_ID_KEY, found.id);
  } catch {
    // ignore
  }
  emitAuthChange();
  return { ok: true, user: found };
}

export function loginWithGoogleAccount(params: {
  gmail: string;
  displayName?: string;
  avatarUrl?: string;
}): { ok: boolean; error?: string; user?: UserAccount } {
  const cleanGmail = params.gmail.trim().toLowerCase();
  if (!/^[^\s@]+@gmail\.com$/.test(cleanGmail)) {
    return {
      ok: false,
      error: "Vui lòng nhập địa chỉ Gmail hợp lệ (ví dụ: tenban@gmail.com).",
    };
  }

  const accounts = loadAllAccounts();
  const existing = accounts.find((a) => a.gmail === cleanGmail);
  if (existing) {
    const syncedRole: UserRole = isAdminEmail(cleanGmail) ? "admin" : "user";
    const updatedExisting: UserAccount = {
      ...existing,
      role: syncedRole,
      avatarUrl: params.avatarUrl || existing.avatarUrl,
    };
    saveAllAccounts(
      accounts.map((a) => (a.id === existing.id ? updatedExisting : a))
    );
    try {
      localStorage.setItem(CURRENT_USER_ID_KEY, existing.id);
    } catch {
      // ignore
    }
    emitAuthChange();
    return { ok: true, user: updatedExisting };
  }

  // Tạo username cố định từ phần trước @gmail.com
  const basePrefix = cleanGmail
    .split("@")[0]
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 16) || "user";
  let candidate = basePrefix;
  let suffix = 1;
  while (accounts.some((a) => a.username === candidate)) {
    candidate = `${basePrefix}${suffix++}`;
  }

  const now = new Date().toISOString();
  const newUser: UserAccount = {
    id: `gg_${Date.now()}`,
    username: candidate,
    displayName: params.displayName?.trim() || basePrefix,
    displayNameUpdatedAt: null,
    gmail: cleanGmail,
    provider: "google",
    avatarUrl: params.avatarUrl || undefined,
    role: isAdminEmail(cleanGmail) ? "admin" : "user",
    createdAt: now,
  };

  saveAllAccounts([newUser, ...accounts]);
  try {
    localStorage.setItem(CURRENT_USER_ID_KEY, newUser.id);
  } catch {
    // ignore
  }
  emitAuthChange();
  return { ok: true, user: newUser };
}

export function canChangeDisplayName(user: UserAccount): {
  allowed: boolean;
  remainingText?: string;
  nextAllowedDate?: Date;
} {
  if (!user.displayNameUpdatedAt) {
    return { allowed: true };
  }
  const last = new Date(user.displayNameUpdatedAt).getTime();
  const nextAllowed = last + DISPLAY_NAME_COOLDOWN_MS;
  const diff = nextAllowed - Date.now();
  if (diff <= 0) {
    return { allowed: true };
  }
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.ceil((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  return {
    allowed: false,
    remainingText:
      days > 0 ? `${days} ngày ${hours} giờ nữa` : `${hours} giờ nữa`,
    nextAllowedDate: new Date(nextAllowed),
  };
}

export function updateDisplayName(newDisplayName: string): {
  ok: boolean;
  error?: string;
  user?: UserAccount;
} {
  const user = getCurrentUser();
  if (!user) return { ok: false, error: "Bạn chưa đăng nhập." };

  const clean = newDisplayName.trim();
  if (clean.length < 2) {
    return { ok: false, error: "Tên hiển thị phải có ít nhất 2 ký tự." };
  }
  if (clean === user.displayName) {
    return { ok: false, error: "Tên hiển thị mới giống tên hiện tại." };
  }

  const check = canChangeDisplayName(user);
  if (!check.allowed) {
    return {
      ok: false,
      error: `Bạn chỉ có thể đổi tên hiển thị sau 7 ngày (còn ${check.remainingText}).`,
    };
  }

  const accounts = loadAllAccounts();
  const updated: UserAccount = {
    ...user,
    displayName: clean,
    displayNameUpdatedAt: new Date().toISOString(),
  };
  saveAllAccounts(accounts.map((a) => (a.id === user.id ? updated : a)));
  emitAuthChange();
  return { ok: true, user: updated };
}

export function updateUserAvatar(avatarUrl: string): UserAccount | null {
  const user = getCurrentUser();
  if (!user) return null;
  const accounts = loadAllAccounts();
  const updated: UserAccount = { ...user, avatarUrl };
  saveAllAccounts(accounts.map((a) => (a.id === user.id ? updated : a)));
  emitAuthChange();
  return updated;
}

export function linkUserGmail(gmail: string): {
  ok: boolean;
  error?: string;
  user?: UserAccount;
} {
  const user = getCurrentUser();
  if (!user) return { ok: false, error: "Bạn chưa đăng nhập." };
  const cleanGmail = gmail.trim().toLowerCase();
  if (!/^[^\s@]+@gmail\.com$/.test(cleanGmail)) {
    return { ok: false, error: "Vui lòng nhập địa chỉ Gmail hợp lệ (@gmail.com)." };
  }
  const accounts = loadAllAccounts();
  if (accounts.some((a) => a.id !== user.id && a.gmail === cleanGmail)) {
    return { ok: false, error: "Gmail này đã được liên kết với tài khoản khác." };
  }
  const updated: UserAccount = { ...user, gmail: cleanGmail };
  saveAllAccounts(accounts.map((a) => (a.id === user.id ? updated : a)));
  emitAuthChange();
  return { ok: true, user: updated };
}

export function toggleAdminSelfContributorBadge(): UserAccount | null {
  const user = getCurrentUser();
  if (!user || (!isAdminEmail(user.gmail) && user.role !== "admin")) {
    return null;
  }
  const accounts = loadAllAccounts();
  const updated: UserAccount = {
    ...user,
    activeContributorOverride: !user.activeContributorOverride,
  };
  saveAllAccounts(accounts.map((a) => (a.id === user.id ? updated : a)));
  emitAuthChange();
  return updated;
}
