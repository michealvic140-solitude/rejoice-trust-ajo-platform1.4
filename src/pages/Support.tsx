import { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { Navigate } from "react-router-dom";
import {
  HeadphonesIcon, Plus, X, Send, Paperclip,
  CheckCircle, Clock, MessageSquare, ChevronDown, ChevronUp, Image
} from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import { api } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";

export default function Support() {
  const { isLoggedIn, currentUser, supportTickets, setSupportTickets, refreshSupportTickets } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return setError("Please fill in all required fields.");
    setError("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("subject", subject);
      fd.append("message", message);
      if (attachment) fd.append("attachment", attachment);
      const data = await api.postForm("/api/support/with-attachment", fd);
      setSupportTickets(prev => [
        { id: data.ticket.id, userId: data.ticket.user_id, username: data.ticket.username, subject: data.ticket.subject, message: data.ticket.message, status: "open", createdAt: data.ticket.created_at },
        ...prev,
      ]);
      setSubject(""); setMessage(""); setAttachment(null); setShowNew(false); setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to submit ticket. Please try again.");
    }
    setSubmitting(false);
  };

  const statusColor = (s: string) => {
    if (s === "replied") return "text-emerald-400 bg-emerald-900/20 border-emerald-600/25";
    if (s === "closed") return "text-muted-foreground bg-muted/20 border-muted/25";
    return "text-blue-400 bg-blue-900/20 border-blue-600/25";
  };

  const myTickets = supportTickets.filter(t => t.userId === currentUser?.id || t.username === currentUser?.username);

  return (
    <DashboardLayout activeTab="support">
      <ParticleBackground />
      <div className="relative z-10 p-4 md:p-6">

        <div className="mb-6 animate-fade-up">
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Help Center</p>
          <h1 className="gold-gradient-text text-3xl font-cinzel font-bold">Support</h1>
          <p className="text-muted-foreground text-sm mt-1">Get help from our support team. We typically respond within 24 hours.</p>
        </div>

        {/* Quick contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 animate-fade-up delay-100">
          {[
            { label: "Response Time", value: "Within 24 hours", icon: Clock, color: "text-gold" },
            { label: "Support Hours", value: "Mon–Sat, 8am–6pm", icon: HeadphonesIcon, color: "text-blue-400" },
            { label: "Open Tickets", value: myTickets.filter(t => t.status === "open").length.toString(), icon: MessageSquare, color: "text-amber-400" },
          ].map(s => (
            <div key={s.label} className="glass-card-static rounded-xl p-4 flex items-center gap-3">
              <s.icon size={20} className={s.color} />
              <div>
                <p className={`font-bold text-sm ${s.color}`}>{s.value}</p>
                <p className="text-muted-foreground text-xs">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Success toast */}
        {submitted && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-900/20 border border-emerald-600/30 text-emerald-400 flex items-center gap-3 animate-scale-in">
            <CheckCircle size={18} />
            <div>
              <p className="font-bold text-sm">Ticket Submitted!</p>
              <p className="text-xs opacity-80">Our team has been notified and will respond shortly.</p>
            </div>
          </div>
        )}

        {/* New ticket button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="gold-text font-cinzel font-bold text-sm uppercase tracking-widest">My Tickets</h2>
          <button onClick={() => setShowNew(!showNew)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${showNew ? "border-red-600/30 bg-red-900/15 text-red-400" : "btn-gold"}`}>
            {showNew ? <><X size={12} />Cancel</> : <><Plus size={12} />New Ticket</>}
          </button>
        </div>

        {/* New ticket form */}
        {showNew && (
          <div className="glass-card-static rounded-2xl p-5 mb-5 border border-gold/20 animate-scale-in">
            <h3 className="gold-text font-cinzel font-bold text-base mb-4">Submit a Support Request</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="luxury-label">Subject *</label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="Brief description of your issue" className="luxury-input" required />
              </div>
              <div>
                <label className="luxury-label">Message *</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Please describe your issue in detail. Include any relevant group names, seat numbers, payment codes, or dates..."
                  className="luxury-input resize-none h-32" required />
              </div>

              {/* File attachment */}
              <div>
                <label className="luxury-label flex items-center gap-1.5"><Paperclip size={12} />Attachment (optional)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/20 bg-white/3 cursor-pointer hover:border-gold/30 hover:bg-gold/5 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <Image size={14} className="text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {attachment ? (
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-xs font-medium truncate">{attachment.name}</span>
                        <button type="button" onClick={e => { e.stopPropagation(); setAttachment(null); }}
                          className="shrink-0 w-4 h-4 rounded-full bg-red-900/30 text-red-400 flex items-center justify-center">
                          <X size={9} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">Click to attach screenshot or file (max 10MB)</span>
                    )}
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden"
                  onChange={e => setAttachment(e.target.files?.[0] || null)} />
                <p className="text-muted-foreground/50 text-[10px] mt-1">Accepted: images, PDF, Word documents</p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-900/20 border border-red-600/30 text-red-400 text-xs">{error}</div>
              )}

              <div className="p-3 rounded-lg bg-gold/5 border border-gold/15 text-xs text-muted-foreground">
                💡 Tip: Include your payment reference code, group name, and seat number for faster resolution.
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNew(false)} className="btn-glass flex-1 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="btn-gold flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting ? <span className="w-4 h-4 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" /> : <><Send size={13} />Submit Ticket</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Ticket list */}
        <div className="space-y-3 animate-fade-up delay-200">
          {myTickets.length === 0 ? (
            <div className="glass-card-static rounded-2xl p-12 text-center">
              <HeadphonesIcon size={48} className="text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-foreground font-cinzel font-bold text-lg mb-2">No Tickets Yet</h3>
              <p className="text-muted-foreground text-sm mb-5">Click "New Ticket" above to contact our support team.</p>
            </div>
          ) : myTickets.map(t => (
            <div key={t.id} className="glass-card-static rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                className="w-full p-4 flex items-center justify-between gap-3 hover:bg-gold/3 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <MessageSquare size={14} className="text-gold" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-foreground font-semibold text-sm truncate">{t.subject}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(t.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${statusColor(t.status)}`}>
                    {t.status}
                  </span>
                  {expandedId === t.id ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                </div>
              </button>

              {expandedId === t.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-gold/10">
                  <div className="pt-3">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1.5">Your Message</p>
                    <p className="text-foreground text-sm leading-relaxed bg-white/4 rounded-xl p-3 border border-white/8">{t.message}</p>
                  </div>

                  {t.adminReply && (
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1.5">Admin Reply</p>
                      <div className="bg-gold/8 rounded-xl p-3 border border-gold/15">
                        <p className="text-foreground text-sm leading-relaxed">{t.adminReply}</p>
                        {t.repliedAt && (
                          <p className="text-muted-foreground/60 text-[10px] mt-2">
                            Replied {new Date(t.repliedAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {t.status === "open" && !t.adminReply && (
                    <div className="p-3 rounded-lg bg-amber-900/10 border border-amber-600/20 text-amber-400/80 text-xs flex items-center gap-2">
                      <Clock size={12} />Awaiting response from our support team. We'll notify you when we reply.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
