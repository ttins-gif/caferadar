"use client";

import React, { useState } from "react";
import { X, Save } from "lucide-react";
import { Cafe, PowerOutletCoverage } from "@/types/cafe";

interface EditCafeModalProps {
  cafe: Cafe;
  onClose: () => void;
  onSave: (updated: Cafe) => void;
}

export default function EditCafeModal({
  cafe,
  onClose,
  onSave,
}: EditCafeModalProps) {
  const [name, setName] = useState(cafe.name);
  const [address, setAddress] = useState(cafe.address);
  const [priceRange, setPriceRange] = useState(cafe.priceRange);
  const [openHours, setOpenHours] = useState(cafe.openHours);
  const [open24h, setOpen24h] = useState(cafe.open24h);
  const [wifiDownload, setWifiDownload] = useState(
    cafe.wifiDownload != null ? String(cafe.wifiDownload) : ""
  );
  const [wifiUpload, setWifiUpload] = useState(
    cafe.wifiUpload != null ? String(cafe.wifiUpload) : ""
  );
  const [powerOutlets, setPowerOutlets] = useState<string>(
    cafe.powerOutlets ?? ""
  );
  const [voucher, setVoucher] = useState(cafe.voucher ?? "");
  const [staffNote, setStaffNote] = useState(cafe.staffNote);
  const [sourceName, setSourceName] = useState(cafe.sourceName);
  const [sourceUrl, setSourceUrl] = useState(cafe.sourceUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Cafe = {
      ...cafe,
      name: name.trim() || cafe.name,
      address: address.trim() || cafe.address,
      priceRange: priceRange.trim() || "Chưa có dữ liệu",
      openHours: open24h ? "Mở cửa 24/7" : openHours.trim(),
      open24h,
      wifiDownload: wifiDownload.trim() ? Number(wifiDownload) : null,
      wifiUpload: wifiUpload.trim() ? Number(wifiUpload) : null,
      wifiMeasuredAt: wifiDownload.trim() ? "Admin cập nhật" : undefined,
      powerOutlets: powerOutlets
        ? (powerOutlets as PowerOutletCoverage)
        : null,
      voucher: voucher.trim() || undefined,
      staffNote: staffNote.trim(),
      sourceName: sourceName.trim() || cafe.sourceName,
      sourceUrl: sourceUrl.trim() || cafe.sourceUrl,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-amber-50/70">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Admin — Chỉnh sửa thông tin & đánh giá quán
            </h2>
            <p className="text-xs text-slate-500">{cafe.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 overflow-y-auto space-y-3.5 text-sm"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên quán
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Địa chỉ
            </label>
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giá nước
              </label>
              <input
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Giờ mở cửa
              </label>
              <input
                disabled={open24h}
                value={open24h ? "Mở cửa 24/7" : openHours}
                onChange={(e) => setOpenHours(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none disabled:bg-slate-100"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={open24h}
              onChange={(e) => setOpen24h(e.target.checked)}
            />
            Mở cửa 24/7
          </label>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Wi-Fi Down (Mbps)
              </label>
              <input
                type="number"
                placeholder="Bỏ trống nếu chưa đo"
                value={wifiDownload}
                onChange={(e) => setWifiDownload(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Wi-Fi Up (Mbps)
              </label>
              <input
                type="number"
                placeholder="Bỏ trống"
                value={wifiUpload}
                onChange={(e) => setWifiUpload(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ổ cắm
              </label>
              <select
                value={powerOutlets}
                onChange={(e) => setPowerOutlets(e.target.value)}
                className="w-full px-2 py-2 text-xs rounded-lg border border-slate-300 bg-white outline-none"
              >
                <option value="">Chưa đo</option>
                <option value="all">Đầy đủ (100%)</option>
                <option value="scattered">Sát tường</option>
                <option value="rare">Hiếm</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ưu đãi hiện có (để trống nếu không có)
            </label>
            <input
              value={voucher}
              onChange={(e) => setVoucher(e.target.value)}
              placeholder="VD: Giảm 15% khung giờ 8h–11h..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú / Đánh giá xác thực
            </label>
            <textarea
              rows={2}
              value={staffNote}
              onChange={(e) => setStaffNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên nguồn
              </label>
              <input
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link nguồn đối chiếu
              </label>
              <input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 outline-none"
              />
            </div>
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
            >
              <Save className="w-4 h-4" /> Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
