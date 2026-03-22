import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, ChevronRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import ParticleBackground from "@/components/ParticleBackground";

const nigerianStates = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River",
  "Delta","Ebonyi","Edo","Ekiti","Enugu","FCT-Abuja","Gombe","Imo","Jigawa","Kaduna","Kano",
  "Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo",
  "Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"
];

type Step = 1 | 2 | 3;

export default function Register() {
  const [step, setStep] = useState<Step>(1);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setCurrentUser } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "", middleName: "", lastName: "", age: "", dob: "",
    phone: "", stateOfOrigin: "", lga: "", currentState: "", currentAddress: "",
    fullHomeAddress: "", username: "", email: "", password: "", confirmPassword: "", bvnNin: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");
    if (form.password.length < 8) return setError("Password must be at least 8 characters");
    setLoading(true);
    setError("");
    try {
      const data = await api.post("/api/auth/register", {
        username: form.username,
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        phone: form.phone,
        dob: form.dob,
        age: form.age,
        stateOfOrigin: form.stateOfOrigin,
        lga: form.lga,
        currentState: form.currentState,
        currentAddress: form.currentAddress,
        homeAddress: form.fullHomeAddress,
        bvnNin: form.bvnNin,
      });
      setCurrentUser(data.user);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message || "Registration failed. Please try again.");
    }
    setLoading(false);
  };

  const stepLabels = ["Personal Info", "Location Details", "Account Setup"];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-10 relative">
      <ParticleBackground />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_40%_40%,rgba(234,179,8,0.04)_0%,transparent_60%)]" />

      <div className="relative w-full max-w-2xl animate-scale-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center animate-glow-pulse">
              <span className="text-obsidian font-cinzel font-black">RA</span>
            </div>
          </Link>
          <h1 className="gold-gradient-text text-3xl font-cinzel font-bold">Create Account</h1>
          <p className="text-muted-foreground text-sm mt-2">Join the Rejoice Ajo savings community</p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          {stepLabels.map((label, i) => {
            const s = (i + 1) as Step;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${step === s ? "bg-gold text-obsidian" : step > s ? "bg-gold/20 text-gold border border-gold/30" : "bg-muted/30 text-muted-foreground"}`}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold">
                    {step > s ? "✓" : s}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < 2 && <ChevronRight size={12} className="text-muted-foreground" />}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="glass-card-static p-8 rounded-2xl border border-gold/20">

            {step === 1 && (
              <div className="space-y-4 animate-fade-up">
                <h2 className="gold-text font-cinzel font-bold text-sm uppercase tracking-widest mb-6">Personal Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div><label className="luxury-label">First Name *</label><input type="text" value={form.firstName} onChange={set("firstName")} placeholder="Rejoice" className="luxury-input" required /></div>
                  <div><label className="luxury-label">Middle Name</label><input type="text" value={form.middleName} onChange={set("middleName")} placeholder="Grace" className="luxury-input" /></div>
                  <div><label className="luxury-label">Last Name *</label><input type="text" value={form.lastName} onChange={set("lastName")} placeholder="Adeyemi" className="luxury-input" required /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="luxury-label">Age *</label><input type="number" value={form.age} onChange={set("age")} placeholder="25" min="18" className="luxury-input" required /></div>
                  <div><label className="luxury-label">Date of Birth *</label><input type="date" value={form.dob} onChange={set("dob")} className="luxury-input" required /></div>
                </div>
                <div><label className="luxury-label">Phone Number *</label><input type="tel" value={form.phone} onChange={set("phone")} placeholder="+234 801 234 5678" className="luxury-input" required /></div>
                <button type="button" onClick={() => setStep(2)} className="btn-gold w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-4">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-up">
                <h2 className="gold-text font-cinzel font-bold text-sm uppercase tracking-widest mb-6">Location Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="luxury-label">State of Origin *</label>
                    <select value={form.stateOfOrigin} onChange={set("stateOfOrigin")} className="luxury-input" required>
                      <option value="">Select state</option>
                      {nigerianStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label className="luxury-label">LGA *</label><input type="text" value={form.lga} onChange={set("lga")} placeholder="Your LGA" className="luxury-input" required /></div>
                </div>
                <div>
                  <label className="luxury-label">Current State *</label>
                  <select value={form.currentState} onChange={set("currentState")} className="luxury-input" required>
                    <option value="">Select state</option>
                    {nigerianStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="luxury-label">Current Address *</label><input type="text" value={form.currentAddress} onChange={set("currentAddress")} placeholder="No. 5 Musa Street, Lagos" className="luxury-input" required /></div>
                <div><label className="luxury-label">Full Home Address *</label><textarea value={form.fullHomeAddress} onChange={set("fullHomeAddress")} placeholder="Full home address including local details" className="luxury-input resize-none h-20" required /></div>
                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setStep(1)} className="btn-glass flex-1 py-3 rounded-xl font-semibold text-sm">Back</button>
                  <button type="button" onClick={() => setStep(3)} className="btn-gold flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-fade-up">
                <h2 className="gold-text font-cinzel font-bold text-sm uppercase tracking-widest mb-6">Account Setup</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="luxury-label">Username *</label><input type="text" value={form.username} onChange={set("username")} placeholder="goldmember" className="luxury-input" required /></div>
                  <div><label className="luxury-label">Email Address *</label><input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className="luxury-input" required /></div>
                </div>
                <div>
                  <label className="luxury-label">Password *</label>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Create strong password (min 8 chars)" className="luxury-input pr-10" required minLength={8} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div><label className="luxury-label">Confirm Password *</label><input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Repeat password" className="luxury-input" required /></div>
                <div>
                  <label className="luxury-label">BVN / NIN <span className="text-muted-foreground normal-case font-normal">(Optional)</span></label>
                  <input type="text" value={form.bvnNin} onChange={set("bvnNin")} placeholder="BVN or NIN for identity verification" className="luxury-input" />
                </div>
                {error && (
                  <div className="py-2 px-3 rounded-lg bg-red-900/20 border border-red-600/30 text-red-400 text-xs">{error}</div>
                )}
                <div className="p-3 rounded-lg bg-gold/5 border border-gold/15 text-xs text-muted-foreground mt-2">
                  By creating an account you agree to our Terms of Service and Privacy Policy. Your data is securely stored and protected.
                </div>
                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setStep(2)} className="btn-glass flex-1 py-3 rounded-xl font-semibold text-sm">Back</button>
                  <button type="submit" disabled={loading} className="btn-gold flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                    {loading ? <span className="w-4 h-4 border-2 border-obsidian/30 border-t-obsidian rounded-full animate-spin" /> : <><span>Create Account</span><ArrowRight size={16} /></>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-gold hover:text-gold/80 font-semibold transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
