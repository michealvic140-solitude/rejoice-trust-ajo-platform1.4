import { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { Navigate } from "react-router-dom";
import {
  Users, BarChart3, Shield, FileText, Bell, Ban, Star, Lock,
  Search, AlertTriangle, CheckCircle, X, MessageSquare,
  UserX, UserCheck, Crown, Eye, EyeOff, Edit, Send, Plus, Megaphone, ListChecks,
  TrendingUp, LogOut, Trash2, Phone, Key, Mail, Image, Video,
  ToggleLeft, ToggleRight, Facebook, CreditCard, Reply, Tag, Info,
  ChevronRight, RefreshCw, Wallet, Settings, MinusCircle
} from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import { api } from "@/lib/api";
import type { Announcement, SupportTicket } from "@/context/AppContext";

type SideTab =
  | "overview" | "users" | "groups" | "payments"
  | "announcements" | "seat-changes" | "seat-removals" | "defaulters"
  | "audit" | "exit-requests" | "live-groups" | "tags"
  | "support" | "contact-info" | "group-messages";

const SIDEBAR_ITEMS: { id: SideTab; icon: React.FC<{ size?: number }>; label: string; adminOnly?: boolean }[] = [
  { id: "overview",       icon: BarChart3,     label: "Overview" },
  { id: "users",          icon: Users,         label: "Users",            adminOnly: true },
  { id: "groups",         icon: Shield,        label: "Groups",           adminOnly: true },
  { id: "payments",       icon: FileText,      label: "Payments",         adminOnly: true },
  { id: "announcements",  icon: Megaphone,     label: "Announcements" },
  { id: "group-messages", icon: MessageSquare, label: "Group Messages" },
  { id: "support",        icon: Bell,          label: "Support Tickets" },
  { id: "contact-info",   icon: Phone,         label: "Contact Info",     adminOnly: true },
  { id: "seat-changes",   icon: ListChecks,    label: "Seat Changes",     adminOnly: true },
  { id: "seat-removals",  icon: MinusCircle,   label: "Seat Removals",    adminOnly: true },
  { id: "defaulters",     icon: AlertTriangle, label: "Defaulters",       adminOnly: true },
  { id: "exit-requests",  icon: LogOut,        label: "Exit Requests",    adminOnly: true },
  { id: "live-groups",    icon: TrendingUp,    label: "Live Groups",      adminOnly: true },
  { id: "audit",          icon: FileText,      label: "Audit Logs",       adminOnly: true },
  { id: "tags",           icon: Star,          label: "VIP Tags",         adminOnly: true },
];

const Btn = ({ onClick, children, variant = "glass", size = "sm", className = "", disabled = false }: {
  onClick?: () => void; children: React.ReactNode;
  variant?: "glass" | "gold" | "red" | "green" | "blue" | "amber";
  size?: "xs" | "sm"; className?: string; disabled?: boolean;
}) => {
  const base = "inline-flex items-center gap-1 font-semibold rounded-lg transition-all cursor-pointer border disabled:opacity-50";
  const sz = size === "xs" ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs";
  const vars: Record<string, string> = {
    glass: "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:border-white/20",
    gold:  "border-gold/40 bg-gold/10 text-gold hover:bg-gold/20",
    red:   "border-red-600/30 bg-red-900/15 text-red-400 hover:bg-red-900/30",
    green: "border-emerald-600/30 bg-emerald-900/15 text-emerald-400 hover:bg-emerald-900/30",
    blue:  "border-blue-600/30 bg-blue-900/15 text-blue-400 hover:bg-blue-900/30",
    amber: "border-amber-600/30 bg-amber-900/15 text-amber-400 hover:bg-amber-900/30",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sz} ${vars[variant]} ${className}`}>{children}</button>
  );
};

const SectionHeader = ({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) => (
  <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
    <div>
      <h2 className="gold-gradient-text font-cinzel font-bold text-xl">{title}</h2>
      {sub && <p className="text-muted-foreground text-xs mt-1">{sub}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </div>
);

const Table = ({ cols, children }: { cols: string[]; children: React.ReactNode }) => (
  <div className="overflow-x-auto rounded-xl border border-gold/15">
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-gold/15 bg-gold/5">
          {cols.map(c => <th key={c} className="px-4 py-3 text-left text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">{c}</th>)}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

const TR = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <tr className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${className}`}>{children}</tr>
);
const TD = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 ${className}`}>{children}</td>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    active: "text-emerald-400 bg-emerald-900/20 border-emerald-600/25",
    restricted: "text-amber-400 bg-amber-900/20 border-amber-600/25",
    frozen: "text-blue-400 bg-blue-900/20 border-blue-600/25",
    banned: "text-red-400 bg-red-900/20 border-red-600/25",
    pending: "text-amber-400 bg-amber-900/20 border-amber-600/25",
    approved: "text-emerald-400 bg-emerald-900/20 border-emerald-600/25",
    declined: "text-red-400 bg-red-900/20 border-red-600/25",
    open: "text-blue-400 bg-blue-900/20 border-blue-600/25",
    replied: "text-emerald-400 bg-emerald-900/20 border-emerald-600/25",
    closed: "text-muted-foreground bg-muted/20 border-muted/25",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${map[status] ?? "text-muted-foreground"}`}>{status}</span>
  );
};

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
    <div className="w-full max-w-xl glass-card-static rounded-2xl border border-gold/20 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-5 border-b border-gold/15">
        <h3 className="gold-text font-cinzel font-bold text-base">{title}</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

