import { CafeReview } from "@/types/cafe";

export interface ContributorStats {
  isActiveContributor: boolean;
  uniqueCafesCount: number;
  maxStreakDays: number;
  reason?: string;
}

function toVnDateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function diffDays(dateKeyA: string, dateKeyB: string): number {
  const a = new Date(`${dateKeyA}T00:00:00Z`).getTime();
  const b = new Date(`${dateKeyB}T00:00:00Z`).getTime();
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

/**
 * Tính danh hiệu "Người dùng năng nổ":
 * - Đánh giá liên tiếp từ 7 ngày trở lên (mỗi ngày ≥ 1 quán), HOẶC
 * - Đánh giá từ 10 quán khác nhau trở lên.
 */
export function getContributorStats(
  allReviews: CafeReview[],
  authorId?: string,
  authorName?: string
): ContributorStats {
  const userReviews = allReviews.filter((r) => {
    if (authorId && r.authorId) return r.authorId === authorId;
    if (authorName) return r.authorName === authorName;
    return false;
  });

  if (userReviews.length === 0) {
    return {
      isActiveContributor: false,
      uniqueCafesCount: 0,
      maxStreakDays: 0,
    };
  }

  const uniqueCafesCount = new Set(userReviews.map((r) => r.cafeId)).size;

  const uniqueDays = Array.from(
    new Set(userReviews.map((r) => toVnDateKey(r.createdAt)))
  ).sort();

  let maxStreakDays = 1;
  let currentStreak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    if (diffDays(uniqueDays[i - 1], uniqueDays[i]) === 1) {
      currentStreak++;
      if (currentStreak > maxStreakDays) maxStreakDays = currentStreak;
    } else {
      currentStreak = 1;
    }
  }

  const isActiveContributor = uniqueCafesCount >= 10 || maxStreakDays >= 7;
  const reason =
    uniqueCafesCount >= 10
      ? `Đã đánh giá ${uniqueCafesCount} quán`
      : maxStreakDays >= 7
      ? `Chuỗi ${maxStreakDays} ngày liên tiếp`
      : undefined;

  return {
    isActiveContributor,
    uniqueCafesCount,
    maxStreakDays,
    reason,
  };
}
