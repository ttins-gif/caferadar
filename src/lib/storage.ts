import { Cafe, CafeReview, LiveCheckIn } from "@/types/cafe";

export const CHECKINS_STORAGE_KEY = "caferadar_checkins_v1";
export const REVIEWS_STORAGE_KEY = "caferadar_reviews_v1";
export const USER_CAFES_STORAGE_KEY = "caferadar_user_cafes_v1";
export const FAVORITES_STORAGE_KEY = "caferadar_favorites_v1";
export const CAFE_OVERRIDES_STORAGE_KEY = "caferadar_cafe_overrides_v1";
export const DELETED_CAFES_STORAGE_KEY = "caferadar_deleted_cafes_v1";
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

export function loadCafeOverrides(): Record<string, Cafe> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CAFE_OVERRIDES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCafeOverride(cafe: Cafe) {
  const overrides = loadCafeOverrides();
  overrides[cafe.id] = cafe;
  try {
    localStorage.setItem(CAFE_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore
  }
}

export function loadDeletedCafeIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DELETED_CAFES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function deleteCafeById(cafeId: string) {
  const deleted = loadDeletedCafeIds();
  if (!deleted.includes(cafeId)) {
    deleted.push(cafeId);
    try {
      localStorage.setItem(DELETED_CAFES_STORAGE_KEY, JSON.stringify(deleted));
    } catch {
      // ignore
    }
  }
  // Also remove from user cafes if it was user-created
  const userCafes = loadUserCafes().filter((c) => c.id !== cafeId);
  saveUserCafes(userCafes);
}

/**
 * Gộp danh sách quán gốc + quán cộng đồng thêm + bản chỉnh sửa của Admin, loại bỏ quán đã xóa.
 */
export function loadMergedCafes(seedCafes: Cafe[]): Cafe[] {
  const userCafes = loadUserCafes();
  const overrides = loadCafeOverrides();
  const deletedIds = new Set(loadDeletedCafeIds());

  const combined = [...userCafes, ...seedCafes];
  const seen = new Set<string>();
  const result: Cafe[] = [];

  for (const cafe of combined) {
    if (seen.has(cafe.id) || deletedIds.has(cafe.id)) continue;
    seen.add(cafe.id);
    result.push(overrides[cafe.id] ?? cafe);
  }
  return result;
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
  return [];
}

export function saveCheckIns(checkIns: LiveCheckIn[]) {
  try {
    localStorage.setItem(CHECKINS_STORAGE_KEY, JSON.stringify(checkIns));
  } catch {
    // ignore
  }
}

export function deleteCheckInById(checkInId: string): LiveCheckIn[] {
  const next = loadActiveCheckIns().filter((c) => c.id !== checkInId);
  saveCheckIns(next);
  return next;
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

export function loadReviews(): CafeReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addReview(review: CafeReview): CafeReview[] {
  const next = [review, ...loadReviews()];
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function deleteReviewById(reviewId: string): CafeReview[] {
  const next = loadReviews().filter((r) => r.id !== reviewId);
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function updateReviewsAvatarForUser(
  userId: string,
  displayName: string,
  newAvatarUrl: string
): CafeReview[] {
  const all = loadReviews();
  const changed: CafeReview[] = [];
  const next = all.map((r) => {
    if (r.authorId === userId || (!r.authorId && r.authorName === displayName)) {
      const updated = { ...r, authorId: userId, authorAvatar: newAvatarUrl };
      changed.push(updated);
      return updated;
    }
    return r;
  });
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return changed;
}
