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

  // Default realistic seed check-ins so first-time visitors see live status
  const now = Date.now();
  return [
    {
      id: "seed-ci-1",
      cafeId: "q3-co-ba-workspace-vo-van-tan",
      type: "quiet_available",
      createdAt: new Date(now - 20 * 60000).toISOString(),
      expiresAt: new Date(now - 20 * 60000 + SIX_HOURS_MS).toISOString(),
    },
    {
      id: "seed-ci-2",
      cafeId: "q1-three-oclock-nguyen-du",
      type: "crowded",
      createdAt: new Date(now - 35 * 60000).toISOString(),
      expiresAt: new Date(now - 35 * 60000 + SIX_HOURS_MS).toISOString(),
    },
    {
      id: "seed-ci-3",
      cafeId: "bt-soko-workspace-nguyen-gia-tri",
      type: "great_vibes",
      createdAt: new Date(now - 50 * 60000).toISOString(),
      expiresAt: new Date(now - 50 * 60000 + SIX_HOURS_MS).toISOString(),
    },
  ];
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
