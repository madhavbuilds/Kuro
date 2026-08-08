"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  DOWNLOAD_MAC,
  DOWNLOAD_WIN,
  DOWNLOAD_WIN_PORTABLE,
  RELEASES_URL,
} from "@/lib/constants";

const btnBase =
  "inline-flex items-center gap-2 border-2 border-black px-[18px] py-[15px] font-pix text-[11px] tracking-[1px] no-underline transition-[transform,box-shadow,background] duration-100";

const primaryStyles =
  "bg-pink text-[#2a1116] shadow-[5px_5px_0_#000] hover:bg-pink2 active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0_#000]";

type Props = {
  label?: string;
  className?: string;
  align?: "left" | "right";
};

export function DownloadButton({
  label = "DOWNLOAD",
  className = "",
  align = "right",
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={`${btnBase} ${primaryStyles} cursor-pointer`}
      >
        {label}
        <span aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className={`absolute top-[calc(100%+10px)] z-50 w-[280px] border-2 border-line2 bg-panel shadow-[6px_6px_0_rgba(0,0,0,0.55)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="border-b-2 border-line px-3 py-2 font-pix text-[9px] tracking-[1px] text-muted">
            CHOOSE YOUR PLATFORM
          </div>

          <a
            role="menuitem"
            href={DOWNLOAD_MAC}
            className="flex items-start gap-3 border-b-2 border-line px-3 py-3 text-ink no-underline transition-colors hover:bg-bg2"
            onClick={() => setOpen(false)}
          >
            <span className="mt-0.5 text-lg leading-none" aria-hidden="true">
              
            </span>
            <span>
              <span className="block font-pix text-[10px] tracking-[1px]">
                macOS
              </span>
              <span className="mt-1 block text-[12px] text-muted">
                Kuro-1.0.0-universal.dmg · Apple Silicon + Intel
              </span>
            </span>
          </a>

          <a
            role="menuitem"
            href={DOWNLOAD_WIN}
            className="flex items-start gap-3 border-b-2 border-line px-3 py-3 text-ink no-underline transition-colors hover:bg-bg2"
            onClick={() => setOpen(false)}
          >
            <span className="mt-0.5 text-lg leading-none" aria-hidden="true">
              ⊞
            </span>
            <span>
              <span className="block font-pix text-[10px] tracking-[1px]">
                Windows
              </span>
              <span className="mt-1 block text-[12px] text-muted">
                Kuro-Setup-1.0.0.exe · installer
              </span>
            </span>
          </a>

          <a
            role="menuitem"
            href={DOWNLOAD_WIN_PORTABLE}
            className="flex items-start gap-3 border-b-2 border-line px-3 py-3 text-ink no-underline transition-colors hover:bg-bg2"
            onClick={() => setOpen(false)}
          >
            <span className="mt-0.5 text-lg leading-none" aria-hidden="true">
              ⊞
            </span>
            <span>
              <span className="block font-pix text-[10px] tracking-[1px]">
                Windows portable
              </span>
              <span className="mt-1 block text-[12px] text-muted">
                Kuro-Portable-1.0.0.exe · no install
              </span>
            </span>
          </a>

          <a
            href={RELEASES_URL}
            target="_blank"
            rel="noreferrer"
            className="block px-3 py-2.5 text-center font-pix text-[8px] tracking-[1px] text-muted no-underline hover:text-pink"
            onClick={() => setOpen(false)}
          >
            ALL RELEASES →
          </a>
        </div>
      )}
    </div>
  );
}
