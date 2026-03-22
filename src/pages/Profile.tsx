import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Navigate } from "react-router-dom";
import { Camera, Lock, Mail, User, Shield, CreditCard, Calendar } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import { api } from "@/lib/api";

type Tab = "info" | "password" | "email" | "bank" | "dob";

export default function Profile() {
  const { currentUser, isLoggedIn, setCurrentUser } = useApp();
  const [tab, setTab] = useState<Tab>("info");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState(currentUser?.firstName ?? "");
  const [lastName, setLastName]   = useState(currentUser?.lastName ?? "");
  const [phone, setPhone]         = useState(currentUser?.phone ?? "");
  const [nickname, setNickname]   = useState(currentUser?.nickname ?? "");
  const [stateOf, setStateOf]     = useState(currentUser?.stateOfOrigin ?? "");
  const [lga, setLga]             = useState(currentUser?.lga ?? "");
  const [curState, setCurState]   = useState(currentUser?.currentState ?? "");
  const [curAddr, setCurAddr]     = useState(currentUser?.currentAddress ?? "");
  const [homeAddr, setHomeAddr]   = useState(currentUser?.homeAddress ?? "");
  const [dob, setDob]             = useState(currentUser?.dob ?? "");

  const [curPw, setCurPw]   = useState("");
  const [newPw, setNewPw]   = useState("");
  const [confPw, setConfPw] = useState("");

  const [newEmail, setNewEmail]   = useState("");
  const [emailPw, setEmailPw]     = useState("");

  const [bankAccName, setBankAccName] = useState(currentUser?.bankDetails?.accountName ?? "");
  const [bankAccNum, setBankAccNum]   = useState(currentUser?.bankDetails?.accountNumber ?? "");
  const [bankName, setBankName]       = useState(currentUser?.bankDetails?.bankName ?? "");

  if (!isLoggedIn || !currentUser) return <Navigate to="/login" replace />;

  const success = () => { setSaved(true); setSaving(false); setTimeout(() => setSaved(false), 2500); };
  const fail = (msg: string) => { setError(msg); setSaving(false); };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      if (tab === "info") {
        await api.patch("/api/users/profile", {
          firstName, lastName, phone, nickname, stateOfOrigin: stateOf,
          lga, currentState: curState, currentAddress: curAddr, homeAddress: homeAddr, dob,
        });
        setCurrentUser({ ...currentUser, firstName, lastName, phone, nickname, stateOfOrigin: stateOf, lga, currentState: curState, currentAddress: curAddr, homeAddress: homeAddr });
      } else if (tab === "dob") {
        await api.patch("/api/users/profile", { firstName: currentUser.firstName, lastName: currentUser.lastName, dob });
      } else if (tab === "password") {
        if (newPw !== confPw) return fail("Passwords do not match");
        if (newPw.length < 8) return fail("Password must be at least 8 characters");
        await api.patch("/api/users/password", { currentPassword: curPw, newPassword: newPw });
        setCurPw(""); setNewPw(""); setConfPw("");
      } else if (tab === "email") {
        await api.patch("/api/users/email", { newEmail, password: emailPw });
        setCurrentUser({ ...currentUser, email: newEmail });
        setNewEmail(""); setEmailPw("");
      } else if (tab === "bank") {
        await api.patch("/api/users/bank", { accountName: bankAccName, accountNumber: bankAccNum, bankName });
        setCurrentUser({ ...currentUser, bankDetails: { accountName: bankAccName, accountNumber: bankAccNum, bankName } });
      }
      success();
    } catch (err: unknown) {
      fail((err as Error).message || "Failed to save changes");
    }
  };

  const tabs: { id: Tab; icon: typeof User; label: string }[] = [
    { id: "info",     icon: User,       label: "Information" },
    { id: "dob",      icon: Calendar,   label: "Date of Birth" },
    { id: "password", icon: Lock,       label: "Password" },
    { id: "email",    icon: Mail,       label: "Email" },
    { id: "bank",     icon: CreditCard, label: "Bank Details" },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 relative">
      <ParticleBackground />
      <div className="max-w-3xl mx-auto relative">

        <div className="text-center mb-8 animate-fade-up">
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2">Account</p>
          <h1 className="gold-gradient-text text-3xl font-cinzel font-bold">My Profile</h1>
        </div>

        <div className="glass-card-static rounded-2xl p-6 mb-6 animate-fade-up delay-100">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gold-gradient flex items-center justify-center text-obsidian text-2xl font-cinzel font-black animate-glow-pulse">
                {currentUser.firstName[0]}{currentUser.lastName[0]}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                <Camera size={11} className="text-obsidian" />
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-foreground font-bold text-xl">{currentUser.firstName} {currentUser.lastName}</h2>
                {currentUser.isVip && <span className="vip-badge">VIP ✦</span>}
                {currentUser.role === "admin" && (
                  <span className="px-2 py-0.5 rounded-full bg-red-900/30 border border-red-600/30 text-red-400 text-xs font-bold">ADMIN</span>
                )}
              </div>
              <p className="text-muted-foreground text-sm">@{currentUser.username}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{currentUser.email}</p>
              {currentUser.nickname && (
                <p className="text-muted-foreground text-xs mt-0.5 italic">"{currentUser.nickname}"</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs uppercase tracking-widest">Total Paid</p>
              <p className="gold-gradient-text text-xl font-cinzel font-bold">₦{currentUser.totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 mb-6 animate-fade-up delay-200 flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setError(""); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${tab === t.id ? "btn-gold" : "btn-glass"}`}>
              <t.icon size={12} /><span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="glass-card-static rounded-2xl p-6 animate-fade-up delay-300">
          {error && (
            <div className="mb-4 py-2 px-3 rounded-lg bg-red-900/20 border border-red-600/30 text-red-400 text-xs">{error}</div>
          )}

          {tab === "info" && (
            <div className="space-y-4">
              <h3 className="gold-text font-cinzel font-bold text-sm uppercase tracking-widest mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="luxury-label">First Name</label><input value={firstName} onChange={e => setFirstName(e.target.value)} className="luxury-input" /></div>
                <div><label className="luxury-label">Last Name</label><input value={lastName} onChange={e => setLastName(e.target.value)} className="luxury-input" /></div>
                <div><label className="luxury-label">Username</label><input value={currentUser.username} className="luxury-input opacity-60" disabled /></div>
                <div><label className="luxury-label">Nickname</label><input value={nickname} onChange={e => setNickname(e.target.value)} className="luxury-input" placeholder="Optional display name" /></div>
                <div><label className="luxury-label">Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} className="luxury-input" /></div>
                <div><label className="luxury-label">State of Origin</label><input value={stateOf} onChange={e => setStateOf(e.target.value)} className="luxury-input" /></div>
                <div><label className="luxury-label">LGA</label><input value={lga} onChange={e => setLga(e.target.value)} className="luxury-input" /></div>
                <div><label className="luxury-label">Current State</label><input value={curState} onChange={e => setCurState(e.target.value)} className="luxury-input" /></div>
                <div className="sm:col-span-2"><label className="luxury-label">Current Address</label><input value={curAddr} onChange={e => setCurAddr(e.target.value)} className="luxury-input" /></div>
                <div className="sm:col-span-2"><label className="luxury-label">Full Home Address</label><input value={homeAddr} onChange={e => setHomeAddr(e.target.value)} className="luxury-input" /></div>
              </div>
              <div className="p-3 rounded-lg bg-gold/5 border border-gold/15 text-xs text-muted-foreground flex items-start gap-2">
                <Shield size={14} className="text-gold shrink-0 mt-0.5" />Your profile is private. Other users cannot view your information.
              </div>
              <button onClick={handleSave} disabled={saving} className="btn-gold px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60">
                {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Changes"}
              </button>
            </div>
          )}

          {tab === "dob" && (
            <div className="space-y-4">
              <h3 className="gold-text font-cinzel font-bold text-sm uppercase tracking-widest mb-4">Date of Birth</h3>
              <div className="max-w-xs">
                <label className="luxury-label">Date of Birth</label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="luxury-input" />
                <p className="text-muted-foreground text-xs mt-2">Your DOB is private and visible only to you and admins.</p>
              </div>
              <div className="p-3 rounded-lg bg-gold/5 border border-gold/15 text-xs text-muted-foreground flex items-start gap-2">
                <Calendar size={14} className="text-gold shrink-0 mt-0.5" />Date of birth is required for identity verification purposes.
              </div>
              <button onClick={handleSave} disabled={saving} className="btn-gold px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60">
                {saving ? "Saving..." : saved ? "✓ Updated!" : "Update Date of Birth"}
              </button>
            </div>
          )}

          {tab === "password" && (
            <div className="space-y-4">
              <h3 className="gold-text font-cinzel font-bold text-sm uppercase tracking-widest mb-4">Change Password</h3>
              <div><label className="luxury-label">Current Password</label><input type="password" value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="Enter current password" className="luxury-input" /></div>
              <div><label className="luxury-label">New Password</label><input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Enter new password (min 8 chars)" className="luxury-input" /></div>
              <div><label className="luxury-label">Confirm New Password</label><input type="password" value={confPw} onChange={e => setConfPw(e.target.value)} placeholder="Repeat new password" className="luxury-input" /></div>
              <button onClick={handleSave} disabled={saving} className="btn-gold px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60">
                {saving ? "Saving..." : saved ? "✓ Updated!" : "Update Password"}
              </button>
            </div>
          )}

          {tab === "email" && (
            <div className="space-y-4">
              <h3 className="gold-text font-cinzel font-bold text-sm uppercase tracking-widest mb-4">Update Email</h3>
              <div><label className="luxury-label">Current Email</label><input type="email" defaultValue={currentUser.email} className="luxury-input opacity-60" disabled /></div>
              <div><label className="luxury-label">New Email Address</label><input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Enter new email" className="luxury-input" /></div>
              <div><label className="luxury-label">Confirm Password</label><input type="password" value={emailPw} onChange={e => setEmailPw(e.target.value)} placeholder="Confirm with your password" className="luxury-input" /></div>
              <button onClick={handleSave} disabled={saving} className="btn-gold px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60">
                {saving ? "Saving..." : saved ? "✓ Updated!" : "Update Email"}
              </button>
            </div>
          )}

          {tab === "bank" && (
            <div className="space-y-4">
              <h3 className="gold-text font-cinzel font-bold text-sm uppercase tracking-widest mb-4">Bank Details</h3>
              <div className="p-3 rounded-lg bg-amber-900/15 border border-amber-600/25 text-xs text-amber-400 flex items-start gap-2 mb-4">
                <CreditCard size={14} className="shrink-0 mt-0.5" />Your bank details are strictly private. Only you and the platform admin can view them.
              </div>
              <div><label className="luxury-label">Account Name</label><input value={bankAccName} onChange={e => setBankAccName(e.target.value)} placeholder="Full name on account" className="luxury-input" /></div>
              <div><label className="luxury-label">Account Number</label><input value={bankAccNum} onChange={e => setBankAccNum(e.target.value)} placeholder="10-digit account number" className="luxury-input" maxLength={10} /></div>
              <div><label className="luxury-label">Bank Name</label><input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Zenith Bank" className="luxury-input" /></div>
              {(bankAccName || bankAccNum) && (
                <div className="p-4 rounded-xl border border-gold/20 bg-gold/5">
                  <p className="text-gold text-xs font-cinzel font-bold mb-2 uppercase tracking-widest">Current Details</p>
                  <p className="text-foreground text-sm font-semibold">{bankAccName}</p>
                  <p className="text-muted-foreground text-sm">{bankAccNum} — {bankName}</p>
                </div>
              )}
              <button onClick={handleSave} disabled={saving} className="btn-gold px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60">
                {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Bank Details"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
