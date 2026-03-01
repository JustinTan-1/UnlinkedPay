"use client";

import { useUnlink, useUnlinkBalances, formatAmount } from "@unlink-xyz/react";
import { useAccount, useSendTransaction, useSwitchChain } from "wagmi";
import { useState, useCallback, useEffect } from "react";
import {
  Users,
  Plus,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  DollarSign,
  Upload,
} from "lucide-react";
import { MON_TOKEN_ADDRESS, monadTestnet } from "@/lib/config";
import { type Hex } from "viem";

interface Recipient {
  id: string;
  name: string;
  unlinkAddress: string;
  amount: string;
}

interface PaymentStatus {
  id: string;
  name: string;
  status: "pending" | "depositing" | "confirming" | "sending" | "sent" | "failed";
  relayId?: string;
  error?: string;
}

const recipientsKeyFor = (addr: string) => `private-payroll:recipients:${addr.toLowerCase()}`;

export function PayrollManager() {
  const { address } = useAccount();
  const { send, deposit, ready, walletExists, busy, waitForConfirmation } = useUnlink();
  const { balances, loading: balanceLoading } = useUnlinkBalances();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStep, setExecutionStep] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [csvInput, setCsvInput] = useState("");
  const [showCsvImport, setShowCsvImport] = useState(false);

  // Save helper
  const saveRecipients = useCallback((list: Recipient[]) => {
    setRecipients(list);
    if (address) {
      localStorage.setItem(recipientsKeyFor(address), JSON.stringify(list));
    }
  }, [address]);

  // Load recipients for the current wallet address
  useEffect(() => {
    if (!address) return;
    try {
      const saved = localStorage.getItem(recipientsKeyFor(address));
      setRecipients(saved ? JSON.parse(saved) : []);
    } catch {
      setRecipients([]);
    }
    setPaymentStatuses([]);
  }, [address]);

  const monBalance = balances?.[MON_TOKEN_ADDRESS.toLowerCase()] ?? 0n;

  const totalPayroll = recipients.reduce((sum, r) => {
    const amt = parseFloat(r.amount) || 0;
    return sum + amt;
  }, 0);

  const totalPayrollBigInt = BigInt(Math.floor(totalPayroll * 1e18));
  const needsDeposit = monBalance < totalPayrollBigInt;
  const depositNeeded = needsDeposit ? totalPayrollBigInt - monBalance : 0n;

  const addRecipient = () => {
    if (!newName || !newAddress || !newAmount) return;
    const updated = [
      ...recipients,
      {
        id: crypto.randomUUID(),
        name: newName,
        unlinkAddress: newAddress,
        amount: newAmount,
      },
    ];
    saveRecipients(updated);
    setNewName("");
    setNewAddress("");
    setNewAmount("");
    setShowAddForm(false);
  };

  const removeRecipient = (id: string) => {
    saveRecipients(recipients.filter((r) => r.id !== id));
  };

  const handleCsvImport = () => {
    const lines = csvInput.trim().split("\n");
    const newRecipients: Recipient[] = [];
    for (const line of lines) {
      const parts = line.split(",").map((s) => s.trim());
      if (parts.length >= 3) {
        newRecipients.push({
          id: crypto.randomUUID(),
          name: parts[0],
          unlinkAddress: parts[1],
          amount: parts[2],
        });
      }
    }
    saveRecipients([...recipients, ...newRecipients]);
    setCsvInput("");
    setShowCsvImport(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;
      const lines = text.trim().split("\n");
      const newRecipients: Recipient[] = [];
      for (const line of lines) {
        // Skip header rows that contain common column names
        if (/^(name|employee|address|amount|salary)/i.test(line.trim())) continue;
        const parts = line.split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
        if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
          newRecipients.push({
            id: crypto.randomUUID(),
            name: parts[0],
            unlinkAddress: parts[1],
            amount: parts[2],
          });
        }
      }
      if (newRecipients.length > 0) {
        saveRecipients([...recipients, ...newRecipients]);
      }
      setShowCsvImport(false);
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-uploaded
    e.target.value = "";
  };

  const executePayroll = useCallback(async () => {
    if (recipients.length === 0 || !send || !address) return;
    setIsExecuting(true);

    const statuses: PaymentStatus[] = recipients.map((r) => ({
      id: r.id,
      name: r.name,
      status: "pending" as const,
    }));
    setPaymentStatuses([...statuses]);

    try {
      // Step 1: Auto-deposit if shielded balance is insufficient
      if (needsDeposit) {
        setExecutionStep("Step 1/2 — Depositing MON into privacy pool...");
        setPaymentStatuses(
          statuses.map((s) => ({ ...s, status: "depositing" as const }))
        );

        const depositResult = await deposit([
          { token: MON_TOKEN_ADDRESS, amount: depositNeeded, depositor: address },
        ]);

        await switchChainAsync({ chainId: monadTestnet.id });
        await sendTransactionAsync({
          to: depositResult.to as Hex,
          data: depositResult.calldata as Hex,
          value: depositNeeded,
          chainId: monadTestnet.id,
        });

        // Wait for deposit to be indexed by the privacy pool
        setExecutionStep("Waiting for deposit confirmation...");
        setPaymentStatuses(
          statuses.map((s) => ({ ...s, status: "confirming" as const }))
        );
        await new Promise((r) => setTimeout(r, 10000));
      }

      // Step 2: Send payments one by one (each needs its own ZK proof)
      setExecutionStep(
        needsDeposit
          ? "Step 2/2 — Sending private payments..."
          : "Sending private payments..."
      );

      for (let i = 0; i < recipients.length; i++) {
        const r = recipients[i];
        setExecutionStep(`Paying ${r.name} (${i + 1}/${recipients.length})...`);

        // Update this recipient to "sending"
        setPaymentStatuses((prev) =>
          prev.map((s) =>
            s.id === r.id ? { ...s, status: "sending" as const } : s
          )
        );

        try {
          const amount = BigInt(Math.floor(parseFloat(r.amount) * 1e18));
          const result = await send([
            {
              token: MON_TOKEN_ADDRESS,
              recipient: r.unlinkAddress,
              amount,
            },
          ]);

          // Save relayId → employee name mapping for transaction history
          if (address && result.relayId) {
            try {
              const mapKey = `private-payroll:tx-names:${address.toLowerCase()}`;
              const existing = JSON.parse(localStorage.getItem(mapKey) || "{}");
              existing[result.relayId] = r.name;
              localStorage.setItem(mapKey, JSON.stringify(existing));
            } catch { /* ignore */ }
          }

          // Wait for on-chain confirmation before sending next payment
          // This ensures the SDK's internal note/UTXO state is updated
          try {
            await waitForConfirmation(result.relayId, { timeout: 120000 });
          } catch {
            // Relay was submitted — wait extra time for state sync
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }

          setPaymentStatuses((prev) =>
            prev.map((s) =>
              s.id === r.id
                ? { ...s, status: "sent" as const, relayId: result.relayId }
                : s
            )
          );

          // Brief pause between sends to let SDK sync internal state
          if (i < recipients.length - 1) {
            setExecutionStep(`Syncing privacy state before next payment...`);
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          console.error(`Payment to ${r.name} failed:`, e);
          setPaymentStatuses((prev) =>
            prev.map((s) =>
              s.id === r.id
                ? {
                    ...s,
                    status: "failed" as const,
                    error: errMsg,
                  }
                : s
            )
          );
        }
      }

      setExecutionStep(null);
    } catch (e) {
      setPaymentStatuses(
        statuses.map((s) =>
          s.status === "sent" || s.status === "failed"
            ? s
            : {
                ...s,
                status: "failed" as const,
                error: e instanceof Error ? e.message : "Transaction failed",
              }
        )
      );
      setExecutionStep(null);
    } finally {
      setIsExecuting(false);
    }
  }, [recipients, send, deposit, address, needsDeposit, depositNeeded, waitForConfirmation, sendTransactionAsync, switchChainAsync]);

  if (!ready || !walletExists) return null;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="text-emerald-400" size={20} />
            <h2 className="text-lg font-semibold text-white">
              Payroll Manager
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCsvImport(!showCsvImport)}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Upload size={14} />
              CSV
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={14} />
              Add Employee
            </button>
          </div>
        </div>
      </div>

      {/* CSV Import */}
      {showCsvImport && (
        <div className="p-4 border-b border-gray-800 bg-gray-800/50">
          <p className="text-xs text-gray-400 mb-2">
            Format: Name, Unlink Address, Amount (MON) — one per line
          </p>

          {/* File upload */}
          <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-700 hover:border-emerald-500 rounded-lg p-4 mb-3 cursor-pointer transition-colors">
            <Upload size={16} className="text-gray-400" />
            <span className="text-sm text-gray-400">Upload .csv file</span>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <p className="text-xs text-gray-500 text-center mb-2">— or paste below —</p>

          <textarea
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            placeholder={"Alice, unlink1abc..., 1.5\nBob, unlink1def..., 2.0"}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-500 resize-none h-20 focus:border-emerald-500 focus:outline-none font-mono"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleCsvImport}
              disabled={!csvInput.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm transition-colors"
            >
              Import
            </button>
            <button
              onClick={() => {
                setShowCsvImport(false);
                setCsvInput("");
              }}
              className="text-gray-400 hover:text-white px-4 py-1.5 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Employee Form */}
      {showAddForm && (
        <div className="p-4 border-b border-gray-800 bg-gray-800/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Employee name"
              className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="unlink1..."
              className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none font-mono"
            />
            <input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="Amount (MON)"
              step="0.01"
              className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={addRecipient}
              disabled={!newName || !newAddress || !newAmount}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-white px-4 py-1.5 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Employee List */}
      <div className="divide-y divide-gray-800">
        {recipients.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="mx-auto text-gray-700 mb-3" size={40} />
            <p className="text-gray-500 text-sm">
              No employees added yet. Add employees to start private payroll.
            </p>
          </div>
        ) : (
          recipients.map((r) => {
            const ps = paymentStatuses.find((s) => s.id === r.id);
            return (
              <div
                key={r.id}
                className="flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-sm font-medium text-emerald-400">
                    {r.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{r.name}</p>
                    <p className="text-xs text-gray-500 font-mono truncate">
                      {r.unlinkAddress}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {r.amount} MON
                    </p>
                    {ps && (
                      <div className="text-right">
                        <p
                          className={`text-xs ${
                            ps.status === "sent"
                              ? "text-emerald-400"
                              : ps.status === "failed"
                              ? "text-red-400"
                              : ps.status === "sending"
                              ? "text-yellow-400"
                              : "text-gray-500"
                          }`}
                        >
                          {ps.status === "sending" && (
                            <Loader2
                              size={10}
                              className="inline mr-1 animate-spin"
                            />
                          )}
                          {ps.status === "sent" && (
                            <CheckCircle size={10} className="inline mr-1" />
                          )}
                          {ps.status === "failed" && (
                            <XCircle size={10} className="inline mr-1" />
                          )}
                          {ps.status}
                        </p>
                        {ps.error && (
                          <p className="text-xs text-red-400/70 max-w-[200px] truncate" title={ps.error}>
                            {ps.error}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {!isExecuting && (
                    <button
                      onClick={() => removeRecipient(r.id)}
                      className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Execute */}
      {recipients.length > 0 && (
        <div className="p-4 border-t border-gray-800 bg-gray-800/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-gray-400" />
              <span className="text-sm text-gray-400">Total Payroll</span>
            </div>
            <span className="text-lg font-bold text-white">
              {totalPayroll.toFixed(4)} MON
            </span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Shielded Balance</span>
            {balanceLoading ? (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Loader2 size={12} className="animate-spin text-emerald-400" />
                Updating...
              </span>
            ) : (
              <span className="text-xs text-gray-400">
                {formatAmount(monBalance, 18)} MON
              </span>
            )}
          </div>
          {needsDeposit && (
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Auto-deposit needed</span>
              <span className="text-xs text-yellow-400">
                +{formatAmount(depositNeeded, 18)} MON from wallet
              </span>
            </div>
          )}

          {executionStep && (
            <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-800 rounded-lg p-3 my-3">
              <Loader2 size={14} className="text-emerald-400 animate-spin" />
              <p className="text-sm text-emerald-400">{executionStep}</p>
            </div>
          )}

          <button
            onClick={executePayroll}
            disabled={isExecuting || busy || !address}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors mt-2"
          >
            {isExecuting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Executing UnlinkedPay...
              </>
            ) : (
              <>
                <Send size={18} />
                {needsDeposit
                  ? `Deposit & Pay ${recipients.length} Employee${recipients.length !== 1 ? "s" : ""}`
                  : `Pay ${recipients.length} Employee${recipients.length !== 1 ? "s" : ""} Privately`}
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {needsDeposit
              ? "Your wallet will be prompted to deposit, then payments are sent privately through the pool."
              : "All payments are sent through Unlink\u2019s privacy pool \u2014 amounts and recipients are hidden on-chain."}
          </p>
        </div>
      )}
    </div>
  );
}
