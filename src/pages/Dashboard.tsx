import { useApp } from "@/context/AppContext";
import { Navigate, Link } from "react-router-dom";
import {
  Star, Users, Calendar, Wallet, Clock, TrendingUp, ArrowUpRight,
  LayoutDashboard, PiggyBank, Shield, Receipt, HeadphonesIcon, Settings, ChevronRight, User
} from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";

const SIDEBAR_LINKS = [
  { icon: LayoutDashboard, label: "Dashboard",    to: "/dashboard" },
  { icon: PiggyBank,       label: "Savings",       to: "/savings" },
  { icon: Shield,          label: "Groups",        to: "/groups" },
  { icon: Receipt,         label: "Transactions",  to: "/transactions" },
  { icon: HeadphonesIcon,  label: "Support",       to: "/support" },
  { icon: Settings,        label: "Settings",      to: "/profile" },
];

export default function Dashboard() {
  const { currentUser, isLoggedIn, transactions, groups } = useApp();
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const trustScore = 95;
  const activeGroups = groups.filter(g => g.isLive).length;
  const nextPayout = "Dec 15, 2023";

  const myGroups = groups.slice(0, 4);

  return (
    <div className="min-h-screen flex relative overflow-hidden pt-16">
      <ParticleBackground />

      {/* ======== SIDEBAR ======== */}
      <aside
        className="hidden md:flex w-52 shrink-0 flex-col border-r border-gold/10 z-10 pt-6 pb-6"
        style={{ background: "rgba(8,8,8,0.85)", backdropFilter: "blur(20px)" }}
      >
        {/* Logo in sidebar */}
        <div className="px-5 mb-8 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gold-gradient flex items-center justify-center shadow animate-glow-pulse shrink-0">
            <span className="text-obsidian font-cinzel font-black text-xs">RA</span>
          </div>
          <span className="gold-gradient-text font-cinzel font-bold text-sm tracking-wide">RTA</span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {SIDEBAR_LINKS.map(item => {
            const isActive = window.location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gold/15 border border-gold/25 text-gold"
                    : "text-muted-foreground hover:text-foreground hover:bg-gold/5"
                }`}
              >
                <item.icon size={16} className={isActive ? "text-gold" : ""} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ======== MAIN ======== */}
      <div className="flex-1 min-w-0 overflow-x-hidden z-10 px-4 md:px-6 py-6">

        {/* Top right profile */}
        <div className="flex items-center justify-end gap-3 mb-6">
          <Link
            to="/profile"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/20 bg-gold/5 hover:bg-gold/10 transition-all text-sm"
          >
            <Settings size={13} className="text-muted-foreground" />
            <span className="text-foreground font-medium text-xs">{currentUser?.username}</span>
            <div className="w-7 h-7 rounded-full bg-gold-gradient flex items-center justify-center shrink-0">
              <User size={12} className="text-obsidian" />
            </div>
            <ChevronRight size={12} className="text-muted-foreground" />
          </Link>
        </div>

        {/* Welcome heading */}
        <div className="mb-8 animate-fade-up">
          <h1
            className="font-cinzel font-black text-3xl md:text-4xl mb-1"
            style={{
              background: "linear-gradient(135deg, hsl(45,93%,47%), hsl(45,100%,65%), hsl(38,92%,50%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "0.04em",
            }}
          >
            WELCOME BACK,
          </h1>
          <h2
            className="font-cinzel font-black text-3xl md:text-4xl"
            style={{
              background: "linear-gradient(135deg, hsl(45,93%,47%), hsl(45,100%,65%), hsl(38,92%,50%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "0.04em",
            }}
          >
            {currentUser?.firstName?.toUpperCase() || "USER"}
            {currentUser?.isVip && <span className="vip-badge ml-3 align-middle text-base">✦ VIP</span>}
          </h2>
        </div>

        {/* 3 Big stat cards (matching reference image) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

          {/* Trust Score */}
          <div
            className="rounded-2xl p-6 flex flex-col gap-3 animate-fade-up delay-100"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(234,179,8,0.2)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.25)" }}
            >
              <Star size={22} className="text-gold" fill="rgba(234,179,8,0.3)" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Trust Score</p>
              <p className="font-cinzel font-black text-4xl text-foreground mt-1">
                {trustScore}%<span className="text-gold ml-1">★</span>
              </p>
            </div>
          </div>

          {/* Active Groups */}
          <div
            className="rounded-2xl p-6 flex flex-col gap-3 animate-fade-up delay-200"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(234,179,8,0.2)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.25)" }}
            >
              <Users size={22} className="text-gold" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Active Groups</p>
              <p className="font-cinzel font-black text-5xl text-foreground mt-1">{activeGroups}</p>
            </div>
          </div>

          {/* Next Payout */}
          <div
            className="rounded-2xl p-6 flex flex-col gap-3 animate-fade-up delay-300"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(234,179,8,0.2)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.25)" }}
            >
              <Calendar size={22} className="text-gold" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Next Payout</p>
              <p className="font-cinzel font-bold text-xl text-foreground mt-1">{nextPayout}</p>
            </div>
          </div>
        </div>

        {/* Bottom: Your Circles + Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Your Circles */}
          <div
            className="lg:col-span-2 rounded-2xl overflow-hidden animate-fade-up delay-300"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(234,179,8,0.15)", backdropFilter: "blur(16px)" }}
          >
            <div className="px-5 py-4 border-b border-gold/10">
              <h2 className="gold-gradient-text font-cinzel font-bold text-base">Your Circles</h2>
            </div>
            <div className="p-4 space-y-2">
              {myGroups.map((g, i) => (
                <Link
                  key={g.id}
                  to={`/groups/${g.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gold/5 hover:border-gold/20 border border-transparent transition-all group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}
                  >
                    <Users size={14} className="text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm font-semibold truncate">{g.name}</p>
                    <p className="text-muted-foreground text-xs">₦{g.contributionAmount.toLocaleString()} · {g.cycleType}</p>
                  </div>
                  {g.isLive && <span className="live-badge shrink-0 text-[9px]">● LIVE</span>}
                  <ChevronRight size={13} className="text-muted-foreground group-hover:text-gold transition-colors shrink-0" />
                </Link>
              ))}
              <Link
                to="/groups"
                className="flex items-center justify-center gap-2 mt-2 py-2.5 rounded-xl text-xs font-semibold btn-glass"
              >
                Browse All Groups <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>

          {/* Transactions + extra stats */}
          <div className="lg:col-span-3 space-y-4">

            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Wallet, label: "Total Paid", value: `₦${(currentUser?.totalPaid || 0).toLocaleString()}`, color: "text-gold" },
                { icon: Clock,  label: "Pending",    value: transactions.filter(t => t.status === "pending").length.toString(), color: "text-amber-400" },
              ].map(s => (
                <div
                  key={s.label}
                  className="rounded-xl p-4 animate-fade-up"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(234,179,8,0.12)", backdropFilter: "blur(12px)" }}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}
                    style={{ background: "rgba(234,179,8,0.1)" }}
                  >
                    <s.icon size={16} />
                  </div>
                  <p className={`text-xl font-cinzel font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Transactions table */}
            <div
              className="rounded-2xl overflow-hidden animate-fade-up delay-200"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(234,179,8,0.12)", backdropFilter: "blur(16px)" }}
            >
              <div className="px-5 py-3.5 border-b border-gold/10 flex items-center justify-between">
                <h2 className="gold-text font-cinzel font-bold text-sm uppercase tracking-wide">Recent Transactions</h2>
                <Link to="/transactions" className="text-xs text-muted-foreground hover:text-gold transition-colors flex items-center gap-1">
                  View all <ArrowUpRight size={11} />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gold/5">
                      {["Code", "Group", "Amount", "Status", "Date"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] text-muted-foreground/60 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => (
                      <tr key={t.id} className="border-b border-gold/5 hover:bg-gold/3 transition-colors">
                        <td className="px-4 py-3 text-gold font-mono">{t.code}</td>
                        <td className="px-4 py-3 text-foreground/70 truncate max-w-[100px]">{t.groupName}</td>
                        <td className="px-4 py-3 text-foreground font-semibold">₦{t.amount.toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`status-${t.status}`}>{t.status}</span></td>
                        <td className="px-4 py-3 text-muted-foreground">{t.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
