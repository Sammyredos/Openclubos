"use client";

import React, { useState, useEffect } from "react";
import { Users, CheckCircle2, UserMinus, Search, Clock, ShieldAlert, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getRegistrations, updateRegistrationStatus, deleteRegistration, type RegistrationListItem } from "@/lib/api/registrations";
import { cn, formatWithCommas } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  tournamentName: string;
  onUpdate?: () => void;
}

export function WaitlistModal({
  isOpen,
  onClose,
  tournamentId,
  tournamentName,
  onUpdate,
}: WaitlistModalProps) {
  const [loading, setLoading] = useState(true);
  const [waitlist, setWaitlist] = useState<RegistrationListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchWaitlist = async () => {
    if (!tournamentId) return;
    setLoading(true);
    try {
      const { items } = await getRegistrations({
        tournamentId,
        status: "WAITLISTED",
      });
      setWaitlist(items || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch waitlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWaitlist();
    }
  }, [isOpen, tournamentId]);

  const handleApprove = async (registrationId: string) => {
    setActionId(registrationId);
    try {
      await updateRegistrationStatus(registrationId, "APPROVED");
      toast.success("Player moved from waitlist to registered list");
      setWaitlist(prev => prev.filter(item => item.id !== registrationId));
      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve player");
    } finally {
      setActionId(null);
    }
  };

  const handleRemove = async (registrationId: string) => {
    if (!confirm("Are you sure you want to remove this player from the waitlist?")) return;
    setActionId(registrationId);
    try {
      await deleteRegistration(registrationId);
      toast.success("Player removed from waitlist");
      setWaitlist(prev => prev.filter(item => item.id !== registrationId));
      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove player");
    } finally {
      setActionId(null);
    }
  };

  const filteredWaitlist = waitlist.filter(item => {
    const q = searchQuery.toLowerCase();
    const fullName = `${item.user?.firstName || ""} ${item.user?.lastName || ""}`.toLowerCase();
    const email = (item.user?.email || "").toLowerCase();
    return fullName.includes(q) || email.includes(q);
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tournament Waitlist"
      size="xl"
      footer={
        <Button variant="outline" onClick={onClose} className="rounded-xl font-bold">
          Close Waitlist
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-emerald-600 font-bold uppercase tracking-wider">Queue Management</p>
            <h4 className="text-[17px] font-bold text-gray-900 truncate">{tournamentName}</h4>
          </div>
          <div className="text-right">
            <p className="text-[16px] font-black text-emerald-600 leading-none">{formatWithCommas(waitlist.length)}</p>
            <p className="text-[11px] text-emerald-600/70 font-bold uppercase tracking-widest mt-1">Waiting</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search waitlist by name or email..."
            className="pl-10 h-12 bg-gray-50/50 border-[#e7e7e7] focus:bg-white rounded-xl text-[14px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="border border-[#e7e7e7] rounded-2xl overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-[#e7e7e7]">
                <th className="px-6 py-4">Player Details</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32 rounded" />
                          <Skeleton className="h-3 w-40 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-24 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-9 w-24 rounded-lg" />
                        <Skeleton className="h-9 w-24 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredWaitlist.length > 0 ? (
                filteredWaitlist.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[14px] border border-emerald-100">
                          {item.user?.firstName?.[0] || item.user?.email?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-gray-900 leading-tight">
                            {item.user?.firstName} {item.user?.lastName}
                          </p>
                          <p className="text-[12px] text-gray-500 mt-0.5">{item.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-gray-700">
                          {new Date(item.registeredAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium">
                          {new Date(item.registeredAt).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={() => handleApprove(item.id)}
                          disabled={actionId === item.id}
                          className="h-9 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200/50 shadow-none rounded-lg text-[12px] font-bold gap-2 px-3"
                        >
                          {actionId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleRemove(item.id)}
                          disabled={actionId === item.id}
                          variant="ghost"
                          className="h-9 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-[12px] font-bold gap-2 px-3"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center border border-dashed border-[#e7e7e7]">
                        <Clock className="w-8 h-8 text-gray-200" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[15px] font-bold text-gray-900">Waitlist is empty</p>
                        <p className="text-[13px] text-gray-400">No players currently in the queue for this tournament.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Warning Note */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-4">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-[12px] text-amber-700 leading-relaxed font-medium">
            <strong>Capacity Note:</strong> Approving a player from the waitlist will automatically increment the tournament's maximum player limit if the tournament is already full.
          </p>
        </div>
      </div>
    </Modal>
  );
}
