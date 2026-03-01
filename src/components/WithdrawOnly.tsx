"use client";

import { useUnlink, useUnlinkBalances } from "@unlink-xyz/react";
import { formatAmount } from "@unlink-xyz/react";
import { useState } from "react";
import { ArrowUpFromLine, Loader2 } from "lucide-react";
import { MON_TOKEN_ADDRESS } from "@/lib/config";

export function WithdrawOnly() {
  const { withdraw, ready, walletExists, busy } = useUnlink();
  const { balances, loading: balanceLoading } = useUnlinkBalances();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [withdrawPending, setWithdrawPending] = useState(false);

  const monBalance = balances?.[MON_TOKEN_ADDRESS.toLowerCase()] ?? 0n;
  const isBalanceLoading = balanceLoading || withdrawPending;

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawAddress) return;
    try {
      setError(null);
      setStatus("Generating withdrawal proof...");
      setWithdrawPending(true);
      const amount = BigInt(Math.floor(parseFloat(withdrawAmount) * 1e18));
      await withdraw([
        { token: MON_TOKEN_ADDRESS, amount, recipient: withdrawAddress },
      ]);
      setStatus("Withdrawal submitted! Updating balance...");
      setWithdrawAmount("");
      setWithdrawAddress("");
      // Keep pending until balanceLoading cycle completes
      setTimeout(() => {
        setWithdrawPending(false);
        setStatus(null);
      }, 8000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Withdrawal failed");
      setStatus(null);
      setWithdrawPending(false);
    }
  };

  if (!ready || !walletExists) return null;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex items-center gap-2 p-6 border-b border-gray-800">
        <ArrowUpFromLine size={20} className="text-emerald-400" />
        <h2 className="text-lg font-semibold text-white">Withdraw</h2>
      </div>

      <div className="p-6">
        <div className={`bg-gray-800 rounded-lg p-4 mb-4 transition-all ${isBalanceLoading ? "border border-emerald-800 animate-pulse" : ""}`}>
          <p className="text-xs text-gray-500 mb-1">Shielded Balance</p>
          <div className="flex items-center gap-2">
            {isBalanceLoading ? (
              <>
                <Loader2 size={22} className="text-emerald-400 animate-spin" />
                <p className="text-lg text-gray-400">Updating balance...</p>
              </>
            ) : (
              <p className="text-2xl font-bold text-white">
                {formatAmount(monBalance, 18)} <span className="text-sm text-gray-400">MON</span>
              </p>
            )}
          </div>
        </div>

        {status && (
          <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-800 rounded-lg p-3 mb-4">
            <Loader2 size={14} className="text-emerald-400 animate-spin" />
            <p className="text-sm text-emerald-400">{status}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Amount (MON)</label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.0"
              step="0.01"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Your Wallet Address (0x...)</label>
            <input
              type="text"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none font-mono text-sm"
            />
          </div>
          <button
            onClick={handleWithdraw}
            disabled={!withdrawAmount || !withdrawAddress || busy}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
          >
            {busy ? "Processing..." : "Withdraw to Wallet"}
          </button>
          <p className="text-xs text-gray-500">
            Withdrawals unshield your tokens to any address. The sender (you) remains hidden.
          </p>
        </div>
      </div>
    </div>
  );
}
