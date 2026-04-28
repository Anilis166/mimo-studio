"use client";
import { useCallback, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
}

export function DropZone({ value, onChange, disabled }: DropZoneProps) {
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file (PNG, JPG, GIF, WebP).");
        return;
      }
      if (file.size > 6 * 1024 * 1024) {
        alert("Image too large. Max 6MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        onChange(typeof reader.result === "string" ? reader.result : null);
      };
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  if (value) {
    return (
      <div className="relative rounded-xl border border-white/10 bg-zinc-900/50 p-3">
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          className="absolute top-2 right-2 z-10 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 p-1 disabled:opacity-50"
          aria-label="Remove image"
        >
          <X className="size-4" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Uploaded mockup"
          className="rounded-lg max-h-64 mx-auto object-contain"
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        if (disabled) return;
        handleFile(e.dataTransfer.files?.[0]);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        "relative cursor-pointer rounded-xl border-2 border-dashed bg-zinc-900/30 transition px-6 py-10 text-center",
        hover
          ? "border-violet-400 bg-violet-500/5"
          : "border-white/15 hover:border-white/30",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div className="mx-auto size-10 rounded-full bg-zinc-800 grid place-items-center mb-3">
        <Upload className="size-5 text-zinc-300" />
      </div>
      <div className="font-medium text-zinc-100">
        Drop a UI screenshot or sketch
      </div>
      <div className="text-xs text-zinc-400 mt-1">
        PNG, JPG, GIF, WebP · up to 6MB · MiMo-V2-Omni reads it
      </div>
    </div>
  );
}
