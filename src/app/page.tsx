"use client";

import { useState } from "react";

const receipts = [
  {
    id: "receipt-staples-2026-09-18",
    vendor: "Staples Canada",
    date: "Sep 18, 2026",
    total: "$86.10",
    status: "Ready",
  },
  {
    id: "receipt-restaurant-abc-2026-09",
    vendor: "Restaurant ABC",
    date: "Sep 2026",
    total: "$252.00",
    status: "Ready",
  },
  {
    id: "receipt-unknown-vendor-2026-09",
    vendor: "Unknown Vendor",
    date: "Sep 2026",
    total: "$1,260.00",
    status: "Review",
  },
  {
    id: "receipt-cash-deposit-2026-09",
    vendor: "Cash Deposit",
    date: "Sep 2026",
    total: "$5,000.00",
    status: "Review",
  },
];

export default function Home() {
  const [selectedReceipt, setSelectedReceipt] = useState(receipts[0]);
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyzeReceipt() {
    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message:
            message ||
            "Analyze this receipt and determine its bookkeeping classification and eligible ITC.",
          receiptId: selectedReceipt.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Copilot request failed.");
      }

      setResponse(data.text);
    } catch (error) {
      setResponse(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0f14] text-white">
      <header className="border-b border-white/10 bg-[#10151d] px-6 py-4">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              Loopnow CPA Copilot
            </h1>
            <p className="text-sm text-gray-400">
              AI-powered Canadian bookkeeping & GST/HST compliance
            </p>
          </div>

          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
            System Online
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-81px)] max-w-[1500px] grid-cols-12">
        {/* Receipt Queue */}
        <aside className="col-span-3 border-r border-white/10 bg-[#0e131a] p-5">
          <div className="mb-5">
            <h2 className="font-semibold">Receipt Queue</h2>
            <p className="mt-1 text-xs text-gray-500">
              Select a receipt to analyze
            </p>
          </div>

          <div className="space-y-3">
            {receipts.map((receipt) => {
              const selected = selectedReceipt.id === receipt.id;

              return (
                <button
                  key={receipt.id}
                  onClick={() => {
                    setSelectedReceipt(receipt);
                    setResponse("");
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-blue-500/50 bg-blue-500/10"
                      : "border-white/10 bg-[#121820] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{receipt.vendor}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {receipt.date}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 text-[10px] ${
                        receipt.status === "Ready"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {receipt.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-gray-300">
                    {receipt.total}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Receipt Details */}
        <section className="col-span-4 border-r border-white/10 bg-[#0b1016] p-6">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Selected Receipt
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              {selectedReceipt.vendor}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {selectedReceipt.date}
            </p>
          </div>

          <div className="space-y-3">
            <Detail label="Receipt ID" value={selectedReceipt.id} />
            <Detail label="Vendor" value={selectedReceipt.vendor} />
            <Detail label="Date" value={selectedReceipt.date} />
            <Detail label="Total" value={selectedReceipt.total} />
          </div>

          <div className="mt-8 rounded-xl border border-white/10 bg-[#121820] p-5">
            <p className="text-sm font-medium">Processing Pipeline</p>

            <div className="mt-4 space-y-3 text-sm">
              <PipelineStep text="Receipt loaded" />
              <PipelineStep text="CRA documentation validation" />
              <PipelineStep text="Expense classification" />
              <PipelineStep text="GIFI mapping" />
              <PipelineStep text="ITC calculation" />
              <PipelineStep text="Self-verification" />
            </div>
          </div>
        </section>

        {/* Copilot */}
        <section className="col-span-5 flex flex-col bg-[#0d1219]">
          <div className="border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  CPA Copilot
                </h2>
                <p className="text-xs text-gray-500">
                  AI agent with deterministic CRA tools
                </p>
              </div>

              <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-2 text-xs text-purple-300">
                AI Agent
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!response && !loading && (
              <div className="rounded-xl border border-white/10 bg-[#121820] p-5">
                <p className="font-medium">
                  Ready to analyze {selectedReceipt.vendor}
                </p>

                <p className="mt-2 text-sm leading-6 text-gray-400">
                  The Copilot will inspect the receipt, validate
                  documentation, classify the expense, map the GIFI
                  code, calculate eligible ITC, and verify the result.
                </p>
              </div>
            )}

            {loading && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
                <p className="font-medium text-blue-300">
                  Copilot is analyzing...
                </p>

                <div className="mt-4 space-y-2 text-sm text-gray-400">
                  <p>→ Reading receipt</p>
                  <p>→ Validating CRA documentation</p>
                  <p>→ Classifying expense</p>
                  <p>→ Calculating ITC</p>
                </div>
              </div>
            )}

            {response && !loading && (
              <div className="rounded-xl border border-white/10 bg-[#121820] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-emerald-400">
                    Analysis complete
                  </span>
                </div>

                <div className="whitespace-pre-wrap text-sm leading-7 text-gray-300">
                  {response}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-5">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask CPA Copilot about this receipt..."
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-[#121820] p-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500/50"
            />

            <button
              onClick={analyzeReceipt}
              disabled={loading}
              className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Analyze Receipt"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#121820] p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-all text-sm text-gray-200">{value}</p>
    </div>
  );
}

function PipelineStep({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-gray-400">
      <div className="h-2 w-2 rounded-full bg-emerald-400" />
      {text}
    </div>
  );
}