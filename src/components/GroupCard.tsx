import { Group } from "@/context/AppContext";
import { Link } from "react-router-dom";
import { Users, Wallet, TrendingUp } from "lucide-react";

interface GroupCardProps {
  group: Group;
}

export default function GroupCard({ group }: GroupCardProps) {
  const remaining = group.totalSlots - group.filledSlots;
  const fillPercent = Math.round((group.filledSlots / group.totalSlots) * 100);
  const totalPayout = group.contributionAmount * group.totalSlots;
  const cycleLabel = group.cycleType === "daily" ? "day" : group.cycleType === "weekly" ? "week" : "month";

  const cycleBadgeClass: Record<string, string> = {
    daily: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    weekly: "text-sky-400 bg-sky-400/10 border-sky-400/20",
    monthly: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  };

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="gold-gradient-text text-base font-cinzel font-bold leading-tight truncate">{group.name}</h3>
          <p className="text-muted-foreground text-[11px] mt-0.5 line-clamp-1">{group.description}</p>
        </div>
        {group.isLive && <span className="live-badge shrink-0 text-[9px]">● LIVE</span>}
      </div>

      {/* Pack summary banner */}
      <div className="rounded-xl bg-gold/[0.08] border border-gold/20 px-4 py-2.5 flex items-center gap-3">
        <Wallet size={15} className="text-gold shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Deposit to Collect</p>
          <p className="text-foreground font-bold text-sm leading-snug">
            ₦{group.contributionAmount.toLocaleString()}
            <span className="text-muted-foreground font-normal text-xs">/{cycleLabel} → </span>
            <span className="text-gold">₦{totalPayout.toLocaleString()}</span>
          </p>
        </div>
      </div>

      {/* Cycle + slots row */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-semibold capitalize px-2.5 py-1 rounded-full border ${cycleBadgeClass[group.cycleType] || cycleBadgeClass.monthly}`}>
          {group.cycleType}
        </span>
        <span className="text-muted-foreground text-xs flex items-center gap-1">
          <Users size={11} />{group.filledSlots}/{group.totalSlots} filled
        </span>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">{fillPercent}% full</span>
          <span className={remaining === 0 ? "text-red-400" : "text-gold"}>{remaining} seats left</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${fillPercent}%`,
              background: fillPercent > 80
                ? "linear-gradient(90deg, #ef4444, #dc2626)"
                : "linear-gradient(90deg, hsl(45,93%,47%), hsl(45,100%,60%))"
            }}
          />
        </div>
      </div>

      {/* Collect info */}
      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/80">
        <TrendingUp size={11} />
        <span>Collect <strong className="text-emerald-400">₦{totalPayout.toLocaleString()}</strong> when your seat is disbursed</span>
      </div>

      {/* CTA */}
      <Link to={`/groups/${group.id}`} className="btn-gold w-full block text-center py-2.5 rounded-lg text-sm font-semibold mt-auto">
        {remaining === 0 ? "View Group (Full)" : "Join This Group"}
      </Link>
    </div>
  );
}
