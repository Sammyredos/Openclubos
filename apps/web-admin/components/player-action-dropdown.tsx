"use client";

import { useState, useRef } from "react";
import { FloatingMenu } from "@/components/ui/floating-menu";

import { ChevronDown } from "lucide-react";

export function PlayerActionDropdown({
  player,
  group,
  groupingsData,
  disabled,
  onMovePlayer,
  variant = "hamburger",
  capacity = 4,
}: {
  player: any;
  group?: any;
  groupingsData: any;
  disabled?: boolean;
  onMovePlayer: (playerId: string, groupId: string | null) => void;
  variant?: "hamburger" | "assign";
  capacity?: number;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={anchorRef}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={
          variant === "hamburger"
            ? "bg-emerald-50 text-openclub-800 border border-emerald-100 text-sm font-bold rounded-md cursor-pointer focus:ring-0 opacity-0 group-hover/player:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-100 flex items-center justify-center w-[24px] h-[24px]"
            : "bg-[#f5faf6] text-[#15803D] border border-[#e1efe5] text-[11px] font-medium rounded-md px-2 py-1.5 cursor-pointer focus:ring-0 hover:bg-[#e1efe5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-1"
        }
      >
        {variant === "hamburger" ? "☰" : (
          <>
            Assign To... <ChevronDown className="w-3 h-3 opacity-50" />
          </>
        )}
      </button>
      <FloatingMenu
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        placement="bottom-end"
        className="w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden text-xs"
      >
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
          <p className="font-semibold text-gray-900 truncate">
            {player.user?.firstName} {player.user?.lastName}
          </p>
        </div>
        <div className="p-1 flex flex-col gap-0.5">
          {group && (
            <button
              onClick={() => {
                onMovePlayer(player.id, null);
                setOpen(false);
              }}
              className="text-left px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              Remove Player from this Flight
            </button>
          )}

          {groupingsData?.groups?.length > 0 && (
            <>
              {group && <div className="h-px bg-gray-100 my-1 mx-2 shrink-0" />}
              <div className="max-h-[160px] overflow-y-auto flex flex-col gap-0.5 pr-1">
                {[...groupingsData.groups].reverse().map((g: any) => {
                  if (group && g.id === group.id) return null;
                  const isFull = g.registrations?.length >= capacity;
                  
                  return (
                    <button
                      key={g.id}
                      onClick={() => {
                        onMovePlayer(player.id, g.id);
                        setOpen(false);
                      }}
                      className="text-left px-2 py-1.5 text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-between shrink-0"
                    >
                      <span className="truncate pr-2 text-[13px]">{group ? `Move Player to ${g.name}` : `Assign to ${g.name}`}</span>
                      {isFull ? (
                        <span className="text-[9px] font-bold bg-red-50 text-red-600 px-1 py-0.5 rounded uppercase tracking-wider shrink-0">
                          Full
                        </span>
                      ) : (
                        <span className="text-[9px] font-medium bg-gray-100 text-gray-500 px-1 py-0.5 rounded whitespace-nowrap shrink-0">
                          {capacity - (g.registrations?.length || 0)} left ({Math.round(((g.registrations?.length || 0) / capacity) * 100)}%)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </FloatingMenu>
    </>
  );
}
