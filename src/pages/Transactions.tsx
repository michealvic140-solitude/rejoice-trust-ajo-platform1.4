import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Navigate, Link } from "react-router-dom";
import {
  Receipt, Search, Filter, CheckCircle, Clock, XCircle,
  Download, ChevronRight, ExternalLink, Wallet
} from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import DashboardLayout from "@/components/DashboardLayout";

type StatusFilter = "all" | "pending" | "approved" | "declined";

export default function Transactions() {
  const { isLoggedIn, transactions, currentUser } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const filtered = transactions.filter(t => {
    const matchSearch = t.code.toLowerCase().includes(search.toLowerCase()) ||
      t.groupName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalApproved = transactions.filter(t => t.status === "approved").reduce((s, t) => s + t.amount, 0);
  const totalPending  = transactions.filter(t => t.status === "pending").reduce((s, t) => s + t.amount, 0);

  const statusIcon = (s: string) => {
    if (s === "approved") return <CheckCircle size={13} className="text-emerald-400" />;
    if (s === "declined") return <XCircle size={13} className="text-red-400" />;
    return <Clock size={13} className="text-amber-400" />;
  };

  const statusClass = (s: string) => {
    if (s === "approved") return "text-emerald-400 bg-emerald-900/15 border-emerald-600/25";
    if (s === "declined") return "text-red-400 bg-red-900/15 border-red-600/25";
    return "text-amber-400 bg-amber-900/15 border-amber-600/25";
  };

  return (
    <DashboardLayout activeTab="transactions">
      <ParticleBackground />
      <div className="relative z-10 p-4 md:p-6">

        <div className="mb-6 animate-fade-up">
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Payment History</p>
          <h1 className="gold-gradient-text text-3xl font-cinzel font-bold">Transactions</h1>
          <p className="text-muted-foreground text-sm mt-1">Track all your payment submissions and their approval status.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 animate-fade-up delay-100">
          {[
            { label: "Total Approved", value: `👑${totalApproved.toLocaleString()}`, color: "text-emerald-400", icon: CheckCircle },
            { label: "Pending Review", value: `👑${totalPending.toLocaleString()}`, color: "text-amber-400", icon: Clock },
            { label: "All-Time Paid", value: `👑${(currentUser?.totalPaid || 0).toLocaleString()}`, color: "text-gold", icon: Wallet },
          ].map(s => (
            <div key={s.label} className="glass-card-static rounded-2xl p-5">
              <s.icon size={20} className={`${s.color} mb-3`} />
              <p className={`text-2xl font-cinzel font-bold ${s.color}`}>{s.value}</p>
              <p className="text-muted-foreground text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5 animate-fade-up delay-200">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by code or group name..." className="luxury-input pl-9 text-xs" />
          </div>
          <div className="flex gap-2">
            {(["all", "pending", "approved", "declined"] as StatusFilter[]).map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all border ${statusFilter === f ? "bg-gold/15 border-gold/30 text-gold" : "btn-glass"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction List */}
        <div className="glass-card-static rounded-2xl overflow-hidden animate-fade-up delay-300">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt size={48} className="text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-foreground font-cinzel font-bold text-lg mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {transactions.length === 0 ? "You haven't made any payments yet. Join a group to get started!" : "No transactions match your search criteria."}
              </p>
              {transactions.length === 0 && (
                <Link to="/groups" className="btn-gold px-5 py-2.5 rounded-xl font-bold text-sm inline-flex items-center gap-2">
                  Explore Groups <ChevronRight size={14} />
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gold/10 bg-gold/5">
                      {["Reference Code", "Group", "Seat", "Amount", "Date & Time", "Status", "Proof"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(t => (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-mono text-gold font-bold">{t.code}</td>
                        <td className="px-4 py-3 text-foreground font-medium max-w-[120px] truncate">{t.groupName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{t.seatNo ? `#${t.seatNo}` : "—"}</td>
                        <td className="px-4 py-3 text-foreground font-bold">₦{t.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{t.date ? new Date(t.date).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold uppercase ${statusClass(t.status)}`}>
                            {statusIcon(t.status)}{t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {t.screenshotUrl ? (
                            <a href={t.screenshotUrl} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors text-[10px]">
                              <ExternalLink size={10} />View
                            </a>
                          ) : <span className="text-muted-foreground/50">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-white/5">
                {filtered.map(t => (
                  <div key={t.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-gold font-bold text-sm">{t.code}</span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold uppercase ${statusClass(t.status)}`}>
                        {statusIcon(t.status)}{t.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t.groupName} {t.seatNo ? `· Seat #${t.seatNo}` : ""}</span>
                      <span className="text-foreground font-bold">₦{t.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">{t.date ? new Date(t.date).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—"}</span>
                      {t.screenshotUrl && (
                        <a href={t.screenshotUrl} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
                          <ExternalLink size={10} />View proof
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <p className="text-center text-muted-foreground/50 text-xs mt-4">
          Showing {filtered.length} of {transactions.length} transactions
        </p>
      </div>
    </DashboardLayout>
  );
}
