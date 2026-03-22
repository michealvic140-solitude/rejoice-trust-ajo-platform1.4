import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Navigate } from "react-router-dom";
import {
  History as HistoryIcon, CreditCard, Users, Bell,
  CheckCircle, Clock, XCircle, Info, Filter
} from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import { api } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";

interface ActivityItem {
  id: string;
  type: "payment" | "join" | "notification";
  title: string;
  description: string;
  status: string;
  createdAt: string;
}

const typeIcon = (type: string) => {
  if (type === "payment")      return <CreditCard size={14} className="text-gold" />;
  if (type === "join")         return <Users size={14} className="text-emerald-400" />;
  if (type === "notification") return <Bell size={14} className="text-blue-400" />;
  return <Info size={14} className="text-muted-foreground" />;
};

const typeColor = (type: string) => {
  if (type === "payment")      return "bg-gold/15 border-gold/25";
  if (type === "join")         return "bg-emerald-900/20 border-emerald-600/20";
  if (type === "notification") return "bg-blue-900/20 border-blue-600/20";
  return "bg-white/5 border-white/10";
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    approved: "text-emerald-400 bg-emerald-900/15 border-emerald-600/25",
    pending:  "text-amber-400 bg-amber-900/15 border-amber-600/25",
    declined: "text-red-400 bg-red-900/15 border-red-600/25",
    info:     "text-blue-400 bg-blue-900/15 border-blue-600/25",
    read:     "text-muted-foreground bg-muted/15 border-muted/25",
    unread:   "text-gold bg-gold/10 border-gold/20",
  };
  return map[status] || map.info;
};

export default function History() {
  const { isLoggedIn } = useApp();
  const [history, setHistory] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "payment" | "join" | "notification">("all");

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  useEffect(() => {
    api.get("/api/users/history")
      .then(data => { setHistory(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? history : history.filter(h => h.type === filter);

  const groupByDate = (items: ActivityItem[]) => {
    const groups: Record<string, ActivityItem[]> = {};
    items.forEach(item => {
      const date = new Date(item.createdAt).toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  };

  const grouped = groupByDate(filtered);

  return (
    <DashboardLayout activeTab="history">
      <ParticleBackground />
      <div className="relative z-10 p-4 md:p-6">

        <div className="mb-6 animate-fade-up">
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Audit Trail</p>
          <h1 className="gold-gradient-text text-3xl font-cinzel font-bold">Activity History</h1>
          <p className="text-muted-foreground text-sm mt-1">A complete timestamped record of all your account activity.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-up delay-100">
          {[
            { label: "Payments", count: history.filter(h => h.type === "payment").length, color: "text-gold", icon: CreditCard },
            { label: "Group Joins", count: history.filter(h => h.type === "join").length, color: "text-emerald-400", icon: Users },
            { label: "Notifications", count: history.filter(h => h.type === "notification").length, color: "text-blue-400", icon: Bell },
          ].map(s => (
            <div key={s.label} className="glass-card-static rounded-xl p-4 text-center">
              <s.icon size={18} className={`${s.color} mx-auto mb-2`} />
              <p className={`text-xl font-cinzel font-bold ${s.color}`}>{s.count}</p>
              <p className="text-muted-foreground text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-5 animate-fade-up delay-150 flex-wrap">
          {(["all", "payment", "join", "notification"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all border ${filter === f ? "bg-gold/15 border-gold/30 text-gold" : "btn-glass"}`}>
              {f === "all" && <Filter size={11} />}
              {f === "payment" && <CreditCard size={11} />}
              {f === "join" && <Users size={11} />}
              {f === "notification" && <Bell size={11} />}
              {f === "all" ? "All Activity" : f === "join" ? "Group Joins" : f + "s"}
            </button>
          ))}
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card-static rounded-2xl p-12 text-center">
            <HistoryIcon size={48} className="text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-foreground font-cinzel font-bold text-lg mb-2">No Activity Yet</h3>
            <p className="text-muted-foreground text-sm">Your activity will appear here once you start using the platform.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-up delay-200">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-gold/10" />
                  <span className="text-muted-foreground/60 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap">{date}</span>
                  <div className="h-px flex-1 bg-gold/10" />
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={item.id}
                      className="flex items-start gap-3 p-4 glass-card-static rounded-xl hover:border-gold/20 transition-all animate-fade-up"
                      style={{ animationDelay: `${idx * 0.03}s` }}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${typeColor(item.type)}`}>
                        {typeIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <p className="text-foreground font-semibold text-sm">{item.title}</p>
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase shrink-0 ${statusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{item.description}</p>
                        <p className="text-muted-foreground/40 text-[10px] mt-1.5 font-mono">
                          {new Date(item.createdAt).toLocaleString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
