export type District = "Quận 1" | "Quận 3" | "Bình Thạnh" | "Phú Nhuận";

export type NoiseLevel = "quiet" | "moderate" | "busy";

export type PowerOutletCoverage = "all" | "scattered" | "rare";

export type CheckInStatusType =
  | "wifi_lag"
  | "noisy_construction"
  | "crowded"
  | "quiet_available"
  | "great_vibes";

export interface LiveCheckIn {
  id: string;
  cafeId: string;
  type: CheckInStatusType;
  note?: string;
  createdAt: string; // ISO string
  expiresAt: string; // ISO string (createdAt + 6 hours)
}

export interface Cafe {
  id: string;
  name: string;
  district: District;
  address: string;
  lat: number;
  lng: number;
  openHours: string;
  open24h: boolean;
  /** Overall deadline readiness score (0 - 10) */
  score: number;
  /** Power outlet coverage */
  powerOutlets: PowerOutletCoverage;
  /** Actual measured Wi-Fi speeds in Mbps */
  wifiDownload: number;
  wifiUpload: number;
  wifiMeasuredAt: string;
  /** Noise level by time of day */
  noise: {
    morning: NoiseLevel;
    afternoon: NoiseLevel;
    evening: NoiseLevel;
  };
  /** Quick filter booleans */
  quietForCalls: boolean;
  ergonomicDesk: boolean;
  stayFriendly: boolean;
  /** Price & staff attitude */
  priceRange: string; // e.g. "45k–65k"
  staffNote: string;
  /** Credible source verification (Google Maps, Threads, Facebook, etc.) */
  sourceName?: string;
  sourceUrl?: string;
  /** Highlight / Featured listing (monetization-ready) */
  featured?: boolean;
  voucher?: string;
  tags: string[];
}

export interface QuickFilters {
  powerEveryTable: boolean;
  fastWifi: boolean; // > 50Mbps
  open24h: boolean;
  quietForCalls: boolean;
  ergonomicDesk: boolean;
  stayFriendly: boolean;
  district: District | "ALL";
  search: string;
}

export const CHECKIN_META: Record<
  CheckInStatusType,
  {
    label: string;
    shortLabel: string;
    severity: "alert" | "warning" | "positive";
    emoji: string;
  }
> = {
  wifi_lag: {
    label: "Hôm nay Wi-Fi đang lag",
    shortLabel: "Wi-Fi lag",
    severity: "alert",
    emoji: "📶",
  },
  noisy_construction: {
    label: "Quán đang sửa chữa / ồn",
    shortLabel: "Đang ồn",
    severity: "alert",
    emoji: "🔨",
  },
  crowded: {
    label: "Đang đông, sắp hết bàn",
    shortLabel: "Sắp hết bàn",
    severity: "warning",
    emoji: "👥",
  },
  quiet_available: {
    label: "Đang yên tĩnh, còn nhiều bàn",
    shortLabel: "Yên tĩnh",
    severity: "positive",
    emoji: "✨",
  },
  great_vibes: {
    label: "Wi-Fi mạnh, chạy deadline ngon",
    shortLabel: "Chạy tốt",
    severity: "positive",
    emoji: "⚡",
  },
};
