import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Cafe, CafeReview, LiveCheckIn } from "@/types/cafe";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}

export async function fetchCloudCafes(): Promise<Cafe[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("public_cafes")
    .select("id, data")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data
    .filter(
      (row) =>
        !String(row.id).startsWith("views:") &&
        !String(row.id).startsWith("feedback:")
    )
    .map((row) => row.data as Cafe);
}

const VIEWS_LOCAL_KEY = "caferadar_cafe_views_v1";

/**
 * Ghi nhận 1 lượt mắt xem duy nhất cho mỗi account (mỗi account chỉ tính 1 lần / quán).
 * Đồng bộ cả localStorage lẫn Supabase (lưu dưới key `views:<cafeId>`).
 */
export async function recordUniqueCafeView(
  cafeId: string,
  viewerId: string
): Promise<number> {
  let localMap: Record<string, string[]> = {};
  try {
    const raw = localStorage.getItem(VIEWS_LOCAL_KEY);
    if (raw) localMap = JSON.parse(raw);
  } catch {
    localMap = {};
  }

  const localSet = new Set<string>(localMap[cafeId] || []);
  localSet.add(viewerId);

  const sb = getSupabase();
  if (sb) {
    try {
      const rowId = `views:${cafeId}`;
      const { data } = await sb
        .from("public_cafes")
        .select("data")
        .eq("id", rowId)
        .maybeSingle();

      const cloudIds: string[] = Array.isArray(data?.data?.viewerIds)
        ? data.data.viewerIds
        : [];
      for (const id of cloudIds) localSet.add(id);

      const merged = Array.from(localSet);
      if (!cloudIds.includes(viewerId)) {
        await sb
          .from("public_cafes")
          .upsert({ id: rowId, data: { viewerIds: merged } });
      }
      localMap[cafeId] = merged;
      try {
        localStorage.setItem(VIEWS_LOCAL_KEY, JSON.stringify(localMap));
      } catch {
        // ignore
      }
      return merged.length;
    } catch {
      // fall through to local count
    }
  }

  const mergedLocal = Array.from(localSet);
  localMap[cafeId] = mergedLocal;
  try {
    localStorage.setItem(VIEWS_LOCAL_KEY, JSON.stringify(localMap));
  } catch {
    // ignore
  }
  return mergedLocal.length;
}

export async function fetchAllCafeViewCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  try {
    const raw = localStorage.getItem(VIEWS_LOCAL_KEY);
    if (raw) {
      const localMap: Record<string, string[]> = JSON.parse(raw);
      for (const [cafeId, ids] of Object.entries(localMap)) {
        if (Array.isArray(ids)) counts[cafeId] = ids.length;
      }
    }
  } catch {
    // ignore
  }

  const sb = getSupabase();
  if (sb) {
    try {
      const { data } = await sb
        .from("public_cafes")
        .select("id, data")
        .like("id", "views:%");
      if (data) {
        for (const row of data) {
          const cafeId = String(row.id).replace(/^views:/, "");
          const cloudLen = Array.isArray(row.data?.viewerIds)
            ? row.data.viewerIds.length
            : 0;
          counts[cafeId] = Math.max(counts[cafeId] ?? 0, cloudLen);
        }
      }
    } catch {
      // ignore
    }
  }
  return counts;
}

export async function upsertCloudCafe(cafe: Cafe): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("public_cafes").upsert({ id: cafe.id, data: cafe });
}

export async function deleteCloudCafe(cafeId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("public_cafes").delete().eq("id", cafeId);
}

export async function fetchCloudReviews(): Promise<CafeReview[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("public_reviews")
    .select("data")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => row.data as CafeReview);
}

export async function insertCloudReview(review: CafeReview): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb
    .from("public_reviews")
    .upsert({ id: review.id, cafe_id: review.cafeId, data: review });
}

export async function deleteCloudReview(reviewId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("public_reviews").delete().eq("id", reviewId);
}

export async function fetchCloudCheckIns(): Promise<LiveCheckIn[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("public_checkins")
    .select("data")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => row.data as LiveCheckIn);
}

export async function insertCloudCheckIn(ci: LiveCheckIn): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("public_checkins").upsert({
    id: ci.id,
    cafe_id: ci.cafeId,
    data: ci,
    expires_at: ci.expiresAt,
  });
}

export async function deleteCloudCheckIn(ciId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("public_checkins").delete().eq("id", ciId);
}

export interface SiteFeedback {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  category: string;
  content: string;
  createdAt: string;
}

const FEEDBACK_LOCAL_KEY = "caferadar_feedback_v1";

export async function fetchAllFeedback(): Promise<SiteFeedback[]> {
  let localList: SiteFeedback[] = [];
  try {
    const raw = localStorage.getItem(FEEDBACK_LOCAL_KEY);
    if (raw) localList = JSON.parse(raw);
  } catch {
    localList = [];
  }

  const sb = getSupabase();
  if (sb) {
    try {
      const { data } = await sb
        .from("public_cafes")
        .select("id, data")
        .like("id", "feedback:%")
        .order("created_at", { ascending: false });
      if (data && data.length > 0) {
        return data.map((row) => row.data as SiteFeedback);
      }
    } catch {
      // fallback to local
    }
  }
  return localList;
}

export async function submitSiteFeedback(item: SiteFeedback): Promise<void> {
  try {
    const raw = localStorage.getItem(FEEDBACK_LOCAL_KEY);
    const prev: SiteFeedback[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(FEEDBACK_LOCAL_KEY, JSON.stringify([item, ...prev]));
  } catch {
    // ignore
  }
  const sb = getSupabase();
  if (sb) {
    await sb.from("public_cafes").upsert({
      id: `feedback:${item.id}`,
      data: item,
    });
  }
}

export async function deleteSiteFeedback(id: string): Promise<void> {
  try {
    const raw = localStorage.getItem(FEEDBACK_LOCAL_KEY);
    const prev: SiteFeedback[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(
      FEEDBACK_LOCAL_KEY,
      JSON.stringify(prev.filter((f) => f.id !== id))
    );
  } catch {
    // ignore
  }
  const sb = getSupabase();
  if (sb) {
    await sb.from("public_cafes").delete().eq("id", `feedback:${id}`);
  }
}
