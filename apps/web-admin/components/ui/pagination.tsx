import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const getPages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-lg border-[#e7e7e7] text-gray-500 bg-gray-50 hover:bg-gray-100"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1">
        {getPages().map((page, index) => (
          <React.Fragment key={index}>
            {typeof page === "number" ? (
              <button
                onClick={() => onPageChange(page)}
                className={cn(
                  "w-9 h-9 rounded-lg text-[13px] font-bold flex items-center justify-center transition-colors border",
                  currentPage === page
                    ? "bg-[#10b981] text-white border-[#10b981]"
                    : "bg-white text-gray-500 border-transparent hover:bg-gray-50 hover:border-[#e7e7e7]"
                )}
              >
                {page}
              </button>
            ) : (
              <div className="w-9 h-9 flex items-center justify-center text-gray-400">
                <MoreHorizontal className="h-4 w-4" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-lg border-[#e7e7e7] text-gray-500 bg-gray-50 hover:bg-gray-100"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
