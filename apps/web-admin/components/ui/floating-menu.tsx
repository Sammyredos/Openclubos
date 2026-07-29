"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Placement = "top-end" | "bottom-end";

export function FloatingMenu({
  open,
  anchorEl,
  onClose,
  placement = "top-end",
  align = "end",
  className,
  style,
  children,
}: {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  placement?: Placement;
  align?: "start" | "center" | "end";
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  const computePosition = useCallback(() => {
    if (!open) return;
    if (!anchorEl) {
      onClose();
      return;
    }
    const menuEl = menuRef.current;
    if (!menuEl) return;

    const rect = anchorEl.getBoundingClientRect();
    const menuRect = menuEl.getBoundingClientRect();

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;
    const gap = 8;

    let left = 0;
    if (align === "start") {
      left = rect.left;
    } else if (align === "center") {
      left = rect.left + rect.width / 2 - menuRect.width / 2;
    } else {
      left = rect.right - menuRect.width;
    }
    
    left = Math.max(margin, Math.min(left, vw - margin - menuRect.width));

    const topPreferred = rect.top - menuRect.height - gap;
    const bottomPreferred = rect.bottom + gap;

    let top = placement === "bottom-end" ? bottomPreferred : topPreferred;

    const wouldOverflowTop = top < margin;
    const wouldOverflowBottom = top + menuRect.height > vh - margin;

    if (placement === "top-end" && wouldOverflowTop && !wouldOverflowBottom) top = bottomPreferred;
    if (placement === "bottom-end" && wouldOverflowBottom && !wouldOverflowTop) top = topPreferred;

    top = Math.max(margin, Math.min(top, vh - margin - menuRect.height));
    menuEl.style.left = `${left}px`;
    menuEl.style.top = `${top}px`;
    menuEl.style.visibility = "visible";
  }, [anchorEl, onClose, open, placement, align]);

  useLayoutEffect(() => {
    if (!open) return;
    const menuEl = menuRef.current;
    if (menuEl) menuEl.style.visibility = "hidden";
    const id = window.requestAnimationFrame(computePosition);
    return () => window.cancelAnimationFrame(id);
  }, [computePosition, open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target)) return;
      if (anchorEl?.contains(target)) return;
      onClose();
    };
    const onReposition = () => computePosition();

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("touchstart", onPointerDown, true);
    window.addEventListener("resize", onReposition);
    document.addEventListener("scroll", onReposition, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("touchstart", onPointerDown, true);
      window.removeEventListener("resize", onReposition);
      document.removeEventListener("scroll", onReposition, true);
    };
  }, [anchorEl, computePosition, onClose, open]);

  if (!anchorEl && !open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      className={cn("fixed transition-opacity transition-transform duration-150 ease-out", className)}
      style={{
        top: 0,
        left: 0,
        visibility: "hidden",
        zIndex: 2147483647,
        opacity: open ? 1 : 0,
        transform: open ? "scale(1)" : "scale(0.98)",
        pointerEvents: open ? "auto" : "none",
        ...style,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
