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
          "bg-white rounded-3xl shadow-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200",
          size === "md" ? "max-w-lg" : size === "lg" ? "max-w-2xl" : "max-w-4xl",
          className
        )}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50">
          <h3 className="text-[14px] font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="px-8 py-6 overflow-y-auto scrollbar-hide max-h-[calc(100vh-200px)]">
          {children}
        </div>

        {footer && (
          <div className="px-8 py-6 border-t border-gray-50 flex items-center justify-end gap-3 bg-gray-50/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