// ─── Main ────────────────────────────────────────────────────────────────────
export default function Admin() {
  const { currentUser, isLoggedIn, groups, refreshGroups, announcements, setAnnouncements, refreshAnnouncements, supportTickets, setSupportTickets, refreshSupportTickets, contactInfo, setContactInfo, refreshContactInfo, maintenanceMode, setMaintenanceMode } = useApp();
  const isAdmin = currentUser?.role === "admin";

  const [sideTab, setSideTab] = useState<SideTab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const serverMaintenance = maintenanceMode;

  const toggleMaintenance = async () => {
    const newVal = !maintenanceMode;
    try {
      await api.post("/api/admin/maintenance", { enabled: newVal });
      setMaintenanceMode(newVal);
    } catch {}
  };

  // Data loaded from API
  const [adminUsers, setAdminUsers]             = useState<Record<string, unknown>[]>([]);
  const [adminPayments, setAdminPayments]       = useState<Record<string, unknown>[]>([]);
  const [defaulters, setDefaulters]             = useState<Record<string, unknown>[]>([]);
  const [exitRequests, setExitRequests]         = useState<Record<string, unknown>[]>([]);
  const [seatChanges, setSeatChanges]           = useState<Record<string, unknown>[]>([]);
  const [seatRemovals, setSeatRemovals]         = useState<Record<string, unknown>[]>([]);
  const [auditLogs, setAuditLogs]               = useState<Record<string, unknown>[]>([]);
  const [stats, setStats]                       = useState({ totalUsers: 0, activeGroups: 0, pendingPayments: 0, openTickets: 0, totalDefaulters: 0 });
  const [loading, setLoading]                   = useState(false);
  const [showTrustScore, setShowTrustScore]       = useState<string | null>(null);
  const [trustScoreValue, setTrustScoreValue]     = useState("");
  const [showGroupMembers, setShowGroupMembers]   = useState<string | null>(null);
  const [groupMembersList, setGroupMembersList]   = useState<Record<string, unknown>[]>([]);
  const [showGroupEdit, setShowGroupEdit]         = useState<string | null>(null);
  const [editGroupData, setEditGroupData]         = useState<Record<string, string>>({});

  // Modals
  const [showReminderModal, setShowReminderModal]   = useState(false);
  const [showCreateGroup, setShowCreateGroup]       = useState(false);
  const [showAnnouncement, setShowAnnouncement]     = useState(false);
  const [showGroupMsg, setShowGroupMsg]             = useState(false);
  const [showUserEdit, setShowUserEdit]             = useState<string | null>(null);
  const [showSupportReply, setShowSupportReply]     = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset]   = useState<string | null>(null);

  // Form state
  const [reminderTarget, setReminderTarget]   = useState("");
  const [reminderMsg, setReminderMsg]         = useState("");
  const [annTitle, setAnnTitle]               = useState("");
  const [annBody, setAnnBody]                 = useState("");
  const [annType, setAnnType]                 = useState<Announcement["type"]>("announcement");
  const [annMediaType, setAnnMediaType]       = useState<"none" | "image" | "video">("none");
  const [annMediaFile, setAnnMediaFile]       = useState<File | null>(null);
  const annMediaRef = useRef<HTMLInputElement>(null);
  const [groupMsgTarget, setGroupMsgTarget]   = useState("");
  const [groupMsgBody, setGroupMsgBody]       = useState("");
  const [supportReplyText, setSupportReplyText] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [editedUser, setEditedUser]           = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords]     = useState<Record<string, boolean>>({});
  const [editContact, setEditContact]         = useState({ ...contactInfo });

  // Group form
  const [gName, setGName]   = useState("");
  const [gDesc, setGDesc]   = useState("");
  const [gAmt, setGAmt]     = useState("");
  const [gCycle, setGCycle] = useState("daily");
  const [gSlots, setGSlots] = useState("100");
  const [gBank, setGBank]   = useState("");
  const [gAccNum, setGAccNum] = useState("");
  const [gAccName, setGAccName] = useState("");
  const [gTerms, setGTerms] = useState("");

  const [defaulterGroupId, setDefaulterGroupId] = useState("");

  if (!isLoggedIn || (currentUser?.role !== "admin" && currentUser?.role !== "moderator")) {
    return <Navigate to="/login" replace />;
  }

  const loadData = async (tab: SideTab) => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      switch (tab) {
        case "overview":      setStats(await api.get("/api/admin/overview-stats")); break;
        case "users":         setAdminUsers(await api.get("/api/admin/users")); break;
        case "payments":      setAdminPayments(await api.get("/api/admin/payments")); break;
        case "defaulters":    setDefaulters(await api.get("/api/admin/defaulters")); break;
        case "exit-requests": setExitRequests(await api.get("/api/admin/exit-requests")); break;
        case "seat-changes":  setSeatChanges(await api.get("/api/admin/seat-changes")); break;
        case "seat-removals": setSeatRemovals(await api.get("/api/admin/seat-removals")); break;
        case "audit":         setAuditLogs(await api.get("/api/admin/audit-logs")); break;
        case "groups": case "live-groups": await refreshGroups(); break;
        default: break;
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadData(sideTab);
    if (sideTab === "support") refreshSupportTickets();
    if (sideTab === "announcements" || sideTab === "group-messages") refreshAnnouncements();
    if (sideTab === "contact-info") { refreshContactInfo(); }
  }, [sideTab]);

  useEffect(() => { setEditContact({ ...contactInfo }); }, [contactInfo]);

  const doUserAction = async (userId: string, action: string) => {
    try {
      await api.patch(`/api/admin/users/${userId}`, { action });
      const updated = await api.get("/api/admin/users");
      setAdminUsers(updated);
    } catch (e) { alert((e as Error).message); }
  };

  const doPaymentAction = async (payId: string, status: string) => {
    try {
      await api.patch(`/api/admin/payments/${payId}`, { status });
      setAdminPayments(prev => prev.map((p: Record<string, unknown>) => p.id === payId ? { ...p, status } : p));
    } catch (e) { alert((e as Error).message); }
  };

  const doGroupAction = async (groupId: string, action: string, extra?: Record<string, unknown>) => {
    try {
      await api.patch(`/api/admin/groups/${groupId}`, { action, ...extra });
      await refreshGroups();
    } catch (e) { alert((e as Error).message); }
  };

  const doDisbursement = async (groupId: string, seatNo: number) => {
    try {
      await api.post(`/api/admin/groups/${groupId}/disburse/${seatNo}`, {});
      alert("Disbursement recorded and member notified!");
    } catch (e) { alert((e as Error).message); }
  };

  const submitAnnouncement = async () => {
    if (!annTitle || !annBody) return;
    try {
      let ann;
      if (annMediaFile) {
        const fd = new FormData();
        fd.append("title", annTitle);
        fd.append("body", annBody);
        fd.append("type", annType);
        fd.append("mediaType", annMediaType);
        fd.append("media", annMediaFile);
        ann = await api.postForm("/api/announcements", fd);
      } else {
        ann = await api.post("/api/announcements", { title: annTitle, body: annBody, type: annType });
      }
      setAnnouncements(prev => [ann, ...prev]);
      setAnnTitle(""); setAnnBody(""); setAnnMediaType("none"); setAnnMediaFile(null); setShowAnnouncement(false);
    } catch (e) { alert((e as Error).message); }
  };

  const saveTrustScore = async (userId: string) => {
    try {
      await api.patch(`/api/admin/users/${userId}/trust-score`, { trustScore: trustScoreValue });
      const updated = await api.get("/api/admin/users");
      setAdminUsers(updated);
      setShowTrustScore(null); setTrustScoreValue("");
      alert("Trust score updated!");
    } catch (e) { alert((e as Error).message); }
  };

  const doSeatRemoval = async (id: string, status: string) => {
    try {
      await api.patch(`/api/admin/seat-removals/${id}`, { status });
      setSeatRemovals(prev => prev.map((r: Record<string, unknown>) => r.id === id ? { ...r, status } : r));
    } catch (e) { alert((e as Error).message); }
  };

  const openGroupMembers = async (groupId: string) => {
    setShowGroupMembers(groupId);
    try {
      const data = await api.get(`/api/admin/groups/${groupId}/members`);
      setGroupMembersList(data);
    } catch (e) { alert((e as Error).message); }
  };

  const kickFromGroup = async (groupId: string, userId: string) => {
    if (!confirm("Remove this user from ALL their seats in this group?")) return;
    try {
      await api.post(`/api/admin/groups/${groupId}/kick/${userId}`, {});
      const data = await api.get(`/api/admin/groups/${groupId}/members`);
      setGroupMembersList(data);
      await refreshGroups();
    } catch (e) { alert((e as Error).message); }
  };

  const removeSeatAdmin = async (groupId: string, seatNo: number) => {
    if (!confirm(`Clear seat #${seatNo}?`)) return;
    try {
      await api.post(`/api/admin/groups/${groupId}/remove-seat/${seatNo}`, {});
      const data = await api.get(`/api/admin/groups/${groupId}/members`);
      setGroupMembersList(data);
      await refreshGroups();
    } catch (e) { alert((e as Error).message); }
  };

  const openGroupEdit = (g: { id: string | number; name: string; description: string; contributionAmount: number; cycleType: string; bankName?: string; accountNumber?: string; accountName?: string; termsText?: string }) => {
    setShowGroupEdit(String(g.id));
    setEditGroupData({
      name: g.name, description: g.description,
      contributionAmount: String(g.contributionAmount), cycleType: g.cycleType,
      bankName: g.bankName || "", accountNumber: g.accountNumber || "",
      accountName: g.accountName || "", termsText: g.termsText || ""
    });
  };

  const saveGroupEdit = async () => {
    if (!showGroupEdit) return;
    try {
      await api.patch(`/api/admin/groups/${showGroupEdit}`, {
        name: editGroupData.name, description: editGroupData.description,
        contributionAmount: Number(editGroupData.contributionAmount),
        cycleType: editGroupData.cycleType, bankName: editGroupData.bankName,
        accountNumber: editGroupData.accountNumber, accountName: editGroupData.accountName,
        termsText: editGroupData.termsText
      });
      await refreshGroups();
      setShowGroupEdit(null);
      alert("Group updated!");
    } catch (e) { alert((e as Error).message); }
  };

  const submitGroupMessage = async () => {
    if (!groupMsgTarget || !groupMsgBody) return;
    try {
      const group = groups.find(g => g.id === groupMsgTarget);
      const ann = await api.post("/api/announcements", { title: `Message to ${group?.name ?? "Group"}`, body: groupMsgBody, type: "group-message", targetGroupId: groupMsgTarget });
      setAnnouncements(prev => [ann, ...prev]);
      setGroupMsgBody(""); setGroupMsgTarget(""); setShowGroupMsg(false);
    } catch (e) { alert((e as Error).message); }
  };

  const submitSupportReply = async (ticketId: string) => {
    if (!supportReplyText) return;
    try {
      await api.patch(`/api/support/${ticketId}/reply`, { reply: supportReplyText });
      setSupportTickets(prev => prev.map((t: SupportTicket) =>
        t.id === ticketId ? { ...t, adminReply: supportReplyText, status: "replied" as SupportTicket["status"], repliedAt: new Date().toISOString() } : t
      ));
      setSupportReplyText(""); setShowSupportReply(null);
    } catch (e) { alert((e as Error).message); }
  };

  const closeTicket = async (ticketId: string) => {
    try {
      await api.patch(`/api/support/${ticketId}/close`, {});
      setSupportTickets(prev => prev.map((t: SupportTicket) => t.id === ticketId ? { ...t, status: "closed" as SupportTicket["status"] } : t));
    } catch {}
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await api.delete(`/api/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch {}
  };

  const saveUserEdit = async (userId: string) => {
    try {
      await api.patch(`/api/admin/users/${userId}`, { ...editedUser });
      const updated = await api.get("/api/admin/users");
      setAdminUsers(updated);
      setEditedUser({}); setShowUserEdit(null);
    } catch (e) { alert((e as Error).message); }
  };

  const resetPassword = async (userId: string) => {
    if (!newPassword) return;
    try {
      await api.patch(`/api/admin/users/${userId}`, { action: "resetPassword", newPassword });
      setNewPassword(""); setShowPasswordReset(null);
      alert("Password reset successfully");
    } catch (e) { alert((e as Error).message); }
  };

  const saveContactInfo = async () => {
    try {
      await api.put("/api/contact", editContact);
      setContactInfo(editContact);
      alert("Contact info saved!");
    } catch (e) { alert((e as Error).message); }
  };

  const createGroup = async () => {
    try {
      await api.post("/api/admin/groups", { name: gName, description: gDesc, contributionAmount: Number(gAmt), cycleType: gCycle, totalSlots: Number(gSlots), bankName: gBank, accountNumber: gAccNum, accountName: gAccName, termsText: gTerms });
      await refreshGroups();
      setShowCreateGroup(false);
      setGName(""); setGDesc(""); setGAmt(""); setGBank(""); setGAccNum(""); setGAccName(""); setGTerms("");
    } catch (e) { alert((e as Error).message); }
  };

  const sendReminder = async () => {
    try {
      await api.post("/api/admin/reminder", { target: reminderTarget || "all", message: reminderMsg });
      setReminderTarget(""); setReminderMsg(""); setShowReminderModal(false);
      alert("Reminder sent!");
    } catch (e) { alert((e as Error).message); }
  };

  const checkDefaulters = async () => {
    if (!defaulterGroupId) return alert("Select a group first");
    try {
      const res = await api.post("/api/admin/check-defaulters", { groupId: defaulterGroupId });
      alert(`Defaulter check complete: ${res.count} defaulters found and notified.`);
      const updated = await api.get("/api/admin/defaulters");
      setDefaulters(updated);
    } catch (e) { alert((e as Error).message); }
  };

  const doExitRequest = async (id: string, status: string) => {
    try {
      await api.patch(`/api/admin/exit-requests/${id}`, { status });
      setExitRequests(prev => prev.map((e: Record<string, unknown>) => e.id === id ? { ...e, status } : e));
    } catch {}
  };

  const doSeatChange = async (id: string, status: string) => {
    try {
      await api.patch(`/api/admin/seat-changes/${id}`, { status });
      setSeatChanges(prev => prev.map((s: Record<string, unknown>) => s.id === id ? { ...s, status } : s));
    } catch {}
  };

  const removeDefaulter = async (id: string) => {
    try {
      await api.delete(`/api/admin/defaulters/${id}`);
      setDefaulters(prev => prev.filter((d: Record<string, unknown>) => d.id !== id));
    } catch {}
  };

  const filteredUsers = adminUsers.filter((u: Record<string, unknown>) => {
    const q = searchQuery.toLowerCase();
    return (u.username as string)?.toLowerCase().includes(q) || (u.fullName as string)?.toLowerCase().includes(q) || (u.email as string)?.toLowerCase().includes(q);
  });

  const filteredPayments = adminPayments.filter((p: Record<string, unknown>) => {
    const q = searchQuery.toLowerCase();
    return (p.user as string)?.toLowerCase().includes(q) || (p.code as string)?.toLowerCase().includes(q) || (p.group as string)?.toLowerCase().includes(q);
  });

  const editUser = adminUsers.find((u: Record<string, unknown>) => u.id === showUserEdit) as Record<string, unknown> | undefined;
  const replyTicket = supportTickets.find(t => t.id === showSupportReply);

  return (
    <div className="min-h-screen pt-16 flex relative">
      <ParticleBackground />

      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      <aside className="fixed left-0 top-16 bottom-0 w-52 border-r border-gold/10 z-40 overflow-y-auto"
        style={{ background: "rgba(8,8,8,0.92)", backdropFilter: "blur(20px)" }}>
        <div className="p-4 border-b border-gold/10">
          <p className="gold-gradient-text font-cinzel font-bold text-sm">{isAdmin ? "ADMIN PANEL" : "MOD PANEL"}</p>
          <p className="text-muted-foreground text-[10px] mt-0.5">@{currentUser?.username}</p>
        </div>
        <nav className="p-2">
          {SIDEBAR_ITEMS.filter(item => !item.adminOnly || isAdmin).map(item => (
            <button key={item.id} onClick={() => setSideTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all mb-1 text-left ${sideTab === item.id ? "bg-gold/15 border border-gold/30 text-gold" : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"}`}>
              <item.icon size={13} />{item.label}
            </button>
          ))}
        </nav>
        {isAdmin && (
          <div className="p-3 border-t border-gold/10 mt-2">
            <p className="text-muted-foreground text-[10px] mb-2 uppercase tracking-widest">Server</p>
            <button onClick={toggleMaintenance}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${serverMaintenance ? "bg-red-900/20 border-red-600/30 text-red-400" : "bg-emerald-900/10 border-emerald-600/20 text-emerald-400"}`}>
              {serverMaintenance ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              {serverMaintenance ? "Maintenance ON" : "Platform Live"}
            </button>
          </div>
        )}
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────────────── */}
      <main className="ml-52 flex-1 p-6 relative z-10">

        {/* ══ OVERVIEW ════════════════════════════════════════════════════════ */}
        {sideTab === "overview" && (
          <div>
            <SectionHeader title="Admin Overview" sub="Platform summary and quick actions"
              actions={<Btn onClick={() => loadData("overview")} variant="glass"><RefreshCw size={12} /> Refresh</Btn>} />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { label: "Total Users",     val: stats.totalUsers,      color: "text-gold" },
                { label: "Active Groups",   val: stats.activeGroups,    color: "text-emerald-400" },
                { label: "Pending Payments",val: stats.pendingPayments, color: "text-amber-400" },
                { label: "Open Tickets",    val: stats.openTickets,     color: "text-blue-400" },
                { label: "Defaulters",      val: stats.totalDefaulters, color: "text-red-400" },
              ].map(s => (
                <div key={s.label} className="glass-card-static rounded-2xl p-5 text-center">
                  <p className={`text-3xl font-cinzel font-black ${s.color}`}>{s.val}</p>
                  <p className="text-muted-foreground text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            {isAdmin && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                {[
                  { label: "Send Reminder",    icon: Bell,    action: () => setShowReminderModal(true) },
                  { label: "Post Announcement",icon: Megaphone, action: () => setShowAnnouncement(true) },
                  { label: "Create Group",     icon: Plus,    action: () => setShowCreateGroup(true) },
                  { label: "Go to Payments",   icon: FileText, action: () => setSideTab("payments") },
                  { label: "Manage Users",     icon: Users,   action: () => setSideTab("users") },
                  { label: "View Audit Logs",  icon: Settings, action: () => setSideTab("audit") },
                ].map(q => (
                  <button key={q.label} onClick={q.action}
                    className="glass-card-static rounded-xl p-4 text-left hover:border-gold/30 transition-all flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/20 transition-all">
                      <q.icon size={14} className="text-gold" />
                    </div>
                    <span className="text-foreground text-xs font-semibold">{q.label}</span>
                    <ChevronRight size={12} className="text-muted-foreground ml-auto" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ USERS ═══════════════════════════════════════════════════════════ */}
        {sideTab === "users" && isAdmin && (
          <div>
            <SectionHeader title="User Management" sub={`${adminUsers.length} registered users`}
              actions={<>
                <div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search users..." className="luxury-input pl-9 text-xs py-2 w-48" /></div>
                <Btn onClick={() => loadData("users")} variant="glass"><RefreshCw size={12} /></Btn>
              </>} />
            <Table cols={["User", "Email", "Phone", "Status", "Role", "Actions"]}>
              {filteredUsers.map((u: Record<string, unknown>) => (
                <TR key={u.id as string}>
                  <TD>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-[10px] font-black">{(u.fullName as string)?.[0]}</div>
                      <div>
                        <p className="text-foreground font-semibold">{u.fullName as string}</p>
                        <p className="text-muted-foreground text-[10px]">@{u.username as string}</p>
                        {u.isVip && <span className="vip-badge text-[8px] px-1 py-0">VIP</span>}
                      </div>
                    </div>
                  </TD>
                  <TD><span className="text-muted-foreground">{u.email as string}</span></TD>
                  <TD><span className="text-muted-foreground">{u.phone as string}</span></TD>
                  <TD><StatusBadge status={u.status as string} /></TD>
                  <TD><span className="text-muted-foreground capitalize">{u.role as string}</span></TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      <Btn size="xs" variant="glass" onClick={() => { setShowUserEdit(u.id as string); setEditedUser({ fullName: u.fullName as string, email: u.email as string, phone: u.phone as string }); }}><Edit size={10} />Edit</Btn>
                      {!(u.isBanned as boolean) ? <Btn size="xs" variant="red" onClick={() => doUserAction(u.id as string, "ban")}><Ban size={10} />Ban</Btn>
                        : <Btn size="xs" variant="green" onClick={() => doUserAction(u.id as string, "unban")}><UserCheck size={10} />Unban</Btn>}
                      {!(u.isFrozen as boolean) ? <Btn size="xs" variant="blue" onClick={() => doUserAction(u.id as string, "freeze")}><Lock size={10} />Freeze</Btn>
                        : <Btn size="xs" variant="green" onClick={() => doUserAction(u.id as string, "unfreeze")}><UserCheck size={10} />Unfreeze</Btn>}
                      {!(u.isRestricted as boolean) ? <Btn size="xs" variant="amber" onClick={() => doUserAction(u.id as string, "restrict")}><UserX size={10} />Restrict</Btn>
                        : <Btn size="xs" variant="green" onClick={() => doUserAction(u.id as string, "unrestrict")}><UserCheck size={10} />Unrestrict</Btn>}
                      <Btn size="xs" variant="gold" onClick={() => doUserAction(u.id as string, "vip")}><Crown size={10} />{u.isVip ? "Remove VIP" : "Make VIP"}</Btn>
                      <Btn size="xs" variant="glass" onClick={() => doUserAction(u.id as string, "moderator")}><Star size={10} />{u.role === "moderator" ? "Remove Mod" : "Make Mod"}</Btn>
                      <Btn size="xs" variant="glass" onClick={() => setShowPasswordReset(u.id as string)}><Key size={10} />Reset Pw</Btn>
                      <Btn size="xs" variant="amber" onClick={() => { setShowTrustScore(u.id as string); setTrustScoreValue(String(u.trustScore ?? 80)); }}><Star size={10} />Trust: {u.trustScore ?? 80}</Btn>
                    </div>
                  </TD>
                </TR>
              ))}
            </Table>
          </div>
        )}

        {/* ══ GROUPS ══════════════════════════════════════════════════════════ */}
        {sideTab === "groups" && isAdmin && (
          <div>
            <SectionHeader title="Group Management" sub={`${groups.length} groups`}
              actions={<Btn onClick={() => setShowCreateGroup(true)} variant="gold"><Plus size={12} />New Group</Btn>} />
            <Table cols={["Group", "Cycle", "Slots", "Status", "Actions"]}>
              {groups.map(g => (
                <TR key={g.id}>
                  <TD>
                    <p className="text-foreground font-semibold">{g.name}</p>
                    <p className="text-muted-foreground text-[10px]">₦{g.contributionAmount.toLocaleString()} · {g.filledSlots}/{g.totalSlots} filled</p>
                  </TD>
                  <TD><span className="text-muted-foreground capitalize">{g.cycleType}</span></TD>
                  <TD><span className="text-muted-foreground">{g.filledSlots} / {g.totalSlots}</span></TD>
                  <TD>
                    <div className="flex gap-1 flex-wrap">
                      {g.isLive && <span className="live-badge text-[8px]">● LIVE</span>}
                      {g.isLocked && <StatusBadge status="restricted" />}
                    </div>
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      <Btn size="xs" variant={g.isLive ? "red" : "green"} onClick={() => doGroupAction(String(g.id), "live")}>
                        {g.isLive ? "Deactivate" : "Go Live"}
                      </Btn>
                      <Btn size="xs" variant={g.isLocked ? "gold" : "amber"} onClick={() => doGroupAction(String(g.id), "lock")}>
                        {g.isLocked ? "Unlock" : "Lock"}
                      </Btn>
                      <Btn size="xs" variant="glass" onClick={() => doGroupAction(String(g.id), "chatLock")}>
                        {g.chatLocked ? "Unlock Chat" : "Lock Chat"}
                      </Btn>
                      <Btn size="xs" variant="gold" onClick={() => { const seatNo = parseInt(prompt("Seat # to disburse:") || "0"); if (seatNo) doDisbursement(String(g.id), seatNo); }}>
                        <Wallet size={10} />Disburse
                      </Btn>
                      <Btn size="xs" variant="blue" onClick={() => openGroupEdit(g)}>
                        <Edit size={10} />Edit
                      </Btn>
                      <Btn size="xs" variant="glass" onClick={() => openGroupMembers(String(g.id))}>
                        <Users size={10} />Members
                      </Btn>
                    </div>
                  </TD>
                </TR>
              ))}
            </Table>
          </div>
        )}

        {/* ══ LIVE GROUPS ══════════════════════════════════════════════════════ */}
        {sideTab === "live-groups" && isAdmin && (
          <div>
            <SectionHeader title="Live Groups" sub="Currently active savings groups" />
            {groups.filter(g => g.isLive).length === 0 ? (
              <div className="glass-card-static rounded-xl p-8 text-center text-muted-foreground text-sm">No groups are currently live.</div>
            ) : groups.filter(g => g.isLive).map(g => (
              <div key={g.id} className="glass-card-static rounded-xl p-5 mb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2"><span className="live-badge">● LIVE</span><h3 className="gold-text font-cinzel font-bold">{g.name}</h3></div>
                    <p className="text-muted-foreground text-xs mt-1">₦{g.contributionAmount.toLocaleString()} per {g.cycleType} · {g.filledSlots}/{g.totalSlots} seats taken</p>
                  </div>
                  <div className="flex gap-2">
                    <Btn variant="red" onClick={() => doGroupAction(g.id, "live")}>Deactivate</Btn>
                    <Btn variant="gold" onClick={() => { const seatNo = parseInt(prompt("Seat # to disburse:") || "0"); if (seatNo) doDisbursement(g.id, seatNo); }}>
                      <Wallet size={12} />Record Disbursement
                    </Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ PAYMENTS ════════════════════════════════════════════════════════ */}
        {sideTab === "payments" && isAdmin && (
          <div>
            <SectionHeader title="Payment Management" sub={`${adminPayments.filter((p: Record<string, unknown>) => p.status === "pending").length} pending payments`}
              actions={<>
                <div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="luxury-input pl-9 text-xs py-2 w-48" /></div>
                <Btn onClick={() => loadData("payments")} variant="glass"><RefreshCw size={12} /></Btn>
              </>} />
            <Table cols={["Code", "User", "Group", "Seat", "Amount", "Date", "Status", "Screenshot", "Actions"]}>
              {filteredPayments.map((p: Record<string, unknown>) => (
                <TR key={p.id as string}>
                  <TD><span className="font-mono text-gold text-[10px]">{p.code as string}</span></TD>
                  <TD>
                    <p className="text-foreground font-semibold">{p.fullName as string}</p>
                    <p className="text-muted-foreground text-[10px]">@{p.user as string}</p>
                  </TD>
                  <TD><span className="text-muted-foreground">{p.group as string}</span></TD>
                  <TD><span className="text-muted-foreground">{p.seatNo ? `#${p.seatNo}` : "-"}</span></TD>
                  <TD><span className="text-gold font-bold">₦{(p.amount as number).toLocaleString()}</span></TD>
                  <TD><span className="text-muted-foreground">{p.date as string}</span></TD>
                  <TD><StatusBadge status={p.status as string} /></TD>
                  <TD>
                    {p.screenshotUrl ? (
                      <a href={p.screenshotUrl as string} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-[10px]">View</a>
                    ) : <span className="text-muted-foreground text-[10px]">None</span>}
                  </TD>
                  <TD>
                    {p.status === "pending" && (
                      <div className="flex gap-1">
                        <Btn size="xs" variant="green" onClick={() => doPaymentAction(p.id as string, "approved")}><CheckCircle size={10} />Approve</Btn>
                        <Btn size="xs" variant="red" onClick={() => doPaymentAction(p.id as string, "declined")}><X size={10} />Decline</Btn>
                      </div>
                    )}
                  </TD>
                </TR>
              ))}
            </Table>
          </div>
        )}

        {/* ══ ANNOUNCEMENTS ════════════════════════════════════════════════════ */}
        {sideTab === "announcements" && (
          <div>
            <SectionHeader title="Announcements" sub={`${announcements.filter(a => a.type !== "group-message").length} posted`}
              actions={<Btn onClick={() => setShowAnnouncement(true)} variant="gold"><Plus size={12} />New Announcement</Btn>} />
            <div className="space-y-3">
              {announcements.filter(a => a.type !== "group-message").map(a => (
                <div key={a.id} className="glass-card-static rounded-xl p-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-foreground font-bold text-sm">{a.title}</span>
                      <StatusBadge status={a.type} />
                    </div>
                    <p className="text-muted-foreground text-xs">{a.body}</p>
                    <p className="text-muted-foreground/50 text-[10px] mt-1">by @{a.adminName} · {new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                  {isAdmin && <Btn size="xs" variant="red" onClick={() => deleteAnnouncement(a.id)}><Trash2 size={10} /></Btn>}
                </div>
              ))}
              {announcements.filter(a => a.type !== "group-message").length === 0 && (
                <div className="glass-card-static rounded-xl p-8 text-center text-muted-foreground text-sm">No announcements yet.</div>
              )}
            </div>
          </div>
        )}

        {/* ══ GROUP MESSAGES ═══════════════════════════════════════════════════ */}
        {sideTab === "group-messages" && (
          <div>
            <SectionHeader title="Group Messages" sub="Direct messages to specific groups"
              actions={<Btn onClick={() => setShowGroupMsg(true)} variant="gold"><Plus size={12} />New Message</Btn>} />
            <div className="space-y-3">
              {announcements.filter(a => a.type === "group-message").map(a => (
                <div key={a.id} className="glass-card-static rounded-xl p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-foreground font-bold text-sm">{a.title}</p>
                    <p className="text-muted-foreground text-xs mt-1">{a.body}</p>
                    <p className="text-muted-foreground/50 text-[10px] mt-1">by @{a.adminName} · {new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                  {isAdmin && <Btn size="xs" variant="red" onClick={() => deleteAnnouncement(a.id)}><Trash2 size={10} /></Btn>}
                </div>
              ))}
              {announcements.filter(a => a.type === "group-message").length === 0 && (
                <div className="glass-card-static rounded-xl p-8 text-center text-muted-foreground text-sm">No group messages yet.</div>
              )}
            </div>
          </div>
        )}

        {/* ══ SUPPORT TICKETS ══════════════════════════════════════════════════ */}
        {sideTab === "support" && (
          <div>
            <SectionHeader title="Support Tickets" sub={`${supportTickets.filter(t => t.status === "open").length} open tickets`}
              actions={<Btn onClick={() => refreshSupportTickets()} variant="glass"><RefreshCw size={12} /></Btn>} />
            <Table cols={["User", "Subject", "Message", "Status", "Actions"]}>
              {supportTickets.map(t => (
                <TR key={t.id}>
                  <TD><p className="text-foreground font-semibold">@{t.username}</p></TD>
                  <TD><p className="text-foreground font-semibold">{t.subject}</p></TD>
                  <TD>
                    <p className="text-muted-foreground max-w-xs truncate">{t.message}</p>
                    {t.attachmentUrl && (
                      <a href={t.attachmentUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block">
                        <img src={t.attachmentUrl} alt="attachment" className="max-h-24 max-w-[160px] rounded-lg border border-white/10 object-cover hover:scale-105 transition-transform cursor-zoom-in" />
                      </a>
                    )}
                    {t.adminReply && <p className="text-emerald-400 text-[10px] mt-1 italic">Reply: {t.adminReply}</p>}
                  </TD>
                  <TD><StatusBadge status={t.status} /></TD>
                  <TD>
                    <div className="flex gap-1 flex-wrap">
                      <Btn size="xs" variant="gold" onClick={() => { setShowSupportReply(t.id); setSupportReplyText(""); }}><Reply size={10} />Reply</Btn>
                      {t.status !== "closed" && <Btn size="xs" variant="glass" onClick={() => closeTicket(t.id)}>Close</Btn>}
                    </div>
                  </TD>
                </TR>
              ))}
            </Table>
          </div>
        )}

        {/* ══ CONTACT INFO ═════════════════════════════════════════════════════ */}
        {sideTab === "contact-info" && isAdmin && (
          <div>
            <SectionHeader title="Contact Information" sub="Platform contact details shown to users" />
            <div className="glass-card-static rounded-2xl p-6 max-w-lg space-y-4">
              {[
                { label: "WhatsApp Number", key: "whatsapp", icon: Phone },
                { label: "Facebook Link", key: "facebook", icon: Facebook },
                { label: "Email Address", key: "email", icon: Mail },
                { label: "Call Number", key: "callNumber", icon: Phone },
                { label: "SMS Number", key: "smsNumber", icon: MessageSquare },
              ].map(({ label, key, icon: Icon }) => (
                <div key={key}>
                  <label className="luxury-label flex items-center gap-2"><Icon size={12} />{label}</label>
                  <input
                    value={(editContact as Record<string, string>)[key] || ""}
                    onChange={e => setEditContact(prev => ({ ...prev, [key]: e.target.value }))}
                    className="luxury-input" placeholder={`Enter ${label.toLowerCase()}`} />
                </div>
              ))}
              <button onClick={saveContactInfo} className="btn-gold px-6 py-2.5 rounded-xl font-bold text-sm">Save Contact Info</button>
            </div>
          </div>
        )}

        {/* ══ DEFAULTERS ══════════════════════════════════════════════════════ */}
        {sideTab === "defaulters" && isAdmin && (
          <div>
            <SectionHeader title="Defaulters" sub={`${defaulters.length} active defaulters`}
              actions={<>
                <select value={defaulterGroupId} onChange={e => setDefaulterGroupId(e.target.value)} className="luxury-input text-xs py-2 w-48">
                  <option value="">Select group...</option>
                  {groups.filter(g => g.isLive).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <Btn variant="amber" onClick={checkDefaulters}><AlertTriangle size={12} />Run Check</Btn>
                <Btn onClick={() => loadData("defaulters")} variant="glass"><RefreshCw size={12} /></Btn>
              </>} />
            <Table cols={["User", "Group", "Seat", "Since", "Count", "Amount", "Actions"]}>
              {defaulters.map((d: Record<string, unknown>) => (
                <TR key={d.id as string}>
                  <TD><span className="text-red-400 font-semibold">@{d.user as string}</span></TD>
                  <TD><span className="text-muted-foreground">{d.group as string}</span></TD>
                  <TD><span className="text-muted-foreground">{d.seatNo ? `#${d.seatNo}` : "-"}</span></TD>
                  <TD><span className="text-muted-foreground">{d.since as string}</span></TD>
                  <TD><span className="text-red-400 font-bold">{d.count as number}×</span></TD>
                  <TD><span className="text-foreground">{d.amount as string}</span></TD>
                  <TD>
                    <Btn size="xs" variant="green" onClick={() => removeDefaulter(d.id as string)}><UserCheck size={10} />Resolve</Btn>
                  </TD>
                </TR>
              ))}
              {defaulters.length === 0 && <TR><TD className="text-center text-muted-foreground py-6 col-span-7">No defaulters found.</TD></TR>}
            </Table>
          </div>
        )}

        {/* ══ EXIT REQUESTS ═══════════════════════════════════════════════════ */}
        {sideTab === "exit-requests" && isAdmin && (
          <div>
            <SectionHeader title="Exit Requests" sub={`${exitRequests.length} total requests`}
              actions={<Btn onClick={() => loadData("exit-requests")} variant="glass"><RefreshCw size={12} /></Btn>} />
            <Table cols={["User", "Group", "Reason", "Status", "Date", "Actions"]}>
              {exitRequests.map((e: Record<string, unknown>) => (
                <TR key={e.id as string}>
                  <TD><span className="text-foreground font-semibold">@{e.user as string}</span></TD>
                  <TD><span className="text-muted-foreground">{e.group as string}</span></TD>
                  <TD><span className="text-muted-foreground max-w-xs truncate block">{e.reason as string}</span></TD>
                  <TD><StatusBadge status={(e.status as string) || "open"} /></TD>
                  <TD><span className="text-muted-foreground">{new Date(e.date as string).toLocaleDateString()}</span></TD>
                  <TD>
                    {!e.status || e.status === "pending" ? (
                      <div className="flex gap-1">
                        <Btn size="xs" variant="green" onClick={() => doExitRequest(e.id as string, "approved")}><CheckCircle size={10} />Approve</Btn>
                        <Btn size="xs" variant="red" onClick={() => doExitRequest(e.id as string, "rejected")}><X size={10} />Reject</Btn>
                      </div>
                    ) : <StatusBadge status={e.status as string} />}
                  </TD>
                </TR>
              ))}
              {exitRequests.length === 0 && <TR><TD className="text-center text-muted-foreground py-6">No exit requests.</TD></TR>}
            </Table>
          </div>
        )}

        {/* ══ SEAT CHANGES ═════════════════════════════════════════════════════ */}
        {sideTab === "seat-changes" && isAdmin && (
          <div>
            <SectionHeader title="Seat Change Requests"
              actions={<Btn onClick={() => loadData("seat-changes")} variant="glass"><RefreshCw size={12} /></Btn>} />
            <Table cols={["User", "Group", "From", "To", "Reason", "Status", "Actions"]}>
              {seatChanges.map((s: Record<string, unknown>) => (
                <TR key={s.id as string}>
                  <TD><span className="text-foreground font-semibold">@{s.user as string}</span></TD>
                  <TD><span className="text-muted-foreground">{s.group as string}</span></TD>
                  <TD><span className="text-amber-400 font-bold">#{s.from as number}</span></TD>
                  <TD><span className="text-emerald-400 font-bold">#{s.to as number}</span></TD>
                  <TD><span className="text-muted-foreground">{s.reason as string}</span></TD>
                  <TD><StatusBadge status={(s.status as string) || "pending"} /></TD>
                  <TD>
                    {(!s.status || s.status === "pending") && (
                      <div className="flex gap-1">
                        <Btn size="xs" variant="green" onClick={() => doSeatChange(s.id as string, "approved")}><CheckCircle size={10} />Approve</Btn>
                        <Btn size="xs" variant="red" onClick={() => doSeatChange(s.id as string, "rejected")}><X size={10} />Reject</Btn>
                      </div>
                    )}
                  </TD>
                </TR>
              ))}
              {seatChanges.length === 0 && <TR><TD className="text-center text-muted-foreground py-6">No seat change requests.</TD></TR>}
            </Table>
          </div>
        )}

        {/* ══ SEAT REMOVALS ════════════════════════════════════════════════════ */}
        {sideTab === "seat-removals" && isAdmin && (
          <div>
            <SectionHeader title="Seat Removal Requests" sub="Users requesting removal of a specific seat"
              actions={<Btn onClick={() => loadData("seat-removals")} variant="glass"><RefreshCw size={12} /></Btn>} />
            <Table cols={["User", "Group", "Seat", "Reason", "Status", "Date", "Actions"]}>
              {seatRemovals.map((r: Record<string, unknown>) => (
                <TR key={r.id as string}>
                  <TD><span className="text-foreground font-semibold">@{r.username as string}</span></TD>
                  <TD><span className="text-muted-foreground">{r.groupName as string}</span></TD>
                  <TD><span className="text-amber-400 font-bold">#{r.seatNo as number}</span></TD>
                  <TD><span className="text-muted-foreground max-w-xs truncate block">{r.reason as string}</span></TD>
                  <TD><StatusBadge status={(r.status as string) || "pending"} /></TD>
                  <TD><span className="text-muted-foreground">{new Date(r.createdAt as string).toLocaleDateString()}</span></TD>
                  <TD>
                    {(!r.status || r.status === "pending") && (
                      <div className="flex gap-1">
                        <Btn size="xs" variant="green" onClick={() => doSeatRemoval(r.id as string, "approved")}><CheckCircle size={10} />Approve</Btn>
                        <Btn size="xs" variant="red" onClick={() => doSeatRemoval(r.id as string, "rejected")}><X size={10} />Reject</Btn>
                      </div>
                    )}
                  </TD>
                </TR>
              ))}
              {seatRemovals.length === 0 && <TR><TD className="text-center text-muted-foreground py-6">No seat removal requests.</TD></TR>}
            </Table>
          </div>
        )}

        {/* ══ AUDIT LOGS ══════════════════════════════════════════════════════ */}
        {sideTab === "audit" && isAdmin && (
          <div>
            <SectionHeader title="Audit Logs" sub="All admin actions"
              actions={<Btn onClick={() => loadData("audit")} variant="glass"><RefreshCw size={12} /></Btn>} />
            <Table cols={["Action", "Admin", "Type", "Time"]}>
              {auditLogs.map((a: Record<string, unknown>) => (
                <TR key={a.id as string}>
                  <TD><span className="text-foreground">{a.action as string}</span></TD>
                  <TD><span className="text-gold font-semibold">@{a.admin as string}</span></TD>
                  <TD><StatusBadge status={a.type as string} /></TD>
                  <TD><span className="text-muted-foreground">{new Date(a.time as string).toLocaleString()}</span></TD>
                </TR>
              ))}
              {auditLogs.length === 0 && <TR><TD className="text-center text-muted-foreground py-6">No logs yet.</TD></TR>}
            </Table>
          </div>
        )}

        {/* ══ VIP TAGS ════════════════════════════════════════════════════════ */}
        {sideTab === "tags" && isAdmin && (
          <div>
            <SectionHeader title="VIP Tag Management" sub="Manage VIP status for users" />
            <div className="glass-card-static rounded-xl p-5 mb-4">
              <p className="text-muted-foreground text-xs mb-4">Toggle VIP status for any user from the Users tab, or use the quick action below.</p>
              <div className="flex gap-2">
                <input id="vip-username" className="luxury-input flex-1 text-xs" placeholder="Enter username to toggle VIP..." />
                <Btn variant="gold" onClick={async () => {
                  const input = document.getElementById("vip-username") as HTMLInputElement;
                  const username = input?.value?.trim();
                  if (!username) return;
                  const user = adminUsers.find((u: Record<string, unknown>) => u.username === username);
                  if (!user) return alert("User not found");
                  await doUserAction(user.id as string, "vip");
                  input.value = "";
                }}>
                  <Crown size={12} />Toggle VIP
                </Btn>
              </div>
            </div>
            <Table cols={["User", "VIP Status", "Actions"]}>
              {adminUsers.filter((u: Record<string, unknown>) => u.isVip).map((u: Record<string, unknown>) => (
                <TR key={u.id as string}>
                  <TD>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-gold text-[10px] font-black">{(u.fullName as string)?.[0]}</div>
                      <div><p className="text-foreground font-semibold">{u.fullName as string}</p><p className="text-muted-foreground text-[10px]">@{u.username as string}</p></div>
                    </div>
                  </TD>
                  <TD><span className="vip-badge">VIP ✦</span></TD>
                  <TD><Btn size="xs" variant="red" onClick={() => doUserAction(u.id as string, "vip")}><Star size={10} />Remove VIP</Btn></TD>
                </TR>
              ))}
            </Table>
          </div>
        )}
      </main>

      {/* ══ MODALS ══════════════════════════════════════════════════════════════ */}

      {showReminderModal && (
        <Modal title="Send Reminder / Notification" onClose={() => setShowReminderModal(false)}>
          <div className="space-y-4">
            <div><label className="luxury-label">Target (username, email, or "all")</label><input value={reminderTarget} onChange={e => setReminderTarget(e.target.value)} placeholder="all" className="luxury-input" /></div>
            <div><label className="luxury-label">Message</label><textarea value={reminderMsg} onChange={e => setReminderMsg(e.target.value)} placeholder="Enter notification message..." className="luxury-input resize-none h-24" /></div>
            <div className="flex gap-3"><Btn variant="glass" onClick={() => setShowReminderModal(false)}>Cancel</Btn><Btn variant="gold" onClick={sendReminder}><Send size={12} />Send</Btn></div>
          </div>
        </Modal>
      )}

      {showCreateGroup && (
        <Modal title="Create New Savings Group" onClose={() => setShowCreateGroup(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="luxury-label">Group Name</label><input value={gName} onChange={e => setGName(e.target.value)} className="luxury-input" /></div>
              <div className="col-span-2"><label className="luxury-label">Description</label><textarea value={gDesc} onChange={e => setGDesc(e.target.value)} className="luxury-input resize-none h-16" /></div>
              <div><label className="luxury-label">Contribution Amount (₦)</label><input type="number" value={gAmt} onChange={e => setGAmt(e.target.value)} className="luxury-input" /></div>
              <div><label className="luxury-label">Cycle</label><select value={gCycle} onChange={e => setGCycle(e.target.value)} className="luxury-input"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
              <div><label className="luxury-label">Total Slots</label><input type="number" value={gSlots} onChange={e => setGSlots(e.target.value)} className="luxury-input" /></div>
              <div><label className="luxury-label">Bank Name</label><input value={gBank} onChange={e => setGBank(e.target.value)} className="luxury-input" /></div>
              <div><label className="luxury-label">Account Number</label><input value={gAccNum} onChange={e => setGAccNum(e.target.value)} className="luxury-input" /></div>
              <div><label className="luxury-label">Account Name</label><input value={gAccName} onChange={e => setGAccName(e.target.value)} className="luxury-input" /></div>
              <div className="col-span-2"><label className="luxury-label">Terms & Conditions</label><textarea value={gTerms} onChange={e => setGTerms(e.target.value)} className="luxury-input resize-none h-20" /></div>
            </div>
            <div className="flex gap-3"><Btn variant="glass" onClick={() => setShowCreateGroup(false)}>Cancel</Btn><Btn variant="gold" onClick={createGroup}><Plus size={12} />Create Group</Btn></div>
          </div>
        </Modal>
      )}

      {showAnnouncement && (
        <Modal title="Post Announcement" onClose={() => setShowAnnouncement(false)}>
          <div className="space-y-4">
            <div><label className="luxury-label">Title</label><input value={annTitle} onChange={e => setAnnTitle(e.target.value)} className="luxury-input" /></div>
            <div><label className="luxury-label">Body</label><textarea value={annBody} onChange={e => setAnnBody(e.target.value)} className="luxury-input resize-none h-24" /></div>
            <div><label className="luxury-label">Type</label>
              <select value={annType} onChange={e => setAnnType(e.target.value as Announcement["type"])} className="luxury-input">
                <option value="announcement">Announcement</option>
                <option value="promotion">Promotion</option>
                <option value="server-update">Server Update</option>
              </select>
            </div>
            <div>
              <label className="luxury-label">Media (Optional)</label>
              <div className="flex gap-2 mb-2">
                {(["none", "image", "video"] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => { setAnnMediaType(t); setAnnMediaFile(null); if (annMediaRef.current) annMediaRef.current.value = ""; }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${annMediaType === t ? "bg-gold/20 border-gold/50 text-gold" : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"}`}>
                    {t === "none" && <X size={10} />}
                    {t === "image" && <Image size={10} />}
                    {t === "video" && <Video size={10} />}
                    {t === "none" ? "No Media" : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              {annMediaType !== "none" && (
                <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gold/30 bg-gold/5 cursor-pointer hover:border-gold/50 transition-all">
                  <div className="text-gold">{annMediaType === "image" ? <Image size={16} /> : <Video size={16} />}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground font-semibold truncate">{annMediaFile ? annMediaFile.name : `Click to upload ${annMediaType}`}</p>
                    <p className="text-[10px] text-muted-foreground">Optional — max 10MB</p>
                  </div>
                  <input ref={annMediaRef} type="file" accept={annMediaType === "image" ? "image/*" : "video/*"} className="hidden"
                    onChange={e => setAnnMediaFile(e.target.files?.[0] || null)} />
                </label>
              )}
            </div>
            <div className="flex gap-3"><Btn variant="glass" onClick={() => { setShowAnnouncement(false); setAnnMediaType("none"); setAnnMediaFile(null); }}>Cancel</Btn><Btn variant="gold" onClick={submitAnnouncement}><Send size={12} />Publish</Btn></div>
          </div>
        </Modal>
      )}

      {/* ── Group Members Modal ────────────────────────────────── */}
      {showGroupMembers && (
        <Modal title="Group Member Management" onClose={() => setShowGroupMembers(null)}>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {groupMembersList.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No members yet.</p>
            ) : groupMembersList.map((m: Record<string, unknown>) => (
              <div key={`${m.seatNo}-${m.userId}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-black">#{m.seatNo as number}</div>
                <div className="flex-1 min-w-0">
                  {m.userId ? (
                    <>
                      <p className="text-foreground text-xs font-semibold">@{m.username as string} {m.isVip && <span className="vip-badge text-[7px]">VIP</span>}</p>
                      <p className="text-muted-foreground text-[10px]">{m.fullName as string} · Trust: {m.trustScore as number}%</p>
                      <p className="text-muted-foreground text-[10px]">Status: <StatusBadge status={m.status as string || "active"} /></p>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-xs italic">Empty seat</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {m.userId && (
                    <Btn size="xs" variant="red" onClick={() => kickFromGroup(showGroupMembers, m.userId as string)}>
                      <UserX size={9} />Kick
                    </Btn>
                  )}
                  <Btn size="xs" variant="amber" onClick={() => removeSeatAdmin(showGroupMembers, m.seatNo as number)}>
                    <MinusCircle size={9} />Clear
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ── Group Edit Modal ────────────────────────────────────── */}
      {showGroupEdit && (
        <Modal title="Edit Group" onClose={() => setShowGroupEdit(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="luxury-label">Group Name</label>
                <input value={editGroupData.name || ""} onChange={e => setEditGroupData(p => ({ ...p, name: e.target.value }))} className="luxury-input" /></div>
              <div className="col-span-2"><label className="luxury-label">Description</label>
                <textarea value={editGroupData.description || ""} onChange={e => setEditGroupData(p => ({ ...p, description: e.target.value }))} className="luxury-input resize-none h-14" /></div>
              <div><label className="luxury-label">Contribution (₦)</label>
                <input type="number" value={editGroupData.contributionAmount || ""} onChange={e => setEditGroupData(p => ({ ...p, contributionAmount: e.target.value }))} className="luxury-input" /></div>
              <div><label className="luxury-label">Cycle</label>
                <select value={editGroupData.cycleType || "monthly"} onChange={e => setEditGroupData(p => ({ ...p, cycleType: e.target.value }))} className="luxury-input">
                  <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                </select></div>
              <div><label className="luxury-label">Bank Name</label>
                <input value={editGroupData.bankName || ""} onChange={e => setEditGroupData(p => ({ ...p, bankName: e.target.value }))} className="luxury-input" /></div>
              <div><label className="luxury-label">Account Number</label>
                <input value={editGroupData.accountNumber || ""} onChange={e => setEditGroupData(p => ({ ...p, accountNumber: e.target.value }))} className="luxury-input" /></div>
              <div className="col-span-2"><label className="luxury-label">Account Name</label>
                <input value={editGroupData.accountName || ""} onChange={e => setEditGroupData(p => ({ ...p, accountName: e.target.value }))} className="luxury-input" /></div>
            </div>
            <div className="flex gap-3">
              <Btn variant="glass" onClick={() => setShowGroupEdit(null)}>Cancel</Btn>
              <Btn variant="gold" onClick={saveGroupEdit}><CheckCircle size={12} />Save Changes</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showTrustScore && (
        <Modal title="Set Trust Score" onClose={() => setShowTrustScore(null)}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Set trust score for this user (0 = low trust, 100 = fully trusted).</p>
            <div>
              <label className="luxury-label">Trust Score (0–100)</label>
              <input type="number" min="0" max="100" value={trustScoreValue}
                onChange={e => setTrustScoreValue(e.target.value)} className="luxury-input" />
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-green-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, Number(trustScoreValue)))}%` }} />
                </div>
                <span className="text-xs font-bold text-gold w-8">{trustScoreValue}%</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Btn variant="glass" onClick={() => setShowTrustScore(null)}>Cancel</Btn>
              <Btn variant="gold" onClick={() => saveTrustScore(showTrustScore)}><Star size={12} />Save</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showGroupMsg && (
        <Modal title="Send Group Message" onClose={() => setShowGroupMsg(false)}>
          <div className="space-y-4">
            <div><label className="luxury-label">Target Group</label>
              <select value={groupMsgTarget} onChange={e => setGroupMsgTarget(e.target.value)} className="luxury-input">
                <option value="">Select group...</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div><label className="luxury-label">Message</label><textarea value={groupMsgBody} onChange={e => setGroupMsgBody(e.target.value)} className="luxury-input resize-none h-24" /></div>
            <div className="flex gap-3"><Btn variant="glass" onClick={() => setShowGroupMsg(false)}>Cancel</Btn><Btn variant="gold" onClick={submitGroupMessage}><Send size={12} />Send</Btn></div>
          </div>
        </Modal>
      )}

      {showSupportReply && replyTicket && (
        <Modal title={`Reply: ${replyTicket.subject}`} onClose={() => setShowSupportReply(null)}>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-muted-foreground"><p className="font-semibold text-foreground mb-1">@{replyTicket.username} says:</p>{replyTicket.message}</div>
            {replyTicket.adminReply && <div className="p-3 rounded-lg bg-emerald-900/15 border border-emerald-600/20 text-xs text-emerald-400"><p className="font-semibold mb-1">Previous reply:</p>{replyTicket.adminReply}</div>}
            <div><label className="luxury-label">Your Reply</label><textarea value={supportReplyText} onChange={e => setSupportReplyText(e.target.value)} className="luxury-input resize-none h-24" /></div>
            <div className="flex gap-3"><Btn variant="glass" onClick={() => setShowSupportReply(null)}>Cancel</Btn><Btn variant="gold" onClick={() => submitSupportReply(replyTicket.id)}><Reply size={12} />Send Reply</Btn></div>
          </div>
        </Modal>
      )}

      {showUserEdit && editUser && (
        <Modal title={`Edit User: @${editUser.username}`} onClose={() => setShowUserEdit(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="luxury-label">Full Name</label><input value={editedUser.fullName ?? editUser.fullName as string} onChange={e => setEditedUser(p => ({ ...p, fullName: e.target.value }))} className="luxury-input" /></div>
              <div><label className="luxury-label">Email</label><input value={editedUser.email ?? editUser.email as string} onChange={e => setEditedUser(p => ({ ...p, email: e.target.value }))} className="luxury-input" /></div>
              <div><label className="luxury-label">Phone</label><input value={editedUser.phone ?? editUser.phone as string} onChange={e => setEditedUser(p => ({ ...p, phone: e.target.value }))} className="luxury-input" /></div>
              <div><label className="luxury-label">State</label><input value={editedUser.state ?? editUser.state as string} onChange={e => setEditedUser(p => ({ ...p, state: e.target.value }))} className="luxury-input" /></div>
              <div><label className="luxury-label">LGA</label><input value={editedUser.lga ?? editUser.lga as string} onChange={e => setEditedUser(p => ({ ...p, lga: e.target.value }))} className="luxury-input" /></div>
              <div><label className="luxury-label">DOB</label><input value={editedUser.dob ?? editUser.dob as string} onChange={e => setEditedUser(p => ({ ...p, dob: e.target.value }))} className="luxury-input" /></div>
              <div className="col-span-2"><label className="luxury-label">Address</label><input value={editedUser.address ?? editUser.address as string} onChange={e => setEditedUser(p => ({ ...p, address: e.target.value }))} className="luxury-input" /></div>
            </div>
            {editUser.bankAccName && (
              <div className="p-3 rounded-lg bg-gold/5 border border-gold/15 text-xs">
                <p className="text-gold font-bold mb-1">Bank Details</p>
                <p className="text-foreground">{editUser.bankAccName as string} — {editUser.bankAccNum as string}</p>
                <p className="text-muted-foreground">{editUser.bankName as string}</p>
              </div>
            )}
            <div className="flex gap-3"><Btn variant="glass" onClick={() => setShowUserEdit(null)}>Cancel</Btn><Btn variant="gold" onClick={() => saveUserEdit(editUser.id as string)}>Save Changes</Btn></div>
          </div>
        </Modal>
      )}

      {showPasswordReset && (
        <Modal title="Reset User Password" onClose={() => setShowPasswordReset(null)}>
          <div className="space-y-4">
            <div><label className="luxury-label">New Password</label>
              <div className="relative">
                <input type={showPasswords["reset"] ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="luxury-input pr-10" />
                <button type="button" onClick={() => setShowPasswords(p => ({ ...p, reset: !p["reset"] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPasswords["reset"] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="flex gap-3"><Btn variant="glass" onClick={() => setShowPasswordReset(null)}>Cancel</Btn><Btn variant="gold" onClick={() => resetPassword(showPasswordReset)}><Key size={12} />Reset Password</Btn></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
