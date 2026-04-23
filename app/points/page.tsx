"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, ApiPointsWallet } from "@/app/services/api";

export default function PointsWalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<ApiPointsWallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const response = await api.points.getWallet();
      if (response.success && response.data) {
        setWallet(response.data.wallet);
      }
    } catch (error) {
      console.error("Failed to load wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "tournament_reward":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      case "bonus":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        );
      case "redemption":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        );
    }
  };

  const getTransactionColor = (amount: number) => {
    return amount > 0 ? "text-[#4ADE80]" : "text-[#EF4444]";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E6C36A] mx-auto mb-4"></div>
          <p className="text-white/60">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#020617]/95 backdrop-blur-sm border-b border-white/[0.08]">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">Points Wallet</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Balance Card */}
        <div className="rounded-2xl bg-gradient-to-br from-[#E6C36A] to-[#c9a84e] p-8 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#020617]/70">Total Balance</span>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#020617" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div className="text-5xl font-bold text-[#020617] mb-1">
            {wallet?.balance.toLocaleString() || 0}
          </div>
          <div className="text-sm font-medium text-[#020617]/70">Points</div>
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Transaction History</h2>
          
          {!wallet?.transactions || wallet.transactions.length === 0 ? (
            <div className="text-center py-12">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-20">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
              <p className="text-white/40 text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {wallet.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/[0.05]">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white">
                          {transaction.description || transaction.type}
                        </h3>
                        <span className={`text-lg font-bold ${getTransactionColor(transaction.amount)}`}>
                          {transaction.amount > 0 ? "+" : ""}
                          {transaction.amount}
                        </span>
                      </div>
                      <p className="text-xs text-white/40 mb-2">
                        {formatDate(transaction.createdAt)}
                      </p>
                      {transaction.metadata && (
                        <div className="flex flex-wrap gap-2">
                          {transaction.metadata.tournamentId && (
                            <span className="text-xs px-2 py-1 rounded bg-white/[0.05] text-white/60">
                              Tournament #{transaction.metadata.tournamentId}
                            </span>
                          )}
                          {transaction.metadata.tournId && (
                            <span className="text-xs px-2 py-1 rounded bg-white/[0.05] text-white/60">
                              {transaction.metadata.tournId}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
