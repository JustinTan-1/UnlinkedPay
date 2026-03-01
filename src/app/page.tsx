"use client";

import Link from "next/link";
import {
  Shield,
  Users,
  Eye,
  EyeOff,
  Lock,
  Zap,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Shield className="text-emerald-400" size={40} />
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                UnlinkedPay
              </h1>
            </div>
            <p className="text-xl text-gray-400 mb-2">
              Confidential Onchain Salaries
            </p>
            <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
              The first private payroll system that actually executes on-chain.
              Pay salaries in crypto without your entire compensation structure
              becoming public on a block explorer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/employer"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium transition-colors text-lg"
              >
                <Users size={20} />
                Employer Dashboard
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/employee"
                className="flex items-center gap-2 border border-gray-700 hover:border-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors text-lg"
              >
                <Shield size={20} />
                Employee Portal
                <ArrowRight size={18} />
              </Link>
            </div>
            <p className="text-xs text-gray-600 mt-4">
              Built on Monad · Powered by Unlink Privacy SDK
            </p>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-4">Why This Matters</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Right now, if a company pays salaries onchain, anyone can see everything.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <Eye className="text-red-400 mb-4" size={28} />
            <h3 className="text-lg font-semibold mb-2">Competitor Intel</h3>
            <p className="text-sm text-gray-400">
              A competitor watches your wallet, sees you hired 5 engineers at
              $180k each, and poaches them with better offers.
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <Users className="text-red-400 mb-4" size={28} />
            <h3 className="text-lg font-semibold mb-2">Salary Transparency</h3>
            <p className="text-sm text-gray-400">
              An employee sees what their coworker makes on the block explorer
              and morale collapses before you can address it.
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <Eye className="text-red-400 mb-4" size={28} />
            <h3 className="text-lg font-semibold mb-2">Negotiation Leak</h3>
            <p className="text-sm text-gray-400">
              A contractor sees your full treasury balance before negotiating
              their rate, giving them unfair leverage.
            </p>
          </div>
        </div>

        {/* Solution Section */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            UnlinkedPay uses Unlink&apos;s privacy layer to shield transaction
            amounts and break the link between employer and employee.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
            <div className="w-10 h-10 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-emerald-400 font-bold">1</span>
            </div>
            <h3 className="font-semibold mb-2">Deposit</h3>
            <p className="text-xs text-gray-400">
              Employer deposits MON into Unlink&apos;s privacy pool
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
            <div className="w-10 h-10 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-emerald-400 font-bold">2</span>
            </div>
            <h3 className="font-semibold mb-2">Configure</h3>
            <p className="text-xs text-gray-400">
              Add employee Unlink addresses and salary amounts
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
            <div className="w-10 h-10 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-emerald-400 font-bold">3</span>
            </div>
            <h3 className="font-semibold mb-2">Execute</h3>
            <p className="text-xs text-gray-400">
              Trigger payroll — shielded transfers to all employees
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
            <div className="w-10 h-10 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-emerald-400 font-bold">4</span>
            </div>
            <h3 className="font-semibold mb-2">Receive</h3>
            <p className="text-xs text-gray-400">
              Employees see their balance — nobody else does
            </p>
          </div>
        </div>

        {/* Privacy Table */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-center mb-6">
            What&apos;s Private, What&apos;s Public
          </h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left p-4 text-gray-400 font-medium">
                    Property
                  </th>
                  <th className="text-center p-4 text-gray-400 font-medium">
                    Deposit
                  </th>
                  <th className="text-center p-4 text-gray-400 font-medium">
                    Transfer
                  </th>
                  <th className="text-center p-4 text-gray-400 font-medium">
                    Withdraw
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-800">
                  <td className="p-4 text-white">Amount</td>
                  <td className="p-4 text-center">
                    <Eye className="inline text-yellow-400" size={16} />
                  </td>
                  <td className="p-4 text-center">
                    <EyeOff className="inline text-emerald-400" size={16} />
                  </td>
                  <td className="p-4 text-center">
                    <Eye className="inline text-yellow-400" size={16} />
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="p-4 text-white">Sender</td>
                  <td className="p-4 text-center">
                    <Eye className="inline text-yellow-400" size={16} />
                  </td>
                  <td className="p-4 text-center">
                    <EyeOff className="inline text-emerald-400" size={16} />
                  </td>
                  <td className="p-4 text-center">
                    <EyeOff className="inline text-emerald-400" size={16} />
                  </td>
                </tr>
                <tr>
                  <td className="p-4 text-white">Recipient</td>
                  <td className="p-4 text-center">
                    <EyeOff className="inline text-emerald-400" size={16} />
                  </td>
                  <td className="p-4 text-center">
                    <EyeOff className="inline text-emerald-400" size={16} />
                  </td>
                  <td className="p-4 text-center">
                    <Eye className="inline text-yellow-400" size={16} />
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="p-4 border-t border-gray-800 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="text-yellow-400" size={12} /> Public
              </span>
              <span className="flex items-center gap-1">
                <EyeOff className="text-emerald-400" size={12} /> Private
              </span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <Lock className="text-emerald-400 mb-4" size={28} />
            <h3 className="text-lg font-semibold mb-2">
              Shielded Transfers
            </h3>
            <p className="text-sm text-gray-400">
              Salary amounts are hidden during transfer. No one can see how much
              any employee earns by watching the blockchain.
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <Zap className="text-emerald-400 mb-4" size={28} />
            <h3 className="text-lg font-semibold mb-2">Monad Speed</h3>
            <p className="text-sm text-gray-400">
              Payroll can involve hundreds of transactions firing simultaneously.
              Monad&apos;s throughput handles it all.
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <CheckCircle className="text-emerald-400 mb-4" size={28} />
            <h3 className="text-lg font-semibold mb-2">
              ZK Income Proofs
            </h3>
            <p className="text-sm text-gray-400">
              Employees can prove they earn above a threshold without revealing
              exact salary — for loans, apartments, and more.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-12 bg-gradient-to-r from-emerald-900/20 to-emerald-900/10 rounded-2xl border border-emerald-800/30">
          <h2 className="text-2xl font-bold mb-4">
            Ready to pay salaries privately?
          </h2>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            The reason companies aren&apos;t paying salaries in crypto isn&apos;t
            regulation — it&apos;s that they don&apos;t want their entire compensation
            structure public on a block explorer.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/employer"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Launch Employer Dashboard
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/employee"
              className="flex items-center gap-2 border border-gray-700 hover:border-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Open Employee Portal
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="text-emerald-400" size={20} />
              <span className="text-sm text-gray-400">UnlinkedPay</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Built on Monad</span>
              <span>·</span>
              <span>Powered by Unlink</span>
              <span>·</span>
              <span>NYhacks 2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
