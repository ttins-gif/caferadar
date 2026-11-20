"use client";

import React, { useState } from "react";
import { X, PlusCircle } from "lucide-react";
import { Cafe, District, NoiseLevel, PowerOutletCoverage } from "@/types/cafe";

interface AddCafeModalProps {
  onClose: () => void;
  onAddCafe: (cafe: Cafe) => void;
}

const DISTRICT_CENTERS: Record<District, { lat: number; lng: number }> = {
  "Quận 1": { lat: 10.7769, lng: 106.7009 },
  "Quận 3": { lat: 10.781, lng: 106.688 },
  "Bình Thạnh": { lat: 10.802, lng: 106.712 },
  "Phú Nhuận": { lat: 10.797, lng: 106.681 },
};

export default function AddCafeModal({ onClose, onAddCafe }: AddCafeModalProps) {
  const [name, setName] = useState("");
  const [district, setDistrict] = useState<District>("Quận 1");
  const [address, setAddress] = useState("");
  const [openHours, setOpenHours] = useState("07:30 – 22:30");
  const [open24h, setOpen24h] = useState(false);
  const [powerOutlets, setPowerOutlets] = useState<PowerOutletCoverage>("all");
  const [wifiDownload, setWifiDownload] = useState(75);
  const [wifiUpload, setWifiUpload] = useState(50);
  const [noiseMorning, setNoiseMorning] = useState<NoiseLevel>("quiet");
  const [noiseAfternoon, setNoiseAfternoon] = useState<NoiseLevel>("moderate");
  const [noiseEvening, setNoiseEvening] = useState<NoiseLevel>("moderate");
  const [quietForCalls, setQuietForCalls] = useState(true);
  const [ergonomicDesk, setErgonomicDesk] = useState(true);
  const [stayFriendly, setStayFriendly] = useState(true);
  const [priceRange, setPriceRange] = useState("");
  const [staffNote, setStaffNote] = useState("");
  const [sourceName, setSourceName] = useState("Google Maps");
  const [sourceUrl, setSourceUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    const base = DISTRICT_CENTERS[district];
    // Small random offset around district center for MVP demo
    const lat = base.lat + (Math.random() - 0.5) * 0.012;
    const lng = base.lng + (Math.random() - 0.5) * 0.012;

    const score = Math.min(
      9.8,
      Number(
        (
          7.0 +
          (powerOutlets === "all" ? 0.9 : powerOutlets === "scattered" ? 0.4 : 0) +
          (wifiDownload >= 50 ? 0.7 : 0.2) +
          (quietForCalls ? 0.5 : 0) +
          (ergonomicDesk ? 0.4 : 0) +
          (stayFriendly ? 0.3 : 0)
        ).toFixed(1)
      )
    );

    const newCafe: Cafe = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      district,
      address: address.trim(),
      lat,
      lng,
      openHours: open24h ? "Mở cửa 24/7" : openHours.trim() || "07:30 – 22:30",
      open24h,
      score,
      powerOutlets,
      wifiDownload: Number(wifiDownload) || 50,
      wifiUpload: Number(wifiUpload) || 30,
      wifiMeasuredAt: "Vừa xong",
      noise: {
        morning: noiseMorning,
        afternoon: noiseAfternoon,
        evening: noiseEvening,
      },
      quietForCalls,
      ergonomicDesk,
      stayFriendly,
      priceRange: priceRange.trim() || "Chưa có dữ liệu",
      staffNote: staffNote.trim(),
      sourceName,
      sourceUrl: sourceUrl.trim() || undefined,
      tags: [sourceName],
    };

    onAddCafe(newCafe);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Đóng góp quán ruột chạy deadline
            </h2>
            <p className="text-xs text-slate-500">
              Dữ liệu có cấu trúc giúp anh em lọc trong 3 giây
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên quán *
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Góc Nhỏ Work Cafe"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quận *
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value as District)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none bg-white"
              >
                <option value="Quận 1">Quận 1</option>
                <option value="Quận 3">Quận 3</option>
                <option value="Bình Thạnh">Bình Thạnh</option>
                <option value="Phú Nhuận">Phú Nhuận</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Địa chỉ *
            </label>
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="VD: 123 Pasteur, Quận 3"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tỷ lệ ổ cắm
              </label>
              <select
                value={powerOutlets}
                onChange={(e) =>
                  setPowerOutlets(e.target.value as PowerOutletCoverage)
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white outline-none"
              >
                <option value="all">Đầy đủ (100% bàn)</option>
                <option value="scattered">Rải rác (sát tường)</option>
                <option value="rare">Hiếm</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mức giá trung bình
              </label>
              <input
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                placeholder="45k–65k"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Wi-Fi Down (Mbps)
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={wifiDownload}
                onChange={(e) => setWifiDownload(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Wi-Fi Up (Mbps)
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={wifiUpload}
                onChange={(e) => setWifiUpload(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giờ mở cửa
              </label>
              <input
                disabled={open24h}
                value={open24h ? "24/7" : openHours}
                onChange={(e) => setOpenHours(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* Noise by time */}
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["Độ ồn Sáng", noiseMorning, setNoiseMorning],
                ["Độ ồn Chiều", noiseAfternoon, setNoiseAfternoon],
                ["Độ ồn Tối", noiseEvening, setNoiseEvening],
              ] as const
            ).map(([label, val, setter]) => (
              <div key={label}>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {label}
                </label>
                <select
                  value={val}
                  onChange={(e) => setter(e.target.value as NoiseLevel)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white outline-none"
                >
                  <option value="quiet">Yên tĩnh</option>
                  <option value="moderate">Hơi ồn</option>
                  <option value="busy">Đông</option>
                </select>
              </div>
            ))}
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={open24h}
                onChange={(e) => setOpen24h(e.target.checked)}
                className="rounded text-indigo-600"
              />
              Mở cửa 24/7
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={quietForCalls}
                onChange={(e) => setQuietForCalls(e.target.checked)}
                className="rounded text-indigo-600"
              />
              Yên tĩnh (họp online được)
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={ergonomicDesk}
                onChange={(e) => setErgonomicDesk(e.target.checked)}
                className="rounded text-indigo-600"
              />
              Bàn cao chuẩn công thái học
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={stayFriendly}
                onChange={(e) => setStayFriendly(e.target.checked)}
                className="rounded text-indigo-600"
              />
              Không đuổi khi ngồi lâu
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nguồn đánh giá uy tín *
              </label>
              <select
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white outline-none"
              >
                <option value="Google Maps">Google Maps</option>
                <option value="Threads">Threads</option>
                <option value="Facebook">Facebook</option>
                <option value="Trải nghiệm thực tế">Trải nghiệm thực tế</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link bài review / Google Maps (tùy chọn)
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú thực tế (có thể bỏ trống, không tự chế)
            </label>
            <textarea
              rows={2}
              value={staffNote}
              onChange={(e) => setStaffNote(e.target.value)}
              placeholder="Trích dẫn hoặc ghi chú thực tế từ nguồn..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Lưu lên bản đồ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
