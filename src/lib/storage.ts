import { Cafe, LiveCheckIn } from "@/types/cafe";

export const CHECKINS_STORAGE_KEY = "caferadar_checkins_v1";
export const USER_CAFES_STORAGE_KEY = "caferadar_user_cafes_v1";
export const FAVORITES_STORAGE_KEY = "caferadar_favorites_v1";
export const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export function loadUserCafes(): Cafe[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USER_CAFES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUserCafes(cafes: Cafe[]) {
  try {
    localStorage.setItem(USER_CAFES_STORAGE_KEY, JSON.stringify(cafes));
  } catch {
    // ignore
  }
}

export function loadActiveCheckIns(): LiveCheckIn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHECKINS_STORAGE_KEY);
    if (raw) {
      const parsed: LiveCheckIn[] = JSON.parse(raw);
      const now = Date.now();
      return parsed.filter((c) => new Date(c.expiresAt).getTime() > now);
    }
  } catch {
    // ignore
  }

  // Không tự chế check-in giả; trả về mảng rỗng khi chưa có dữ liệu thực tế
  return [];
}

export function saveCheckIns(checkIns: LiveCheckIn[]) {
  try {
    localStorage.setItem(CHECKINS_STORAGE_KEY, JSON.stringify(checkIns));
  } catch {
    // ignore
  }
}

export function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFavorites(ids: string[]) {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}
