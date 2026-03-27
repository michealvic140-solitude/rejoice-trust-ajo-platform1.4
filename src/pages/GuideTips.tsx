import { useState, useEffect } from "react";
import { BookOpen, Edit3, Save, Plus, Trash2, ChevronRight, Lightbulb, AlertCircle, CheckCircle, Info } from "lucide-react";
import { useApp } from "@/context/AppContext";
import ParticleBackground from "@/components/ParticleBackground";
import { api } from "@/lib/api";

interface Tip {
  id: string;
  icon: "lightbulb" | "alert" | "check" | "info";
  title: string;
  body: string;
  category: string;
}

const ICON_MAP = {
  lightbulb: Lightbulb,
  alert: AlertCircle,
  check: CheckCircle,
  info: Info,
};

const ICON_COLOR: Record<string, string> = {
  lightbulb: "text-gold bg-gold/10 border-gold/20",
  alert: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  check: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  info: "text-sky-400 bg-sky-400/10 border-sky-400/20",
};

const CATEGORIES = ["Getting Started", "Payments", "Groups", "Disbursements", "Account", "Rules"];

const DEFAULT_TIPS: Tip[] = [
  { id: "1", icon: "lightbulb", title: "What is Ajo?", body: "Ajo is a rotating savings system (ROSCA). Members contribute a fixed amount every cycle and take turns receiving the full pool. It's a community-powered way to save big.", category: "Getting Started" },
  { id: "2", icon: "check", title: "How to Join a Group", body: "Browse available groups, pick one that matches your budget and cycle preference, then select a seat number. Once you've joined, you'll receive bank details to start contributing.", category: "Groups" },
  { id: "3", icon: "info", title: "Submitting Payment Proof", body: "After transferring your contribution to the group bank account, go to your Dashboard and upload your payment receipt. Include the amount, date, and your seat number in the reference.", category: "Payments" },
  { id: "4", icon: "alert", title: "Don't Miss Your Payment Cycle", body: "Missing a payment will negatively impact your trust score and may lead to removal from the group. Always pay on time before the cycle deadline.", category: "Rules" },
  { id: "5", icon: "check", title: "How Disbursements Work", body: "When it's your seat's turn, the admin processes your disbursement. You'll receive a notification and the full pool amount will be sent to your registered bank account within 24 hours.", category: "Disbursements" },
  { id: "6", icon: "lightbulb", title: "Trust Score Matters", body: "Your trust score reflects your payment reliability. A high score (90%+) unlocks VIP benefits and priority seat selection in new groups. Keep it high by paying on time.", category: "Account" },
  { id: "7", icon: "info", title: "Changing Your Seat", body: "You can request a seat change through the Settings page. Seat changes require admin approval and are subject to availability. Only one request per cycle.", category: "Groups" },
  { id: "8", icon: "alert", title: "Restricted vs Banned Accounts", body: "Restricted accounts can view groups but cannot join or pay. Banned accounts are fully suspended. Contact support if you believe your account action was made in error.", category: "Account" },
];

