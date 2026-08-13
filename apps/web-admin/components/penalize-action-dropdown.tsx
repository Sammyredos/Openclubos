"use client";

import { useState, useRef } from "react";
import { FloatingMenu } from "@/components/ui/floating-menu";
import { MoreHorizontal, ShieldAlert, RotateCcw, Ban, CheckCircle2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PenalizeActionDropdown({
  player,
  selectedTournament,
  openStrokeModal,
  openDisqualify,
  openEnablePlayer,
}: {
  player: any;
  selectedTournament: any;
  openStrokeModal: (player: any, action: "ADD_1" | "ADD_2" | "CLEAR") => void;
  openDisqualify: (player: any) => void;
  openEnablePlayer: (player: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  
  const isDisqualified = player.status === "DISQUALIFIED";
  const disabledActions = selectedTournament.statusKey === "CANCELLED" || selectedTournament.statusKey === "COMPLETED";

  if (disabledActions) return null;

  return (
    <>
      <Button
        ref={anchorRef}
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        title="Penalize Player"
        className={cn(
          "h-9 w-9 p-0 bg-white rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center transition-colors",
          open && "bg-gray-50 ring-2 ring-gray-100"
        )}
      >
        <UserCog className="w-4 h-4" />
      </Button>
      
      <FloatingMenu
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        placement="bottom-end"
      >
        <div className="w-48 py-1 bg-white rounded-xl shadow-[0px_4px_16px_rgba(0,0,0,0.1)] border border-gray-200 flex flex-col z-50">
          {!isDisqualified ? (
            <>
              <button
                className="w-full px-3 py-2 flex items-center justify-between text-left text-[13px] text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={(player.extraStrokes ?? 0) === 1}
                onClick={() => {
                  openStrokeModal(player, "ADD_1");
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>+1 Stroke</span>
                </div>
              </button>
              <button
                className="w-full px-3 py-2 flex items-center justify-between text-left text-[13px] text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={(player.extraStrokes ?? 0) === 2}
                onClick={() => {
                  openStrokeModal(player, "ADD_2");
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>+2 Strokes</span>
                </div>
              </button>
              
              {(player.extraStrokes ?? 0) > 0 && (
                <button
                  className="w-full px-3 py-2 flex items-center justify-between text-left text-[13px] text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  onClick={() => {
                    openStrokeModal(player, "CLEAR");
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-gray-500" />
                    <span>Clear Penalties</span>
                  </div>
                </button>
              )}
              
              <div className="h-px bg-gray-100 my-1 mx-2"></div>
              
              <button
                className="w-full px-3 py-2 flex items-center justify-between text-left text-[13px] text-red-600 hover:bg-red-50 transition-colors font-medium"
                onClick={() => {
                  openDisqualify(player);
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <Ban className="w-4 h-4" />
                  <span>Disqualify Player</span>
                </div>
              </button>
            </>
          ) : (
            <button
              className="w-full px-3 py-2 flex items-center justify-between text-left text-[13px] text-emerald-600 hover:bg-emerald-50 transition-colors font-medium"
              onClick={() => {
                openEnablePlayer(player);
                setOpen(false);
              }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Restore Player</span>
              </div>
            </button>
          )}
        </div>
      </FloatingMenu>
    </>
  );
}
