import * as React from "react";

export default function ForgotPasswordLoading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 font-sans text-zinc-900">
      <div className="w-full max-w-[1440px] mx-auto flex justify-center relative">
        <div className="w-full flex flex-col items-center justify-center p-2 md:p-8 lg:p-16 relative">
          <div className="w-full max-w-[480px] md:max-w-[420px] lg:max-w-[730px] lg:h-[515px] flex flex-col justify-center bg-white rounded-3xl p-6 md:p-10 lg:p-16 border border-zinc-100 shadow-xs relative z-10">
            {/* Header skeleton */}
            <div className="text-center w-full mb-8 flex flex-col items-center">
              <div className="h-8 w-52 bg-zinc-200/80 rounded-lg animate-pulse mb-3" />
              <div className="h-4 w-72 bg-zinc-100 rounded-md animate-pulse" />
            </div>

            {/* Form Fields skeleton */}
            <div className="space-y-6 w-full">
              <div>
                <div className="h-4 w-28 bg-zinc-200/80 rounded animate-pulse mb-2.5" />
                <div className="h-12 w-full bg-[#f5faf6] border border-[#e1efe5] rounded-xl animate-pulse" />
              </div>
              <div className="h-12 w-full bg-emerald-600/30 rounded-xl animate-pulse mt-2" />
            </div>

            {/* Back to login skeleton */}
            <div className="mt-8 flex justify-center">
              <div className="h-4 w-28 bg-zinc-200/60 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
