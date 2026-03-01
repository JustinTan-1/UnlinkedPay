"use client";

import { useConnect, useAccount, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wallet, LogOut } from "lucide-react";
import { monadTestnet } from "@/lib/config";

// Ensure MetaMask has Monad Testnet registered with MON as native currency
async function ensureMonadNetwork() {
  const eth = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
  if (!eth) return;
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x" + monadTestnet.id.toString(16) }],
    });
  } catch (e: unknown) {
    // Chain not added yet (error code 4902) — add it
    if (e && typeof e === "object" && "code" in e && (e as { code: number }).code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x" + monadTestnet.id.toString(16),
            chainName: monadTestnet.name,
            nativeCurrency: monadTestnet.nativeCurrency,
            rpcUrls: [monadTestnet.rpcUrls.default.http[0]],
            blockExplorerUrls: [monadTestnet.blockExplorers.default.url],
          },
        ],
      });
    }
  }
}

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  // Auto-switch to Monad Testnet when connected
  useEffect(() => {
    if (isConnected) {
      ensureMonadNetwork().catch(console.error);
    }
  }, [isConnected]);

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-sm text-gray-300 font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={() => { disconnect(); router.push("/"); }}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Disconnect"
        >
          <LogOut size={18} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      disabled={isPending}
      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
    >
      <Wallet size={18} />
      {isPending ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
