import { Group } from "@/context/AppContext";
import { Link } from "react-router-dom";
import { Users, Calendar, TrendingUp } from "lucide-react";

interface GroupCardProps {
  group: Group;
}

export default function GroupCard({ group }: GroupCardProps) {
  const remaining = group.totalSlots - group.filledSlots;
  const fillPercent = (group.filledSlots / group.totalSlots) * 100;

  const cycleColors = {
    daily: "text-emerald-400",
    weekly: "text-sky-400",
    monthly: "text-purple-400",
  };

  return (
    <div className="glass-card p-6 group cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="gold-gradient-text text-lg font-cinzel font-bold leading-tight">{group.name}</h3>
          <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{group.description}</p>
        </div>
        {group.isLive && (
          <span className="live-badge ml-3 shrink-0">● LIVE</span>
        )}
      </div>

      {/* Contribution */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-muted-foreground text-[11px] uppercase tracking-widest">Contribution</p>
          <p className="text-foreground font-bold text-xl">👑{group.contributionAmount.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-[11px] uppercase tracking-widest">Cycle</p>
          <p className={`font-semibold capitalize text-sm ${cycleColors[group.cycleType]}`}>
            <Calendar size={12} className="inline mr-1" />
            {group.cycleType}
          </p>
        </div>
      </div>

      {/* Slots Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground flex items-center gap-1">
            <Users size={11} /> {group.filledSlots} / {group.totalSlots} slots
          </span>
          <span className="text-gold">{remaining} remaining</span>
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

      {/* CTA */}
      <Link to={`/groups/${group.id}`} className="btn-gold w-full block text-center py-2.5 rounded-lg text-sm font-semibold">
        View Group
      </Link>
    </div>
  );
}
