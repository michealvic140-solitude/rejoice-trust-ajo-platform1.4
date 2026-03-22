import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, Lock, Users, Upload, CheckCircle, X, LogOut,
  ChevronDown, Bell, Clock, CreditCard, AlertTriangle
} from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import { api } from "@/lib/api";
import type { Slot } from "@/context/AppContext";

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  time: string;
}

interface Member {
  seatNo: number;
  userId: string;
  username: string;
  fullName: string;
  isVip: boolean;
  paymentStatus: string;
  isDisbursed: boolean;
}

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { groups, isLoggedIn, currentUser, refreshGroups } = useApp();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [countdown, setCountdown] = useState({ h: 0, m: 0, s: 0 });
  const [payProof, setPayProof] = useState<File | null>(null);
  const [payDone, setPayDone] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitRequested, setExitRequested] = useState(false);
  const [exitReason, setExitReason] = useState("");
  const [showParticipants, setShowParticipants] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(true);
  const chatRef = useRef<HTMLDivElement>(null);

  const group = groups.find(g => g.id === id);

  // ── Countdown timer — always runs, counts down to midnight GMT+1 ──────────
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const nowGMT1 = new Date(now.getTime() + 1 * 60 * 60 * 1000);
      const midnightGMT1 = new Date(nowGMT1);
      midnightGMT1.setUTCHours(23, 0, 0, 0);
      if (nowGMT1 > midnightGMT1) midnightGMT1.setUTCDate(midnightGMT1.getUTCDate() + 1);
      const diff = midnightGMT1.getTime() - nowGMT1.getTime();
      setCountdown({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  // ── Load slots & members ──────────────────────────────────────────────────
  const loadSlots = useCallback(async () => {
    if (!id) return;
    setSlotsLoading(true);
    try {
      const [slotsData, membersData] = await Promise.all([
        api.get(`/api/groups/${id}/slots`),
        api.get(`/api/groups/${id}/members`),
      ]);
      setSlots(slotsData);
      setMembers(membersData);
    } catch {}
    setSlotsLoading(false);
  }, [id]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  // ── Load chat ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !isLoggedIn) return;
    api.get(`/api/groups/${id}/chat`).then(setMessages).catch(() => {});
    const iv = setInterval(() => {
      api.get(`/api/groups/${id}/chat`).then(setMessages).catch(() => {});
    }, 5000);
    return () => clearInterval(iv);
  }, [id, isLoggedIn]);

  if (!group) return <Navigate to="/groups" replace />;

  const pad = (n: number) => n.toString().padStart(2, "0");

  const handleSlotClick = (slotId: number, status: string) => {
    if (!isLoggedIn) { navigate("/login"); return; }
    if (status === "taken" || status === "locked" || status === "mine") return;
    setSelectedSlot(slotId);
    setJoinError("");
    setShowTerms(true);
  };

  const confirmSlot = async () => {
    if (!selectedSlot || !id) return;
    setJoinLoading(true);
    setJoinError("");
    try {
      await api.post(`/api/groups/${id}/join`, { seatNo: selectedSlot });
      setShowTerms(false);
      await loadSlots();
      await refreshGroups();
    } catch (err: unknown) {
      setJoinError((err as Error).message || "Failed to join seat");
    }
    setJoinLoading(false);
  };

  const handlePayment = async () => {
    if (!payProof || !id) return;
    setPayLoading(true);
    try {
      const mySlots = slots.filter(s => s.status === "mine");
      const fd = new FormData();
      fd.append("screenshot", payProof);
      if (mySlots.length > 0) fd.append("seatNo", String(mySlots[0].id));
      await api.postForm(`/api/groups/${id}/payment`, fd);
      setPayDone(true);
    } catch (err: unknown) {
      alert((err as Error).message || "Payment submission failed");
    }
    setPayLoading(false);
  };

  const handleExit = async () => {
    if (!id) return;
    try {
      await api.post(`/api/groups/${id}/exit`, { reason: exitReason });
      setExitRequested(true);
      setShowExitModal(false);
    } catch {}
  };

  const sendMsg = async () => {
    if (!chatMsg.trim() || !currentUser || !id) return;
    try {
      const msg = await api.post(`/api/groups/${id}/chat`, { text: chatMsg });
      setMessages(prev => [...prev, msg]);
      setChatMsg("");
      setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }), 50);
    } catch {}
  };

  const slotColorClass = (status: string) => {
    if (status === "available") return "bg-emerald-900/40 border border-emerald-500/50 text-emerald-400 cursor-pointer hover:bg-emerald-800/60 hover:border-emerald-400 hover:shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all";
    if (status === "taken")     return "bg-red-900/30 border border-red-600/40 text-red-400 cursor-not-allowed";
    if (status === "locked")    return "bg-amber-900/25 border border-amber-500/40 text-amber-500 cursor-not-allowed";
    if (status === "mine")      return "bg-gold/20 border border-gold text-gold shadow-[0_0_10px_rgba(234,179,8,0.4)] cursor-default";
    return "";
  };

  const mySeats = slots.filter(s => s.status === "mine");
  const totalAvailable = slots.filter(s => s.status === "available").length;

  return (
    <div className="min-h-screen pt-16 pb-16 relative overflow-hidden">
      <ParticleBackground />

      {/* ═══ LIVE DIGITAL TIMER ═══════════════════════════════════════════════ */}
      <div className="relative z-10 w-full border-b border-gold/10 py-5 px-4"
        style={{ background: "rgba(5,5,5,0.85)", backdropFilter: "blur(24px)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">

          {/* Timer — only visible when group is live */}
          {group.isLive ? (
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-0.5"
                style={{ fontFamily: "'Cinzel', serif", fontWeight: 900, letterSpacing: "0.05em" }}>
                {[countdown.h, countdown.m, countdown.s].map((val, i) => (
                  <span key={i} className="flex items-baseline gap-0.5">
                    <span className="tabular-nums leading-none animate-countdown"
                      style={{ fontSize: "clamp(3rem, 8vw, 5rem)", background: "linear-gradient(135deg, hsl(45,93%,47%), hsl(45,100%,70%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: "drop-shadow(0 0 18px rgba(234,179,8,0.5))" }}>
                      {pad(val)}
                    </span>
                    {i < 2 && <span className="text-gold/50 font-black mx-0.5" style={{ fontSize: "clamp(2rem,5vw,3.5rem)" }}>:</span>}
                  </span>
                ))}
              </div>
              <div className="flex flex-col gap-1 ml-1">
                <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">GMT+1</span>
                <span className="text-muted-foreground/50 text-[9px]">Daily Reset</span>
                <span className="live-badge text-[9px] px-2 py-0.5">● LIVE</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Clock size={36} className="text-muted-foreground/40" />
              <div>
                <p className="text-muted-foreground text-sm font-semibold">Group Not Live</p>
                <p className="text-muted-foreground/50 text-xs">Timer starts when admin activates this group</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Group</p>
              <p className="gold-gradient-text font-cinzel font-bold text-sm">{group.name}</p>
              <p className="text-muted-foreground text-xs">₦{group.contributionAmount.toLocaleString()} / {group.cycleType}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gold-gradient flex items-center justify-center text-obsidian font-black text-sm">
              {currentUser?.firstName?.[0] || "?"}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 mt-4 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* ══ LEFT: SLOT GRID ══════════════════════════════════════════════ */}
          <div className="xl:col-span-2 space-y-4">

            {/* Group title bar */}
            <div className="glass-card-static rounded-xl px-5 py-3 flex items-center justify-between animate-fade-up">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {group.isLive && <span className="live-badge">● LIVE</span>}
                  <span className="text-muted-foreground text-xs capitalize">{group.cycleType} contributions</span>
                </div>
                <h1 className="gold-gradient-text text-xl md:text-2xl font-cinzel font-bold">{group.name}</h1>
                <p className="text-muted-foreground text-xs mt-1 max-w-md">{group.description}</p>
              </div>
            </div>

            {/* ── SLOT GRID ─────────────────────────────────────────────── */}
            <div className="glass-card-static rounded-2xl p-4 animate-fade-up delay-100">
              <div className="flex flex-wrap gap-3 mb-4 text-[10px]">
                {[
                  { cls: "bg-emerald-900/40 border border-emerald-500/50", label: "Available" },
                  { cls: "bg-red-900/30 border border-red-600/40", label: "Taken" },
                  { cls: "bg-amber-900/25 border border-amber-500/40", label: "Admin Locked" },
                  { cls: "bg-gold/20 border border-gold", label: "Your Seat" },
                ].map(({ cls, label }) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded ${cls}`} />
                    <span className="text-muted-foreground">{label}</span>
                  </span>
                ))}
              </div>

              {slotsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex gap-0.5 mb-0.5 ml-6">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div key={i} className="flex-1 text-center text-[8px] text-muted-foreground/40">{i + 1}</div>
                    ))}
                  </div>
                  <div className="flex gap-0.5">
                    <div className="flex flex-col gap-0.5">
                      {Array.from({ length: Math.ceil(slots.length / 10) }, (_, i) => (
                        <div key={i} className="w-5 h-8 flex items-center justify-end pr-1">
                          <span className="text-muted-foreground/40 text-[8px]">{i * 10 + 1}–{Math.min((i + 1) * 10, slots.length)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-10 gap-0.5 flex-1">
                      {slots.map(slot => (
                        <button key={slot.id} onClick={() => handleSlotClick(slot.id, slot.status)}
                          className={`h-8 rounded flex flex-col items-center justify-center transition-all relative group ${slotColorClass(slot.status)}`}
                          title={`Seat ${slot.id}${slot.username ? ` — @${slot.username}` : ""} · ${slot.status}${slot.isDisbursed ? " · DISBURSED" : ""}`}>
                          <span className="text-[8px] font-bold leading-none">{slot.id}</span>
                          {slot.status === "mine" && <span className="text-[6px] leading-none opacity-80 mt-0.5">YOU</span>}
                          {slot.isDisbursed && <span className="text-[5px] leading-none opacity-60 mt-0.5">✓PAID</span>}
                          {slot.username && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-lg bg-black/90 border border-gold/20 text-[9px] text-foreground whitespace-nowrap z-20 hidden group-hover:block pointer-events-none">
                              @{slot.username}{slot.isDisbursed ? " ✓ Disbursed" : ""}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="mt-3 pt-3 border-t border-gold/10 flex flex-wrap gap-4 text-xs">
                <span className="text-muted-foreground">Total: <span className="text-foreground font-bold">{slots.length}</span></span>
                <span className="text-muted-foreground">Taken: <span className="text-red-400 font-bold">{slots.filter(s => s.status === "taken" || s.status === "mine").length}</span></span>
                <span className="text-muted-foreground">Available: <span className="text-emerald-400 font-bold">{totalAvailable}</span></span>
                <span className="text-muted-foreground">My Seats: <span className="text-gold font-bold">{mySeats.length}</span></span>
              </div>
            </div>

            {/* Exit + Upload row */}
            <div className="flex gap-3 animate-fade-up delay-200">
              {exitRequested ? (
                <div className="shrink-0 px-4 py-3 rounded-xl text-sm border border-amber-600/30 bg-amber-900/15 text-amber-400 flex items-center gap-2">
                  <AlertTriangle size={14} /> Exit Requested
                </div>
              ) : (
                <button onClick={() => setShowExitModal(true)}
                  className="shrink-0 px-4 py-3 rounded-xl text-sm font-bold border border-red-600/40 bg-red-900/20 text-red-400 hover:bg-red-900/35 transition-all flex items-center gap-2">
                  <LogOut size={14} /> Exit Group
                </button>
              )}
              <label className="flex-1 glass-card-static rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-gold/40 transition-all group">
                <span className="text-muted-foreground text-sm group-hover:text-foreground transition-colors">
                  {payProof ? `✅ ${payProof.name}` : "Upload payment proof screenshot"}
                </span>
                <div className="p-2 rounded-lg bg-gold/10 border border-gold/20 group-hover:bg-gold/20 transition-all">
                  <Upload size={13} className="text-gold" />
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={e => setPayProof(e.target.files?.[0] || null)} />
              </label>
            </div>

            {/* Make Payment */}
            {isLoggedIn && !payDone && (
              <div className="glass-card-static rounded-2xl p-5 animate-fade-up delay-200">
                <button onClick={() => setShowPayment(!showPayment)} className="w-full flex items-center justify-between">
                  <h2 className="gold-text font-cinzel font-bold text-sm uppercase tracking-widest">Make Payment</h2>
                  <ChevronDown size={16} className={`text-gold transition-transform ${showPayment ? "rotate-180" : ""}`} />
                </button>
                {showPayment && (
                  <div className="mt-4 space-y-4">
                    {mySeats.length > 0 ? (
                      <div className="p-3 rounded-lg bg-gold/5 border border-gold/15 text-xs text-gold">
                        Your seats: {mySeats.map(s => `#${s.id}`).join(", ")} — Pay ₦{(group.contributionAmount * mySeats.length).toLocaleString()} total
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-amber-900/15 border border-amber-600/25 text-xs text-amber-400">
                        ⚠️ You haven't selected a seat yet. Click on a green seat to join first.
                      </div>
                    )}
                    <div className="p-4 rounded-xl bg-gold/5 border border-gold/15">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Admin Bank Details</p>
                      <div className="space-y-2 text-sm">
                        {[
                          ["Bank Name", group.bankName],
                          ["Account No", group.accountNumber],
                          ["Account Name", group.accountName],
                          ["Amount per Seat", `₦${group.contributionAmount.toLocaleString()}`],
                          mySeats.length > 1 ? ["Total Amount", `₦${(group.contributionAmount * mySeats.length).toLocaleString()}`] : null,
                        ].filter(Boolean).map(([label, val]) => (
                          <div key={label as string} className="flex justify-between">
                            <span className="text-muted-foreground">{label}:</span>
                            <span className={label === "Total Amount" || label === "Amount per Seat" ? "text-gold font-bold" : "text-foreground font-semibold"}>{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-900/15 border border-amber-500/25 text-xs text-amber-400/80">
                      ⚠️ Transfer to the account above, then upload your screenshot before clicking the button below.
                    </div>
                    <button onClick={handlePayment} disabled={!payProof || payLoading}
                      className={`btn-gold w-full py-3 rounded-xl font-bold text-sm ${(!payProof || payLoading) ? "opacity-40 cursor-not-allowed" : ""}`}>
                      {payLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" /> Submitting...
                        </span>
                      ) : "I Have Made Payment"}
                    </button>
                  </div>
                )}
              </div>
            )}
            {payDone && (
              <div className="glass-card-static rounded-2xl p-5 text-center animate-scale-in">
                <CheckCircle size={36} className="text-gold mx-auto mb-2 animate-glow-pulse" />
                <h3 className="gold-text font-cinzel font-bold">Payment Submitted!</h3>
                <p className="text-muted-foreground text-sm mt-1">Admin will verify your payment. You'll be notified once approved.</p>
              </div>
            )}

            {/* Chat */}
            {isLoggedIn && (
              <div className="glass-card-static rounded-2xl overflow-hidden animate-fade-up delay-300">
                <button onClick={() => setShowChat(!showChat)} className="w-full px-4 py-3 border-b border-gold/10 flex items-center justify-between hover:bg-gold/5 transition-colors">
                  <div className="flex items-center gap-2">
                    <Send size={13} className="text-gold" />
                    <span className="gold-text font-cinzel font-bold text-xs uppercase tracking-wide">Group Chat</span>
                    {group.chatLocked && <Lock size={10} className="text-amber-400 ml-1" />}
                  </div>
                  <ChevronDown size={14} className={`text-gold/60 transition-transform ${showChat ? "rotate-180" : ""}`} />
                </button>
                {showChat && (
                  <>
                    <div ref={chatRef} className="max-h-60 overflow-y-auto p-3 space-y-2">
                      {messages.length === 0 ? (
                        <p className="text-muted-foreground text-xs text-center py-4">No messages yet. Start the conversation!</p>
                      ) : messages.map(m => (
                        <div key={m.id} className={`flex gap-2 ${m.username === currentUser?.username ? "flex-row-reverse" : ""}`}>
                          <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-[9px] text-gold font-black shrink-0">
                            {m.username[0]?.toUpperCase()}
                          </div>
                          <div className={`flex-1 ${m.username === currentUser?.username ? "text-right" : ""}`}>
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <span className="text-gold text-[9px] font-bold">@{m.username}</span>
                              <span className="text-muted-foreground/40 text-[8px]">{m.time}</span>
                            </div>
                            <div className={`inline-block px-3 py-1.5 rounded-xl text-xs ${m.username === currentUser?.username ? "bg-gold/20 border border-gold/25 text-foreground" : "bg-white/5 border border-white/10 text-foreground/80"}`}>
                              {m.text}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {group.chatLocked ? (
                      <div className="px-3 py-2 border-t border-gold/10 text-xs text-amber-400/70 flex items-center gap-2">
                        <Lock size={11} /> Chat is locked by admin
                      </div>
                    ) : (
                      <div className="flex gap-2 p-3 border-t border-gold/10">
                        <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && sendMsg()}
                          placeholder="Type a message..." className="flex-1 luxury-input text-xs py-2" />
                        <button onClick={sendMsg} className="p-2.5 rounded-lg bg-gold/15 border border-gold/25 hover:bg-gold/25 transition-all">
                          <Send size={13} className="text-gold" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ══ RIGHT SIDEBAR ═════════════════════════════════════════════ */}
          <div className="space-y-4">

            {/* Members List */}
            <div className="glass-card-static rounded-2xl overflow-hidden animate-fade-up delay-100">
              <button onClick={() => setShowParticipants(!showParticipants)}
                className="w-full px-4 py-3 border-b border-gold/10 flex items-center justify-between hover:bg-gold/5 transition-colors">
                <div className="flex items-center gap-2">
                  <Users size={13} className="text-gold" />
                  <span className="gold-text font-cinzel font-bold text-xs uppercase tracking-wide">Members by Seat</span>
                  <span className="text-muted-foreground/60 text-[10px]">({members.length})</span>
                </div>
                <ChevronDown size={14} className={`text-gold/60 transition-transform ${showParticipants ? "rotate-180" : ""}`} />
              </button>

              {showParticipants && (
                <>
                  <div className="px-3 py-2 grid grid-cols-12 gap-1 border-b border-gold/5">
                    <span className="col-span-2 text-[9px] text-muted-foreground/60 uppercase tracking-wider">Seat</span>
                    <span className="col-span-5 text-[9px] text-muted-foreground/60 uppercase tracking-wider">Member</span>
                    <span className="col-span-3 text-[9px] text-muted-foreground/60 uppercase tracking-wider">User</span>
                    <span className="col-span-2 text-[9px] text-muted-foreground/60 uppercase tracking-wider">Status</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {members.length === 0 ? (
                      <p className="text-muted-foreground text-xs text-center py-6">No members yet</p>
                    ) : members.map((p, i) => (
                      <div key={`${p.seatNo}-${i}`}
                        className={`px-3 py-2.5 grid grid-cols-12 gap-1 items-center border-b border-gold/5 transition-colors hover:bg-gold/5 ${p.username === currentUser?.username ? "bg-gold/8 border-l-2 border-l-gold" : ""}`}>
                        <div className="col-span-2">
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black"
                            style={{ background: p.username === currentUser?.username ? "rgba(234,179,8,0.25)" : "rgba(255,255,255,0.06)", border: p.username === currentUser?.username ? "1px solid rgba(234,179,8,0.5)" : "1px solid rgba(255,255,255,0.1)", color: p.username === currentUser?.username ? "hsl(45,93%,47%)" : "hsl(0,0%,70%)" }}>
                            {p.seatNo}
                          </span>
                        </div>
                        <div className="col-span-5 flex items-center gap-1.5 min-w-0">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 bg-gold/15 text-gold">
                            {p.fullName[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-foreground text-[10px] font-semibold truncate">{p.fullName}</p>
                            {p.isVip && <span className="vip-badge text-[8px] px-1 py-0">VIP</span>}
                            {p.isDisbursed && <span className="text-[8px] text-emerald-400 font-bold">✓ Paid Out</span>}
                          </div>
                        </div>
                        <div className="col-span-3">
                          <p className="text-muted-foreground text-[9px] truncate">@{p.username}</p>
                        </div>
                        <div className="col-span-2">
                          <span className={`text-[8px] font-bold px-1 rounded ${p.paymentStatus === "paid" || p.paymentStatus === "approved" ? "text-emerald-400" : p.paymentStatus === "defaulter" ? "text-red-400" : "text-amber-400"}`}>
                            {p.paymentStatus === "approved" ? "paid" : p.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Group Info Card */}
            <div className="glass-card-static rounded-2xl p-4 space-y-3 animate-fade-up delay-200">
              <h3 className="gold-text font-cinzel font-bold text-xs uppercase tracking-wide">Group Info</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span>{group.isLive ? <span className="live-badge text-[9px]">● LIVE</span> : <span className="text-muted-foreground">Inactive</span>}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cycle</span>
                  <span className="text-foreground capitalize">{group.cycleType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contribution</span>
                  <span className="text-gold font-bold">₦{group.contributionAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slots</span>
                  <span className="text-foreground">{group.filledSlots} / {group.totalSlots}</span>
                </div>
              </div>
            </div>

            {/* My Seats */}
            {isLoggedIn && mySeats.length > 0 && (
              <div className="glass-card-static rounded-2xl p-4 animate-fade-up delay-300">
                <h3 className="gold-text font-cinzel font-bold text-xs uppercase tracking-wide mb-3">My Seats</h3>
                <div className="flex flex-wrap gap-2">
                  {mySeats.map(s => (
                    <div key={s.id} className="w-10 h-10 rounded-lg bg-gold/20 border border-gold flex items-center justify-center text-gold font-black text-sm">
                      {s.id}
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-2 rounded-lg bg-gold/5 border border-gold/15 text-[10px] text-muted-foreground">
                  <CreditCard size={10} className="inline mr-1 text-gold" />
                  Pay ₦{(group.contributionAmount * mySeats.length).toLocaleString()} for {mySeats.length} seat{mySeats.length > 1 ? "s" : ""}
                </div>
              </div>
            )}

            {/* Login prompt */}
            {!isLoggedIn && (
              <div className="glass-card-static rounded-2xl p-4 text-center animate-fade-up">
                <p className="text-muted-foreground text-sm mb-3">Sign in to join this group</p>
                <a href="/login" className="btn-gold px-4 py-2 rounded-lg text-xs font-bold inline-block">Sign In</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ TERMS MODAL ══════════════════════════════════════════════════════ */}
      {showTerms && selectedSlot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-md glass-card-static rounded-2xl border border-gold/25 animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-gold/10">
              <h3 className="gold-text font-cinzel font-bold">Confirm Seat #{selectedSlot}</h3>
              <button onClick={() => setShowTerms(false)}><X size={18} className="text-muted-foreground hover:text-foreground" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-muted-foreground text-xs leading-relaxed">{group.termsText}</p>
              <div className="p-3 rounded-lg bg-gold/5 border border-gold/15 text-xs text-muted-foreground">
                <strong className="text-foreground">Seat #{selectedSlot}</strong> — ₦{group.contributionAmount.toLocaleString()} per {group.cycleType}
              </div>
              {joinError && (
                <div className="p-2 rounded-lg bg-red-900/20 border border-red-600/30 text-red-400 text-xs">{joinError}</div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowTerms(false)} className="btn-glass flex-1 py-2.5 rounded-lg text-sm font-semibold">Cancel</button>
                <button onClick={confirmSlot} disabled={joinLoading}
                  className="btn-gold flex-1 py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
                  {joinLoading ? <span className="w-4 h-4 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" /> : "Confirm & Join"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ EXIT MODAL ═══════════════════════════════════════════════════════ */}
      {showExitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-md glass-card-static rounded-2xl border border-red-600/20 animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-red-600/10">
              <h3 className="text-red-400 font-cinzel font-bold">Request to Exit Group</h3>
              <button onClick={() => setShowExitModal(false)}><X size={18} className="text-muted-foreground hover:text-foreground" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-muted-foreground text-xs">Your exit request will be reviewed by admin. You will be notified once processed.</p>
              <div>
                <label className="luxury-label">Reason for Exit</label>
                <textarea value={exitReason} onChange={e => setExitReason(e.target.value)}
                  placeholder="Please explain why you want to exit..." className="luxury-input resize-none h-20" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowExitModal(false)} className="btn-glass flex-1 py-2.5 rounded-lg text-sm font-semibold">Cancel</button>
                <button onClick={handleExit} className="flex-1 py-2.5 rounded-lg text-sm font-bold border border-red-600/40 bg-red-900/20 text-red-400 hover:bg-red-900/35 transition-all">
                  Submit Exit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
