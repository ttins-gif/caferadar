export type District = string;

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

export interface CafeReview {
  id: string;
  cafeId: string;
  authorName: string;
  rating: number; // 1 - 5
  wifiDownload?: number;
  powerOutlets?: PowerOutletCoverage;
  comment: string;
  createdAt: string;
}

export interface Cafe {
  id: string;
  name: string;
  district: District;
  address: string;
  lat: number;
  lng: number;
  openHours: string;
  /** Giờ mở / đóng định dạng HH:mm (giờ Việt Nam) để tính trạng thái real-time */
  openTime?: string;
  closeTime?: string;
  open24h: boolean;
  /** Điểm đánh giá (null nếu chưa có dữ liệu đo/đánh giá thực tế) */
  score: number | null;
  /** Tỷ lệ ổ cắm (null nếu chưa xác thực) */
  powerOutlets: PowerOutletCoverage | null;
  /** Tốc độ Wi-Fi thực tế Mbps (null nếu chưa đo thực tế) */
  wifiDownload: number | null;
  wifiUpload: number | null;
  wifiMeasuredAt?: string;
  /** Độ ồn theo khung giờ (null nếu chưa có dữ liệu thực tế) */
  noise?: {
    morning: NoiseLevel;
    afternoon: NoiseLevel;
    evening: NoiseLevel;
  };
  /** Quick filter booleans */
  quietForCalls: boolean;
  ergonomicDesk: boolean;
  stayFriendly: boolean;
  /** Giá nước tham khảo từ nguồn công khai */
  priceRange: string;
  staffNote: string;
  /** Nguồn đối chiếu công khai uy tín */
  sourceName: string;
  sourceUrl: string;
  featured?: boolean;
  /** Ưu đãi hiện có (nếu có xác thực từ quán) */
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
