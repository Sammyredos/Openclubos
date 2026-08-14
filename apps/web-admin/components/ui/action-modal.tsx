import React from "react";
import { Modal } from "./modal";
import { AlertTriangle, Info, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export type IconType = "warning" | "danger" | "info" | "success";
export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  iconType?: IconType;
  heading: string;
  description: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
  actionVariant?: ButtonVariant;
  isActionLoading?: boolean;
}

export function ActionModal({
  isOpen,
  onClose,
  title,
  iconType = "warning",
  heading,
  description,
  actionLabel,
  onAction,
  actionVariant = "default",
  isActionLoading = false,
}: ActionModalProps) {
  
  const getIconConfig = (type: IconType) => {
    switch (type) {
      case "danger":
        return {
          bg: "bg-red-50",
          color: "text-red-600",
          icon: <Trash2 className="w-6 h-6 text-red-600" />,
        };
      case "success":
        return {
          bg: "bg-emerald-50",
          color: "text-emerald-600",
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
        };
      case "info":
        return {
          bg: "bg-blue-50",
          color: "text-blue-600",
          icon: <Info className="w-6 h-6 text-blue-600" />,
        };
      case "warning":
      default:
        return {
          bg: "bg-green-50", // Custom soft green for warnings based on brand
          color: "text-openclub-700",
          icon: <AlertTriangle className="w-6 h-6 text-openclub-700" />,
        };
    }
  };

  const config = getIconConfig(iconType);

  const footer = (
    <>
      <Button variant="outline" className="w-full font-semibold" onClick={onClose} disabled={isActionLoading}>
        Cancel
      </Button>
      <Button variant={actionVariant} className="w-full font-semibold" onClick={onAction} disabled={isActionLoading}>
        {isActionLoading ? "Processing..." : actionLabel}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer} size="md">
      <div className="flex flex-col items-center text-center py-4">
        <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-6", config.bg)}>
          {config.icon}
        </div>
        <h4 className="text-base font-semibold text-gray-900 mb-2">{heading}</h4>
        <div className="text-sm text-gray-500 max-w-[320px]">
          {description}
        </div>
      </div>
    </Modal>
  );
}
