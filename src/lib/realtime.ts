import { Cafe } from "@/types/cafe";

export interface RealtimeOpenStatus {
  isOpen: boolean;
  label: string;
}

/**
 * Tính trạng thái Đang mở cửa / Đã đóng cửa theo giờ Việt Nam thực tế (UTC+7 / Asia/Ho_Chi_Minh).
 */
export function getRealtimeOpenStatus(cafe: Cafe, now = new Date()): RealtimeOpenStatus {
  if (cafe.open24h) {
    return { isOpen: true, label: "Đang mở cửa (24/7)" };
  }
  if (!cafe.openTime || !cafe.closeTime) {
    return { isOpen: true, label: cafe.openHours };
  }

  const vnTimeStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  const [curH, curM] = vnTimeStr.split(":").map(Number);
  const [openH, openM] = cafe.openTime.split(":").map(Number);
  const [closeH, closeM] = cafe.closeTime.split(":").map(Number);

  const curMins = curH * 60 + curM;
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;

  const isOpen =
    closeMins > openMins
      ? curMins >= openMins && curMins < closeMins
      : curMins >= openMins || curMins < closeMins;

  return isOpen
    ? { isOpen: true, label: `Đang mở • đóng lúc ${cafe.closeTime}` }
    : { isOpen: false, label: `Đã đóng • mở lúc ${cafe.openTime}` };
}
