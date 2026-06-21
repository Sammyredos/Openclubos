"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";
import { LogOut, RefreshCw, Clock } from "lucide-react";

const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes
const COUNTDOWN_SECS = 60;              // 60-second countdown before auto-logout

export function InactivityGuard() {
  const { isAuthenticated, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const showModalRef = useRef(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const deadline = useRef(0);

  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCountdownRef = useRef<() => void>(() => {});
  const startCountdownRef = useRef<() => void>(() => {});

  stopCountdownRef.current = useCallback(() => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
  }, []);

  startCountdownRef.current = useCallback(() => {
    // GUARD: Clear any existing interval first
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }

    deadline.current = Date.now() + COUNTDOWN_SECS * 1000;

    // Immediate update
    const initialRemaining = Math.max(
      0,
      Math.ceil((deadline.current - Date.now()) / 1000)
    );
    setCountdown(initialRemaining);

    // Interval reads from ref directly — no stale closure
    countdownTimer.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000)
      );
      setCountdown(remaining);
      if (remaining <= 0) {
        if (countdownTimer.current) {
          clearInterval(countdownTimer.current);
          countdownTimer.current = null;
        }
      }
    }, 1000);
  }, []); // NO dependencies

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      showModalRef.current = true;
      setShowModal(true);
      startCountdownRef.current();
    }, INACTIVITY_MS);
  }, []);

  // Auto-logout when countdown hits 0
  useEffect(() => {
    if (showModal && countdown === 0) {
      stopCountdownRef.current();
      showModalRef.current = false;
      setShowModal(false);
      logout();
    }
  }, [showModal, countdown, logout]);

  // Attach / detach activity listeners
  useEffect(() => {
    if (!isAuthenticated) {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      stopCountdownRef.current();
      showModalRef.current = false;
      setShowModal(false);
      return;
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

    const onActivity = () => {
      if (!showModalRef.current) resetInactivityTimer();
    };

    events.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }));
    resetInactivityTimer(); // Start timer on mount

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, onActivity));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      stopCountdownRef.current();
    };
  }, [isAuthenticated, resetInactivityTimer]);

  const handleContinue = () => {
    stopCountdownRef.current();
    showModalRef.current = false;
    setShowModal(false);
    resetInactivityTimer();
  };

  const handleLogout = () => {
    stopCountdownRef.current();
    showModalRef.current = false;
    setShowModal(false);
    logout();
  };

  if (!isAuthenticated || !showModal) return null;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (countdown / COUNTDOWN_SECS) * circumference;
  const isUrgent = countdown <= 15;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="flex flex-col items-center gap-4 px-8 pt-10 pb-6 border-b border-gray-50">
          {/* Circular countdown */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32" cy="32" r={radius}
                strokeWidth="4"
                fill="none"
                stroke="#f1f5f9"
              />
              <circle
                cx="32" cy="32" r={radius}
                strokeWidth="4"
                fill="none"
                stroke={isUrgent ? "#ef4444" : "#15803D"}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span
              className={cn(
                "relative text-[16px] font-normal tabular-nums transition-colors",
                isUrgent ? "text-red-500" : "text-gray-800"
              )}
            >
              {countdown}
            </span>
          </div>

          <div className="text-center">
            <h3 className="text-[14px] font-normal text-gray-900">Session Expiring Soon</h3>
            <p className="text-[14px] text-gray-500 mt-1">
              You've been inactive for 10 minutes. Your session will end in{" "}
              <span className={cn("font-normal", isUrgent ? "text-red-500" : "text-gray-700")}>
                {countdown}s
              </span>
              .
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="mx-8 mt-6 flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <p className="text-[13px] font-normal text-amber-800 leading-snug">
            For your security, inactive sessions are automatically ended. Continue to stay logged in.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 px-8 pt-6 pb-8">
          <button
            onClick={handleContinue}
            className="w-full h-12 bg-[#15803D] hover:bg-[#166534] text-white rounded-xl font-normal text-[15px] flex items-center justify-center gap-2 transition-colors shadow-sm shadow-emerald-200"
          >
            <RefreshCw className="w-5 h-5" />
            Continue Session
          </button>
          <button
            onClick={handleLogout}
            className="w-full h-12 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-700 rounded-xl font-normal text-[15px] flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
