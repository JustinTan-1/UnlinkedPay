"use client";

import { useUnlink } from "@unlink-xyz/react";
import { useAccount } from "wagmi";
import { useState, useEffect, useRef, useCallback } from "react";
import { Shield, Key, Copy, Check, AlertCircle, RefreshCw } from "lucide-react";

const UNLINK_OWNER_KEY = "private-payroll:unlink-owner";
// Per-EOA mnemonic storage so wallets persist across account switches
const walletKeyFor = (addr: string) => `private-payroll:wallet:${addr.toLowerCase()}`;

export function UnlinkWalletSetup() {
  const { address } = useAccount();
  const {
    walletExists,
    ready,
    activeAccount,
    accounts,
    createWallet,
    importWallet,
    createAccount,
    clearWallet,
  } = useUnlink();

  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [importInput, setImportInput] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const switchingForRef = useRef<string | null>(null);

  // Restore a saved wallet for the given EOA address
  const restoreWalletFor = useCallback(async (addr: string) => {
    const saved = localStorage.getItem(walletKeyFor(addr));
    if (!saved) return false;
    try {
      await importWallet(saved);
      await createAccount();
      localStorage.setItem(UNLINK_OWNER_KEY, addr.toLowerCase());
      return true;
    } catch (e) {
      console.error("Failed to restore wallet for", addr, e);
      // Mnemonic might be corrupt — remove it
      localStorage.removeItem(walletKeyFor(addr));
      return false;
    }
  }, [importWallet, createAccount]);

  // Switch Unlink wallet when connected EOA changes
  useEffect(() => {
    if (!ready || !address || isSwitching) return;
    const addrLower = address.toLowerCase();
    // Don't re-trigger for the same address
    if (switchingForRef.current === addrLower) return;

    const storedOwner = localStorage.getItem(UNLINK_OWNER_KEY);

    if (walletExists) {
      if (storedOwner === null) {
        // Legacy wallet — claim for current address
        localStorage.setItem(UNLINK_OWNER_KEY, addrLower);
      } else if (storedOwner.toLowerCase() !== addrLower) {
        // Wallet belongs to a different EOA — swap wallets
        setIsSwitching(true);
        switchingForRef.current = addrLower;
        clearWallet()
          .then(async () => {
            setMnemonic(null);
            setError(null);
            // Try to restore the new EOA's saved wallet
            const restored = await restoreWalletFor(addrLower);
            if (!restored) {
              // No saved wallet — user will see the create UI
              localStorage.removeItem(UNLINK_OWNER_KEY);
            }
          })
          .catch((e) => {
            console.error("Failed to switch wallet:", e);
            localStorage.removeItem(UNLINK_OWNER_KEY);
          })
          .finally(() => {
            setIsSwitching(false);
          });
      }
    } else {
      // No wallet exists — try restoring a saved one for this EOA
      if (!storedOwner || storedOwner.toLowerCase() !== addrLower) {
        const saved = localStorage.getItem(walletKeyFor(addrLower));
        if (saved) {
          setIsSwitching(true);
          switchingForRef.current = addrLower;
          restoreWalletFor(addrLower)
            .finally(() => setIsSwitching(false));
        } else {
          localStorage.removeItem(UNLINK_OWNER_KEY);
        }
      }
    }
  }, [address, ready, walletExists, clearWallet, isSwitching, restoreWalletFor]);

  const handleClearAndReset = async () => {
    try {
      setIsSwitching(true);
      await clearWallet();
      // Remove saved mnemonic + owner mapping for this address
      if (address) {
        localStorage.removeItem(walletKeyFor(address));
      }
      localStorage.removeItem(UNLINK_OWNER_KEY);
      setMnemonic(null);
      setError(null);
      switchingForRef.current = null;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset wallet");
    } finally {
      setIsSwitching(false);
    }
  };

  const handleCreateWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await createWallet();
      setMnemonic(result.mnemonic);
      await createAccount();
      if (address) {
        localStorage.setItem(UNLINK_OWNER_KEY, address.toLowerCase());
        // Save mnemonic so we can restore on account switch-back
        localStorage.setItem(walletKeyFor(address), result.mnemonic);
      }
      switchingForRef.current = null;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleImportWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      const trimmed = importInput.trim();
      await importWallet(trimmed);
      await createAccount();
      if (address) {
        localStorage.setItem(UNLINK_OWNER_KEY, address.toLowerCase());
        localStorage.setItem(walletKeyFor(address), trimmed);
      }
      switchingForRef.current = null;
      setShowImport(false);
      setImportInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to import wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMnemonic = () => {
    if (mnemonic) {
      navigator.clipboard.writeText(mnemonic);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!ready || isSwitching) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
          <span className="text-gray-500">
            {isSwitching ? "Switching wallet..." : "Initializing privacy layer..."}
          </span>
        </div>
      </div>
    );
  }

  if (walletExists && activeAccount) {
    const storedOwner = typeof window !== "undefined" ? localStorage.getItem(UNLINK_OWNER_KEY) : null;
    const ownerMismatch = storedOwner && address && storedOwner.toLowerCase() !== address.toLowerCase();

    if (ownerMismatch) {
      return (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="text-yellow-400" size={20} />
            <h3 className="text-gray-900 font-semibold">Wallet Mismatch</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            This private wallet belongs to a different account. Reset to create one for your current address.
          </p>
          <button
            onClick={handleClearAndReset}
            className="w-full flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded-lg font-medium transition-colors"
          >
            <RefreshCw size={16} />
            Reset Private Wallet
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="text-teal-600" size={20} />
            <h3 className="text-gray-900 font-semibold">Unlink Address</h3>
          </div>
        </div>
        <div className="bg-gray-100 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Unlink Address</p>
          <p className="text-sm text-teal-600 font-mono break-all">
            {accounts[0]?.address || "Loading..."}
          </p>
        </div>
        {address && (
          <p className="text-xs text-gray-500 mt-2">
            Linked to {address.slice(0, 6)}...{address.slice(-4)} · {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Key className="text-teal-600" size={20} />
        <h3 className="text-gray-900 font-semibold">Setup Private Wallet</h3>
      </div>

      {address && (
        <div className="bg-gray-100 rounded-lg p-2 px-3 mb-4">
          <p className="text-xs text-gray-500">
            Creating wallet for <span className="text-gray-900 font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-900/30 border border-red-800 rounded-lg p-3 mb-4">
          <AlertCircle size={16} className="text-red-500" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {mnemonic ? (
        <div className="space-y-3">
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
            <p className="text-xs text-yellow-400 font-semibold mb-2">
              ⚠️ Save your recovery phrase — it will not be shown again
            </p>
            <p className="text-sm text-gray-600 font-mono leading-relaxed break-all">
              {mnemonic}
            </p>
          </div>
          <button
            onClick={handleCopyMnemonic}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
          <button
            onClick={() => setMnemonic(null)}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2 rounded-lg font-medium transition-colors"
          >
            I&apos;ve saved it — Continue
          </button>
        </div>
      ) : showImport ? (
        <div className="space-y-3">
          <textarea
            value={importInput}
            onChange={(e) => setImportInput(e.target.value)}
            placeholder="Enter your 24-word recovery phrase..."
            className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-sm text-gray-900 placeholder-gray-500 resize-none h-24 focus:border-emerald-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleImportWallet}
              disabled={!importInput.trim() || loading}
              className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? "Importing..." : "Import"}
            </button>
            <button
              onClick={() => {
                setShowImport(false);
                setImportInput("");
              }}
              className="px-4 py-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Create a new private wallet or import an existing one to send and receive shielded payments.
          </p>
          <button
            onClick={handleCreateWallet}
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors"
          >
            {loading ? "Creating..." : "Create New Wallet"}
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="w-full border border-gray-300 hover:border-gray-200 text-gray-600 py-2.5 rounded-lg font-medium transition-colors"
          >
            Import Existing Wallet
          </button>
        </div>
      )}
    </div>
  );
}
