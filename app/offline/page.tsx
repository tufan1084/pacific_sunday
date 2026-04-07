"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748B"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>
      <h1 className="mb-2 text-xl font-semibold text-white">You&apos;re Offline</h1>
      <p className="mb-8 max-w-sm text-[14px] text-[#94A3B8]">
        It looks like you&apos;ve lost your internet connection. Some features
        may be unavailable until you&apos;re back online.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-xl px-8 py-3 text-[14px] font-semibold text-[#0B1120]"
        style={{
          background: "linear-gradient(135deg, #E6C36A 0%, #f0d48a 100%)",
        }}
      >
        Try Again
      </button>
    </div>
  );
}
