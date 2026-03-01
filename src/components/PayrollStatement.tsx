"use client";

import { useUnlinkHistory, formatAmount } from "@unlink-xyz/react";
import { useUnlink } from "@unlink-xyz/react";
import { useAccount } from "wagmi";
import { useState } from "react";
import { FileText, Download, Loader2 } from "lucide-react";

export function PayrollStatement() {
  const { address } = useAccount();
  const { ready, walletExists } = useUnlink();
  const { history } = useUnlinkHistory();
  const [generating, setGenerating] = useState(false);
  const [period, setPeriod] = useState<"all" | "ytd" | "30d" | "90d">("ytd");

  if (!ready || !walletExists) return null;

  // Filter to salary entries only (Receive = salary)
  const salaryEntries = history.filter(
    (e) => e.kind === "Receive" && e.status === "confirmed"
  );

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  function filterByPeriod<T extends { timestamp?: number }>(entries: T[]): T[] {
    if (period === "all") return entries;
    return entries.filter((e) => {
      if (e.timestamp === undefined || e.timestamp === null) return true;
      const d = new Date(e.timestamp > 1e12 ? e.timestamp : e.timestamp * 1000);
      switch (period) {
        case "ytd":
          return d >= yearStart && d <= now;
        case "30d":
          return d >= thirtyDaysAgo && d <= now;
        case "90d":
          return d >= ninetyDaysAgo && d <= now;
        default:
          return true;
      }
    });
  }

  const filtered = filterByPeriod(salaryEntries);

  const totalReceived = filtered
    .reduce((sum, e) => {
      const amt = e.amounts.reduce((s, a) => s + (BigInt(a.delta) > 0n ? BigInt(a.delta) : 0n), 0n);
      return sum + amt;
    }, 0n);

  const paymentCount = filtered.length;

  function getPeriodLabel(): string {
    switch (period) {
      case "ytd": return `Jan 1, ${now.getFullYear()} – ${now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
      case "30d": return `${thirtyDaysAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      case "90d": return `${ninetyDaysAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      case "all": return "All Time";
      default: return "";
    }
  }

  async function generatePDF() {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("PAYROLL STATEMENT", pageWidth / 2, y, { align: "center" });
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text("UnlinkedPay – Confidential Onchain Salary Record", pageWidth / 2, y, { align: "center" });
      y += 4;
      doc.text("Powered by Unlink Privacy SDK on Monad", pageWidth / 2, y, { align: "center" });
      doc.setTextColor(0);
      y += 10;

      // Divider
      doc.setDrawColor(200);
      doc.line(20, y, pageWidth - 20, y);
      y += 10;

      // Employee info
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Employee Information", 20, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Wallet Address: ${address ?? "N/A"}`, 20, y);
      y += 6;
      doc.text(`Statement Period: ${getPeriodLabel()}`, 20, y);
      y += 6;
      doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, 20, y);
      y += 12;

      // Summary box
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(20, y, pageWidth - 40, 26, 3, 3, "F");
      y += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Compensation Summary", 25, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Total Salary Received: ${formatAmount(totalReceived, 18)} MON`, 25, y);
      y += 6;
      doc.text(`Number of Payments: ${paymentCount}`, 25, y);
      y += 14;

      // Transaction table header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Payment Details", 20, y);
      y += 8;

      // Table headers
      doc.setFillColor(34, 34, 34);
      doc.setTextColor(255);
      doc.rect(20, y - 4, pageWidth - 40, 8, "F");
      doc.setFontSize(9);
      doc.text("Date", 25, y + 1);
      doc.text("Type", 65, y + 1);
      doc.text("Amount (MON)", 105, y + 1);
      doc.text("Status", 150, y + 1);
      doc.setTextColor(0);
      y += 8;

      // Table rows
      doc.setFont("helvetica", "normal");

      if (filtered.length === 0) {
        y += 4;
        doc.setTextColor(128);
        doc.text("No salary payments found for this period.", 25, y);
        doc.setTextColor(0);
        y += 8;
      } else {
        for (let i = 0; i < filtered.length; i++) {
          const entry = filtered[i];
          if (y > 260) {
            doc.addPage();
            y = 20;
          }

          const ts = entry.timestamp
            ? (entry.timestamp > 1e12 ? entry.timestamp : entry.timestamp * 1000)
            : null;
          const date = ts
            ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "N/A";
          const amount = entry.amounts.reduce((s, a) => {
            const d = BigInt(a.delta);
            return s + (d > 0n ? d : 0n);
          }, 0n);

          // Alternating row background
          if (i % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(20, y - 4, pageWidth - 40, 7, "F");
          }

          doc.text(date, 25, y);
          doc.text("Salary", 65, y);
          doc.text(formatAmount(amount, 18), 105, y);
          doc.text("Confirmed", 150, y);
          y += 7;
        }
      }

      y += 8;

      // Divider
      doc.setDrawColor(200);
      doc.line(20, y, pageWidth - 20, y);
      y += 8;

      // Footer / disclaimer
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text("PRIVACY NOTICE", 20, y);
      y += 5;
      const disclaimer = [
        "This statement was generated from privately shielded on-chain transactions using Unlink's privacy protocol on the Monad blockchain.",
        "Transaction amounts shown are visible only to the wallet holder. Employer identity and payment linkability are cryptographically hidden.",
        "This document may be used for personal tax reporting, proof of income, or financial record-keeping purposes.",
        `Document ID: ${crypto.randomUUID?.() ?? Date.now().toString(36)}`,
      ];
      for (const line of disclaimer) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y, { maxWidth: pageWidth - 40 });
        y += 5;
      }

      const fileName = `payroll-statement-${period}-${now.getFullYear()}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 p-6 border-b border-gray-200">
        <FileText size={20} className="text-teal-600" />
        <h2 className="text-lg font-semibold text-gray-900">Payroll Statement</h2>
      </div>

      <div className="p-6 space-y-4">
        {/* Period selector */}
        <div>
          <label className="text-xs text-gray-500 mb-2 block">Statement Period</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["ytd", "Year to Date"],
              ["30d", "Last 30 Days"],
              ["90d", "Last 90 Days"],
              ["all", "All Time"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={`text-sm py-2 px-3 rounded-lg border transition-colors ${
                  period === value
                    ? "border-emerald-500 bg-gray-50 text-teal-600"
                    : "border-gray-300 text-gray-500 hover:border-gray-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary preview */}
        <div className="bg-gray-100 rounded-lg p-4 space-y-2">
          <p className="text-xs text-gray-500 mb-2">{getPeriodLabel()}</p>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Salary Received</span>
            <span className="text-sm text-teal-600 font-medium">
              {formatAmount(totalReceived, 18)} MON
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
            <span className="text-sm text-gray-500">Payments</span>
            <span className="text-sm text-gray-900 font-medium">{paymentCount}</span>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generatePDF}
          disabled={generating || filtered.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
        >
          {generating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download size={18} />
              Download Statement (PDF)
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Generates a tax-ready PDF with salary payments and totals for the selected period.
        </p>
      </div>
    </div>
  );
}
