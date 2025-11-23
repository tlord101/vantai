/**
 * Admin Dashboard
 * 
 * Protected admin panel for:
 * - Viewing audit logs
 * - Approving manual edit overrides
 * - Managing user credits
 * - Viewing usage metrics and transactions
 * 
 * Security: Requires admin custom claim on Firebase Auth token
 */

import React, {useState, useEffect} from "react";
import {useAuth} from "../../hooks/useAuth";
import {Navigate} from "react-router-dom";
import toast from "react-hot-toast";

interface AuditLog {
  id: string;
  eventType: string;
  userId: string;
  action: string;
  severity: string;
  status: string;
  timestamp: any;
  metadata?: Record<string, any>;
}

interface PendingOverride {
  id: string;
  userId: string;
  prompt: string;
  reason: string;
  requestedAt: any;
  status: string;
}

interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  credits: number;
  status: string;
  timestamp: any;
  metadata?: Record<string, any>;
}

interface UsageMetrics {
  userId?: string;
  summary?: {
    imageGenerations: number;
    policyViolations: number;
    billingEvents: number;
    adminActions: number;
  };
  metrics?: Record<string, any>;
  totalUsers?: number;
  totalLogs?: number;
}

type Tab = "logs" | "overrides" | "transactions" | "metrics" | "credits";

