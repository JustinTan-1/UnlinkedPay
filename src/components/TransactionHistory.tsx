"use client";

import { useUnlinkHistory, formatAmount } from "@unlink-xyz/react";
import { useUnlink } from "@unlink-xyz/react";
import {
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useAccount } from "wagmi";

interface NamedRecipient {
  name: string;
  unlinkAddress: string;
}

export function TransactionHistory({ recipients = [], isEmployeeView = false }: { recipients?: NamedRecipient[]; isEmployeeView?: boolean }) {
  const { address } = useAccount();
  const { ready, walletExists } = useUnlink();
  const { history, loading, refresh } = useUnlinkHistory();

  // Build a txHash/relayId → employee name lookup from stored payroll data
  const txNameMap: Record<string, string> = {};
  if (typeof window !== "undefined" && address) {
    try {
      const stored = localStorage.getItem(`private-payroll:tx-names:${address.toLowerCase()}`);
      if (stored) Object.assign(txNameMap, JSON.parse(stored));
    } catch { /* ignore */ }
  }

  if (!ready || !walletExists) return null;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="text-emerald-400" size={20} />
            <h2 className="text-lg font-semibold text-white">
              Transaction History
            </h2>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-800">
        {loading && history.length === 0 ? (
          <div className="p-8 text-center">
            <Loader2 className="mx-auto text-emerald-400 animate-spin mb-3" size={24} />
            <p className="text-sm text-gray-500">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center">
            <History className="mx-auto text-gray-700 mb-3" size={40} />
            <p className="text-gray-500 text-sm">No transactions yet</p>
          </div>
        ) : (
          history.slice(0, 20).map((entry) => {
            const isIncoming =
              entry.kind === "Deposit" || entry.kind === "Receive";
            const isSend = entry.kind === "Send";
            const isWithdraw = entry.kind === "Withdraw";

            // Resolve employee name from stored tx mapping
            const employeeName = isSend && !isEmployeeView && entry.txHash ? txNameMap[entry.txHash] ?? null : null;

            // Determine display label based on view
            let label: string = entry.kind;
            if (isEmployeeView) {
              if (entry.kind === "Receive") label = "Salary Received";
              else if (isWithdraw) label = "Withdrawn to Wallet";
              else if (isSend) label = "Withdrawn";
            } else {
              if (isSend) label = employeeName ? `Sent to ${employeeName}` : "Sent (Payroll)";
            }

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isIncoming
                        ? "bg-emerald-900/50 text-emerald-400"
                        : "bg-orange-900/50 text-orange-400"
                    }`}
                  >
                    {isSend ? (
                      <Send size={16} />
                    ) : isIncoming ? (
                      <ArrowDownLeft size={16} />
                    ) : (
                      <ArrowUpRight size={16} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.status === "confirmed" ? (
                        <span className="text-emerald-400">Confirmed</span>
                      ) : entry.status === "pending" ? (
                        <span className="text-yellow-400">Pending</span>
                      ) : (
                        <span className="text-red-400">Failed</span>
                      )}
                      {entry.txHash && (
                        <span className="ml-2 font-mono">
                          {entry.txHash.slice(0, 8)}...
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {entry.amounts.map((a, i) => {
                    const delta = BigInt(a.delta);
                    const isPositive = delta >= 0n;
                    const absValue = isPositive ? delta : -delta;
                    return (
                      <p
                        key={i}
                        className={`text-sm font-medium ${
                          isPositive ? "text-emerald-400" : "text-orange-400"
                        }`}
                      >
                        {isPositive ? "+" : "-"}
                        {formatAmount(absValue, 18)} MON
                      </p>
                    );
                  })}
                  {entry.timestamp && (
                    <p className="text-xs text-gray-500">
                      {new Date(entry.timestamp > 1e12 ? entry.timestamp : entry.timestamp * 1000).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
