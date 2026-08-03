"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: "md" | "lg" | "xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={cn(
          "bg-white rounded-2xl shadow-[0px_0px_4px_0px_rgba(0,0,0,0.15)] border-none w-full overflow-hidden animate-in zoom-in-95 duration-200",
          size === "md" ? "max-w-lg" : size === "lg" ? "max-w-2xl" : "max-w-4xl",
          className
        )}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e1efe5] bg-white">
          <h3 className="text-lg font-medium text-[#0B1B1E] tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto scrollbar-hide max-h-[calc(100vh-200px)]">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-5 bg-white flex items-center justify-center gap-3 w-full [&>button]:flex-1">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
