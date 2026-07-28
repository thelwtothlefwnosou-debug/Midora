"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = {
  file: File;
  open: boolean;
  onClose: () => void;
  onConfirm: (blob: Blob) => void;
};

const OUTPUT_SIZE = 512;

export function AvatarCropModal({ file, open, onClose, onConfirm }: Props) {
  const t = useTranslations("Owner.avatarCrop");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!open) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file, open]);

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#f5f0e8";
    ctx.fillRect(0, 0, size, size);

    const baseScale = Math.max(size / img.width, size / img.height);
    const scale = baseScale * zoom;
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (size - w) / 2 + offset.x;
    const y = (size - h) / 2 + offset.y;
    ctx.drawImage(img, x, y, w, h);
  }, [zoom, offset]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview, previewUrl]);

  function handlePointerDown(e: React.PointerEvent) {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  }

  function handlePointerUp() {
    setDragging(false);
  }

  async function handleConfirm() {
    const img = imgRef.current;
    if (!img) return;
    setProcessing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unsupported");

      const previewSize = 280;
      const baseScale = Math.max(previewSize / img.width, previewSize / img.height);
      const scale = baseScale * zoom;
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (previewSize - w) / 2 + offset.x;
      const y = (previewSize - h) / 2 + offset.y;
      const ratio = OUTPUT_SIZE / previewSize;
      ctx.drawImage(img, x * ratio, y * ratio, w * ratio, h * ratio);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Crop failed"))),
          file.type === "image/png" ? "image/png" : "image/jpeg",
          0.92
        );
      });
      onConfirm(blob);
    } finally {
      setProcessing(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal
        aria-labelledby="crop-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-float"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="crop-title" className="font-display text-lg font-semibold text-charcoal">
            {t("title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-sand"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="mx-auto flex justify-center">
            <div className="relative overflow-hidden rounded-full ring-2 ring-gold/30">
              <canvas
                ref={canvasRef}
                width={280}
                height={280}
                className={cn("touch-none", dragging ? "cursor-grabbing" : "cursor-grab")}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-sand"
              aria-label={t("zoomOut")}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <input
              type="range"
              min={0.5}
              max={2.5}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-40 accent-gold"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-sand"
              aria-label={t("zoomIn")}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-muted">{t("hint")}</p>
        </div>

        <div className="flex gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-charcoal hover:bg-sand"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-gold py-2.5 text-sm font-semibold text-white hover:bg-gold-dark disabled:opacity-60"
          >
            {processing ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
