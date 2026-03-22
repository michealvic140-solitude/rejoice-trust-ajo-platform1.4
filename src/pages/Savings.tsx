import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Navigate, Link } from "react-router-dom";
import {
  PiggyBank, Users, TrendingUp, Award, ChevronRight,
  Wallet, CheckCircle, Clock, AlertTriangle, Star
} from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import { api } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";

interface MySeat {
  groupId: string;
  groupName: string;
  seatNo: number;
  contributionAmount: number;
  cycleType: string;
  isLive: boolean;
  isDisbursed: boolean;
  totalSlots: number;
  filledSlots: number;
}

export default function Savings() {
  const { currentUser, isLoggedIn, groups, transactions } = useApp();
  const [mySeats, setMySeats] = useState<MySeat[]>([]);
  const [loading, setLoading] = useState(true);

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const seats: MySeat[] = [];
        for (const group of groups) {
          const slots = await api.get(`/api/groups/${group.id}/slots`);
          const mine = slots.filter((s: { status: string }) => s.status === "mine" || (s as { userId?: string }).userId === currentUser?.id);
          for (const slot of mine) {
            seats.push({
              groupId: group.id,
              groupName: group.name,
              seatNo: slot.id,
              contributionAmount: group.contributionAmount,
              cycleType: group.cycleType,
              isLive: group.isLive,
              isDisbursed: slot.isDisbursed,
              totalSlots: group.totalSlots,
              filledSlots: group.filledSlots,
            });
          }
        }
        setMySeats(seats);
      } catch {}
      setLoading(false);
    };
    if (groups.length > 0) load();
    else setLoading(false);
  }, [groups, currentUser?.id]);

  const totalInvested = mySeats.reduce((acc, s) => acc + s.contributionAmount, 0);
  const approvedTx = transactions.filter(t => t.status === "approved");
  const totalPaid = approvedTx.reduce((acc, t) => acc + t.amount, 0);
  const pendingTx = transactions.filter(t => t.status === "pending").length;
  const disbursedSeats = mySeats.filter(s => s.isDisbursed).length;

  return (
    <DashboardLayout activeTab="savings">
      <ParticleBackground />
      <div className="relative z-10 p-4 md:p-6">

        <div className="mb-8 animate-fade-up">
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">My Savings</p>
          <h1 className="gold-gradient-text text-3xl font-cinzel font-bold">Savings Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Track all your active slots, contributions, and payout progress.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-up delay-100">
          {[
            { icon: PiggyBank, label: "Active Slots", value: mySeats.length, color: "text-gold" },
            { icon: Wallet, label: "Total Contributed", value: `₦${totalPaid.toLocaleString()}`, color: "text-emerald-400" },
            { icon: Clock, label: "Pending Payments", value: pendingTx, color: "text-amber-400" },
            { icon: Award, label: "Disbursements", value: disbursedSeats, color: "text-blue-400" },
          ].map(s => (
            <div key={s.label} className="glass-card-static rounded-2xl p-5">
              <s.icon size={20} className={`${s.color} mb-3`} />
              <p className={`text-2xl font-cinzel font-black ${s.color}`}>{s.value}</p>
              <p className="text-muted-foreground text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* My active seats */}
        <div className="animate-fade-up delay-200">
          <h2 className="gold-text font-cinzel font-bold text-sm uppercase tracking-widest mb-4">My Active Seats</h2>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          ) : mySeats.length === 0 ? (
            <div className="glass-card-static rounded-2xl p-12 text-center">
              <PiggyBank size={48} className="text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-foreground font-cinzel font-bold text-lg mb-2">No Active Seats Yet</h3>
              <p className="text-muted-foreground text-sm mb-6">Join a savings group to start building your financial future.</p>
              <Link to="/groups" className="btn-gold px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2">
                Browse Groups <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mySeats.map((seat, i) => {
                const seatTx = transactions.filter(t => t.groupId === seat.groupId && t.seatNo === seat.seatNo);
                const paidCount = seatTx.filter(t => t.status === "approved").length;
                const progress = seat.totalSlots > 0 ? Math.round((seat.filledSlots / seat.totalSlots) * 100) : 0;

                return (
                  <div key={`${seat.groupId}-${seat.seatNo}`}
                    className="glass-card-static rounded-2xl p-5 animate-fade-up"
                    style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {seat.isLive && <span className="live-badge text-[9px]">● LIVE</span>}
                          {seat.isDisbursed && <span className="px-2 py-0.5 rounded-full bg-emerald-900/20 border border-emerald-600/25 text-emerald-400 text-[9px] font-bold">✓ DISBURSED</span>}
                        </div>
                        <h3 className="text-foreground font-bold text-base">{seat.groupName}</h3>
                        <p className="text-muted-foreground text-xs capitalize">{seat.cycleType} contributions</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center">
                        <span className="text-gold font-cinzel font-black text-lg">#{seat.seatNo}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Contribution per cycle</span>
                        <span className="text-gold font-bold">₦{seat.contributionAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Your payments made</span>
                        <span className="text-foreground font-semibold">{paidCount} approved</span>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground">Group fill rate</span>
                          <span className="text-foreground">{seat.filledSlots}/{seat.totalSlots}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/5">
                          <div className="h-full rounded-full bg-gradient-to-r from-gold to-amber-500 transition-all duration-700"
                            style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>

                    <Link to={`/groups/${seat.groupId}`}
                      className="mt-4 flex items-center justify-between px-3 py-2 rounded-xl bg-gold/8 border border-gold/15 hover:bg-gold/15 transition-all group">
                      <span className="text-gold text-xs font-semibold">View Group</span>
                      <ChevronRight size={13} className="text-gold group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available groups to join */}
        <div className="mt-8 animate-fade-up delay-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="gold-text font-cinzel font-bold text-sm uppercase tracking-widest">Available Groups to Join</h2>
            <Link to="/groups" className="text-xs text-muted-foreground hover:text-gold transition-colors flex items-center gap-1">
              View all <ChevronRight size={11} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {groups.filter(g => !mySeats.some(s => s.groupId === g.id)).slice(0, 4).map(g => (
              <Link key={g.id} to={`/groups/${g.id}`}
                className="glass-card-static rounded-xl p-4 flex items-center gap-3 hover:border-gold/30 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <Users size={16} className="text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-semibold text-sm truncate">{g.name}</p>
                  <p className="text-muted-foreground text-xs">₦{g.contributionAmount.toLocaleString()} / {g.cycleType} · {g.totalSlots - g.filledSlots} slots left</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {g.isLive && <span className="live-badge text-[9px]">LIVE</span>}
                  <ChevronRight size={13} className="text-muted-foreground group-hover:text-gold transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Leaderboard teaser */}
        <div className="mt-6 glass-card-static rounded-2xl p-5 animate-fade-up delay-400">
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} className="text-gold" />
            <h3 className="gold-text font-cinzel font-bold text-sm uppercase tracking-widest">Your Savings Rank</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground font-bold text-2xl font-cinzel">₦{currentUser?.totalPaid.toLocaleString() || "0"}</p>
              <p className="text-muted-foreground text-xs">Total amount contributed lifetime</p>
            </div>
            <Link to="/groups" className="btn-gold px-4 py-2 rounded-xl text-xs font-bold">Join More Groups</Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
