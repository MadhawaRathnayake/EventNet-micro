"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getMyPayments,
  refundPayment,
  type PaymentData,
  type PaginationInfo,
} from "@/utils/paymentApi";

// ─── Status Badge Styles (matching profile page pattern) ────────
const STATUS_STYLES: Record<string, { bg: string; label: string }> = {
  completed: { bg: "bg-green-100 text-green-800", label: "Completed" },
  pending: { bg: "bg-yellow-100 text-yellow-800", label: "Pending" },
  processing: { bg: "bg-blue-100 text-blue-800", label: "Processing" },
  failed: { bg: "bg-red-100 text-red-800", label: "Failed" },
  refunded: { bg: "bg-purple-100 text-purple-800", label: "Refunded" },
};

const METHOD_LABELS: Record<string, string> = {
  credit_card: "💳 Credit Card",
  debit_card: "💳 Debit Card",
  bank_transfer: "🏦 Bank Transfer",
  digital_wallet: "📱 Digital Wallet",
};

type RefundError = {
  data?: {
    error?: string;
  };
};

export default function PaymentsPage() {
  const { data: session, status: authStatus } = useSession();

  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [confirmRefundId, setConfirmRefundId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ─── Load payments ────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!session?.backendToken) return;
      try {
        setLoading(true);
        const params: Record<string, string | number> = { page, limit: 10 };
        if (statusFilter) params.status = statusFilter;

        const result = await getMyPayments(session.backendToken, params);
        setPayments(result.data);
        setPagination(result.pagination);
      } catch (err) {
        console.error("Failed to load payments:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session?.backendToken, page, statusFilter]);

  // ─── Auto-dismiss toast ───────────────────────────────────────
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ─── Handle refund ────────────────────────────────────────────
  const handleRefund = async (paymentId: string) => {
    if (!session?.backendToken) return;

    setConfirmRefundId(null);
    setRefundingId(paymentId);
    try {
      await refundPayment(session.backendToken, paymentId);
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: "refunded" as const } : p))
      );
      setToast({ message: "Payment refunded successfully!", type: "success" });
    } catch (err: unknown) {
      const refundError = err as RefundError;
      setToast({
        message: refundError?.data?.error || "Failed to process refund.",
        type: "error",
      });
    } finally {
      setRefundingId(null);
    }
  };

  // ─── Loading ──────────────────────────────────────────────────
  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // ─── Auth gate ────────────────────────────────────────────────
  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Login Required</h2>
          <p className="text-sm text-gray-600 mb-6">Please sign in to view your payment history.</p>
          <Link
            href="/login"
            className="inline-block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] bg-gray-50 p-8">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50">
          <div
            className={`px-5 py-3 rounded-lg shadow-lg text-sm font-medium ${
              toast.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-500 border border-red-200"
            }`}
          >
            {toast.type === "success" ? "✅" : "❌"} {toast.message}
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {confirmRefundId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Confirm Refund</h3>
              <p className="text-sm text-gray-600 mb-6">Are you sure you want to refund this payment? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmRefundId(null)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRefund(confirmRefundId)}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Yes, Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Payments</h1>
            <p className="text-sm text-gray-500 mt-1">View and manage your payment history</p>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            id="statusFilter"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            /* Loading skeleton */
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex justify-between items-center py-4 border-b border-gray-100">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-48 bg-gray-100 rounded" />
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full" />
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            /* Empty state */
            <div className="p-16 text-center">
              <div className="text-5xl mb-4">🧾</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No payments found</h3>
              <p className="text-sm text-gray-500 mb-6">
                {statusFilter
                  ? `No ${statusFilter} payments. Try a different filter.`
                  : "You haven't made any payments yet."}
              </p>
              <Link
                href="/events"
                className="inline-block py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Browse Events
              </Link>
            </div>
          ) : (
            /* Payment table */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-600">
                    <th className="py-3 pl-6 text-sm font-medium">Amount</th>
                    <th className="py-3 text-sm font-medium">Method</th>
                    <th className="py-3 text-sm font-medium">Date</th>
                    <th className="py-3 text-sm font-medium">Transaction</th>
                    <th className="py-3 text-sm font-medium">Status</th>
                    <th className="py-3 pr-6 text-sm font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const statusStyle = STATUS_STYLES[payment.status] || STATUS_STYLES.pending;
                    const methodLabel = METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod;

                    return (
                      <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 pl-6">
                          <p className="font-medium text-gray-800">
                            Rs. {parseFloat(String(payment.amount)).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400">{payment.currency}</p>
                        </td>
                        <td className="py-4 text-sm text-gray-600">{methodLabel}</td>
                        <td className="py-4 text-sm text-gray-600">
                          {new Date(payment.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-4">
                          {payment.transactionId ? (
                            <span className="text-xs font-mono text-gray-500">
                              {payment.transactionId.slice(0, 12)}...
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                          {payment.cardLast4 && (
                            <p className="text-xs text-gray-400">•••• {payment.cardLast4}</p>
                          )}
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg}`}>
                            {statusStyle.label}
                          </span>
                          {payment.failureReason && (
                            <p className="text-xs text-red-500 mt-1">{payment.failureReason}</p>
                          )}
                        </td>
                        <td className="py-4 pr-6">
                          {payment.status === "completed" ? (
                            <button
                              onClick={() => setConfirmRefundId(payment.id)}
                              disabled={refundingId === payment.id}
                              className="px-3 py-1 rounded-md text-xs font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {refundingId === payment.id ? "Refunding..." : "Refund"}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                  p === page
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