export default function GuideTips() {
  const { currentUser } = useApp();
  const isAdmin = currentUser?.role === "admin";
  const [tips, setTips] = useState<Tip[]>(DEFAULT_TIPS);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [editTip, setEditTip] = useState<Tip | null>(null);

  useEffect(() => {
    api.get("/api/guide-tips").then(data => {
      if (data?.tips?.length) setTips(data.tips);
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("/api/admin/guide-tips", { tips });
      alert("Guide tips saved!");
      setEditMode(false);
    } catch (e) { alert((e as Error).message); }
    setSaving(false);
  };

  const addTip = () => {
    const newTip: Tip = { id: Date.now().toString(), icon: "lightbulb", title: "New Tip", body: "Tip content here...", category: "Getting Started" };
    setTips(prev => [...prev, newTip]);
    setEditTip(newTip);
  };

  const updateTip = (id: string, changes: Partial<Tip>) => {
    setTips(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));
    if (editTip?.id === id) setEditTip(prev => prev ? { ...prev, ...changes } : null);
  };

  const deleteTip = (id: string) => {
    setTips(prev => prev.filter(t => t.id !== id));
    if (editTip?.id === id) setEditTip(null);
  };

  const allCategories = ["All", ...CATEGORIES];
  const filtered = activeCategory === "All" ? tips : tips.filter(t => t.category === activeCategory);

  return (
    <div className="relative min-h-screen pb-20">
      <ParticleBackground />
      <div className="relative max-w-5xl mx-auto px-4 pt-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <BookOpen size={20} className="text-gold" />
            </div>
            <div>
              <h1 className="gold-gradient-text text-2xl font-cinzel font-black">Platform Guide</h1>
              <p className="text-muted-foreground text-xs">Tips & best practices for using Rejoice Ajo</p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              {editMode ? (
                <>
                  <button onClick={() => setEditMode(false)} className="btn-glass px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5">Cancel</button>
                  <button onClick={addTip} className="btn-glass px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"><Plus size={12} />Add Tip</button>
                  <button onClick={save} disabled={saving} className="btn-gold px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"><Save size={12} />{saving ? "Saving..." : "Save All"}</button>
                </>
              ) : (
                <button onClick={() => setEditMode(true)} className="btn-glass px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"><Edit3 size={12} />Edit Tips</button>
              )}
            </div>
          )}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {allCategories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${activeCategory === cat ? "bg-gold/20 border-gold/50 text-gold" : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Tips grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(tip => {
            const IconComp = ICON_MAP[tip.icon] || Lightbulb;
            const iconClass = ICON_COLOR[tip.icon] || ICON_COLOR.info;
            return (
              <div key={tip.id} className="glass-card-static rounded-2xl p-5 border border-white/8 relative group">
                {editMode && (
                  <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditTip(tip)} className="w-6 h-6 rounded-md bg-gold/20 flex items-center justify-center hover:bg-gold/30 transition-all">
                      <Edit3 size={10} className="text-gold" />
                    </button>
                    <button onClick={() => deleteTip(tip.id)} className="w-6 h-6 rounded-md bg-red-500/20 flex items-center justify-center hover:bg-red-500/30 transition-all">
                      <Trash2 size={10} className="text-red-400" />
                    </button>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconClass}`}>
                    <IconComp size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] text-muted-foreground/70 uppercase tracking-widest font-semibold">{tip.category}</span>
                    </div>
                    <h3 className="text-foreground font-bold text-sm mb-1.5">{tip.title}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">{tip.body}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-gold/40 text-[10px]">
                  <ChevronRight size={10} />
                  <span>Platform Guide</span>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="glass-card-static rounded-2xl p-12 text-center">
            <BookOpen size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No tips in this category yet.</p>
          </div>
        )}
      </div>

      {/* Edit Tip Modal */}
      {editTip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditTip(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-card border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="gold-gradient-text text-lg font-cinzel font-bold mb-4">Edit Tip</h3>
            <div className="space-y-3">
              <div>
                <label className="luxury-label">Title</label>
                <input value={editTip.title} onChange={e => updateTip(editTip.id, { title: e.target.value })} className="luxury-input" />
              </div>
              <div>
                <label className="luxury-label">Body</label>
                <textarea value={editTip.body} onChange={e => updateTip(editTip.id, { body: e.target.value })} className="luxury-input resize-none h-24" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="luxury-label">Category</label>
                  <select value={editTip.category} onChange={e => updateTip(editTip.id, { category: e.target.value })} className="luxury-input">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="luxury-label">Icon</label>
                  <select value={editTip.icon} onChange={e => updateTip(editTip.id, { icon: e.target.value as Tip["icon"] })} className="luxury-input">
                    <option value="lightbulb">💡 Lightbulb</option>
                    <option value="alert">⚠️ Alert</option>
                    <option value="check">✅ Check</option>
                    <option value="info">ℹ️ Info</option>
                  </select>
                </div>
              </div>
              <button onClick={() => setEditTip(null)} className="btn-gold w-full py-2.5 rounded-lg text-sm font-semibold">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
