"use client";

import { ConnectWallet } from "@/components/ConnectWallet";
import { UnlinkWalletSetup } from "@/components/UnlinkWalletSetup";
import { WithdrawOnly } from "@/components/WithdrawOnly";
import { TransactionHistory } from "@/components/TransactionHistory";
import { PayrollStatement } from "@/components/PayrollStatement";
import { useAccount } from "wagmi";
import { ArrowLeft, Wallet } from "lucide-react";
import Link from "next/link";

export default function EmployeeDashboard() {
  const { isConnected } = useAccount();
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div className="flex items-center gap-2">
                <Wallet className="text-emerald-400" size={24} />
                <h1 className="text-xl font-bold text-white">
                  UnlinkedPay
                </h1>
                <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full">
                  Employee
                </span>
              </div>
            </div>
            <ConnectWallet />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          <div className="max-w-md mx-auto text-center py-20">
            <Wallet className="mx-auto text-gray-700 mb-4" size={64} />
            <h2 className="text-2xl font-bold text-white mb-2">
              Connect Your Wallet
            </h2>
            <p className="text-gray-400 mb-6">
              Connect your wallet to view your private salary payments and
              generate income proofs.
            </p>
            <div className="flex justify-center">
              <ConnectWallet />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Wallet & Balance */}
            <div className="space-y-6">
              <UnlinkWalletSetup />
              <WithdrawOnly />
              <PayrollStatement />
            </div>

            {/* Right Column - History */}
            <div className="space-y-6">
              <TransactionHistory isEmployeeView />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