export default function AdminDashboard() {
  const {currentUser: user, isAdmin} = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("logs");
  const [loading, setLoading] = useState(false);
  
  // State for each tab
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [overrides, setOverrides] = useState<PendingOverride[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  
  // Filters
  const [logFilter, setLogFilter] = useState({
    userId: "",
    eventType: "",
    severity: "",
    days: 7,
  });
  const [metricsUserId, setMetricsUserId] = useState("");
  const [creditAdjustment, setCreditAdjustment] = useState({
    userId: "",
    amount: 0,
    reason: "",
  });

  // Redirect if not admin
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-300">Admin privileges required</p>
        </div>
      </div>
    );
  }

  const getAuthHeaders = async () => {
    const token = await user.getIdToken();
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({
        ...(logFilter.userId && {userId: logFilter.userId}),
        ...(logFilter.eventType && {eventType: logFilter.eventType}),
        ...(logFilter.severity && {severity: logFilter.severity}),
        days: logFilter.days.toString(),
        limit: "100",
      });

      const response = await fetch(
        `${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/v1/admin/audit-logs?${params}`,
        {headers}
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setAuditLogs(data.logs);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchOverrides = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/v1/admin/pending-overrides`,
        {headers}
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setOverrides(data.overrides);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch overrides");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOverride = async (overrideId: string, approved: boolean, reason?: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/v1/admin/approve-override`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({overrideId, approved, reason}),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast.success(`Override ${approved ? "approved" : "rejected"}`);
      fetchOverrides(); // Refresh
    } catch (error: any) {
      toast.error(error.message || "Failed to update override");
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/v1/admin/transactions?limit=50`,
        {headers}
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setTransactions(data.transactions);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({
        ...(metricsUserId && {userId: metricsUserId}),
        days: "30",
      });

      const response = await fetch(
        `${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/v1/admin/usage-metrics?${params}`,
        {headers}
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setMetrics(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch metrics");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_FIREBASE_FUNCTIONS_URL}/v1/admin/adjust-credits`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(creditAdjustment),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast.success(`Credits adjusted: ${creditAdjustment.amount > 0 ? "+" : ""}${creditAdjustment.amount}`);
      setCreditAdjustment({userId: "", amount: 0, reason: ""});
    } catch (error: any) {
      toast.error(error.message || "Failed to adjust credits");
    }
  };

  // Auto-fetch on tab change
  useEffect(() => {
    if (activeTab === "logs") fetchAuditLogs();
    if (activeTab === "overrides") fetchOverrides();
    if (activeTab === "transactions") fetchTransactions();
    if (activeTab === "metrics") fetchMetrics();
  }, [activeTab]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-card p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-300">System monitoring and management</p>
        </div>

        {/* Tabs */}
        <div className="glass-card p-2 mb-6 flex gap-2">
          {(["logs", "overrides", "transactions", "metrics", "credits"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === tab
                  ? "bg-white/20 text-white"
                  : "text-gray-300 hover:bg-white/10"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass-card p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === "logs" && !loading && (
            <div>
              <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="User ID"
                  value={logFilter.userId}
                  onChange={(e) => setLogFilter({...logFilter, userId: e.target.value})}
                  className="glass-input"
                />
                <select
                  value={logFilter.eventType}
                  onChange={(e) => setLogFilter({...logFilter, eventType: e.target.value})}
                  className="glass-input"
                >
                  <option value="">All Events</option>
                  <option value="image-generation-request">Image Generation</option>
                  <option value="policy-violation">Policy Violation</option>
                  <option value="billing-payment">Billing</option>
                  <option value="admin">Admin Actions</option>
                </select>
                <select
                  value={logFilter.severity}
                  onChange={(e) => setLogFilter({...logFilter, severity: e.target.value})}
                  className="glass-input"
                >
                  <option value="">All Severities</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="critical">Critical</option>
                </select>
                <button onClick={fetchAuditLogs} className="btn-primary">
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-3">Time</th>
                      <th className="text-left p-3">Event</th>
                      <th className="text-left p-3">User</th>
                      <th className="text-left p-3">Severity</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-3 text-sm text-gray-300">
                          {log.timestamp?.toDate?.()?.toLocaleString() || "N/A"}
                        </td>
                        <td className="p-3 text-sm">{log.eventType}</td>
                        <td className="p-3 text-sm font-mono">{log.userId.slice(0, 8)}...</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            log.severity === "critical" ? "bg-red-500/20 text-red-300" :
                            log.severity === "error" ? "bg-orange-500/20 text-orange-300" :
                            log.severity === "warning" ? "bg-yellow-500/20 text-yellow-300" :
                            "bg-blue-500/20 text-blue-300"
                          }`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            log.status === "success" ? "bg-green-500/20 text-green-300" :
                            log.status === "failure" ? "bg-red-500/20 text-red-300" :
                            "bg-gray-500/20 text-gray-300"
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3 text-sm">{log.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending Overrides Tab */}
          {activeTab === "overrides" && !loading && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Pending Manual Edit Overrides</h2>
                <button onClick={fetchOverrides} className="btn-secondary">
                  Refresh
                </button>
              </div>

              {overrides.length === 0 ? (
                <p className="text-gray-300 text-center py-8">No pending overrides</p>
              ) : (
                <div className="space-y-4">
                  {overrides.map((override) => (
                    <div key={override.id} className="glass-card p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-400">User ID</p>
                          <p className="font-mono">{override.userId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Requested</p>
                          <p>{override.requestedAt?.toDate?.()?.toLocaleString() || "N/A"}</p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm text-gray-400 mb-1">Prompt</p>
                        <p className="bg-black/30 p-3 rounded">{override.prompt}</p>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm text-gray-400 mb-1">Reason</p>
                        <p>{override.reason}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveOverride(override.id, true)}
                          className="btn-primary flex-1"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt("Rejection reason:");
                            if (reason) handleApproveOverride(override.id, false, reason);
                          }}
                          className="btn-secondary flex-1"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === "transactions" && !loading && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Recent Transactions</h2>
                <button onClick={fetchTransactions} className="btn-secondary">
                  Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-3">Time</th>
                      <th className="text-left p-3">User</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Credits</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-3 text-sm text-gray-300">
                          {tx.timestamp?.toDate?.()?.toLocaleString() || "N/A"}
                        </td>
                        <td className="p-3 text-sm font-mono">{tx.userId.slice(0, 8)}...</td>
                        <td className="p-3 text-sm">{tx.type}</td>
                        <td className="p-3 text-sm">₦{(tx.amount / 100).toFixed(2)}</td>
                        <td className="p-3 text-sm font-bold">{tx.credits}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            tx.status === "success" ? "bg-green-500/20 text-green-300" :
                            tx.status === "failed" ? "bg-red-500/20 text-red-300" :
                            "bg-yellow-500/20 text-yellow-300"
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Usage Metrics Tab */}
          {activeTab === "metrics" && !loading && (
            <div>
              <div className="mb-6">
                <label className="block mb-2">User ID (optional for overall metrics)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Leave blank for all users"
                    value={metricsUserId}
                    onChange={(e) => setMetricsUserId(e.target.value)}
                    className="glass-input flex-1"
                  />
                  <button onClick={fetchMetrics} className="btn-primary">
                    Fetch Metrics
                  </button>
                </div>
              </div>

              {metrics && (
                <div>
                  {metrics.summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="glass-card p-4">
                        <p className="text-sm text-gray-400">Image Generations</p>
                        <p className="text-2xl font-bold">{metrics.summary.imageGenerations}</p>
                      </div>
                      <div className="glass-card p-4">
                        <p className="text-sm text-gray-400">Policy Violations</p>
                        <p className="text-2xl font-bold text-red-300">{metrics.summary.policyViolations}</p>
                      </div>
                      <div className="glass-card p-4">
                        <p className="text-sm text-gray-400">Billing Events</p>
                        <p className="text-2xl font-bold">{metrics.summary.billingEvents}</p>
                      </div>
                      <div className="glass-card p-4">
                        <p className="text-sm text-gray-400">Admin Actions</p>
                        <p className="text-2xl font-bold">{metrics.summary.adminActions}</p>
                      </div>
                    </div>
                  )}

                  {metrics.totalUsers && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-card p-4">
                        <p className="text-sm text-gray-400">Total Active Users (30d)</p>
                        <p className="text-2xl font-bold">{metrics.totalUsers}</p>
                      </div>
                      <div className="glass-card p-4">
                        <p className="text-sm text-gray-400">Total Events Logged</p>
                        <p className="text-2xl font-bold">{metrics.totalLogs}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Credits Adjustment Tab */}
          {activeTab === "credits" && !loading && (
            <div>
              <h2 className="text-xl font-bold mb-6">Adjust User Credits</h2>
              <form onSubmit={handleAdjustCredits} className="max-w-md space-y-4">
                <div>
                  <label className="block mb-2">User ID</label>
                  <input
                    type="text"
                    required
                    value={creditAdjustment.userId}
                    onChange={(e) => setCreditAdjustment({...creditAdjustment, userId: e.target.value})}
                    className="glass-input w-full"
                    placeholder="User Firebase UID"
                  />
                </div>
                <div>
                  <label className="block mb-2">Credits Amount</label>
                  <input
                    type="number"
                    required
                    value={creditAdjustment.amount}
                    onChange={(e) => setCreditAdjustment({...creditAdjustment, amount: Number(e.target.value)})}
                    className="glass-input w-full"
                    placeholder="Positive for bonus, negative for deduction"
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Positive = bonus credits, Negative = deduction
                  </p>
                </div>
                <div>
                  <label className="block mb-2">Reason</label>
                  <textarea
                    required
                    value={creditAdjustment.reason}
                    onChange={(e) => setCreditAdjustment({...creditAdjustment, reason: e.target.value})}
                    className="glass-input w-full"
                    rows={3}
                    placeholder="Reason for adjustment (required for audit trail)"
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
                  Adjust Credits
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
