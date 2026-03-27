import { useApp } from "@/context/AppContext";
import { Navigate } from "react-router-dom";
import ParticleBackground from "@/components/ParticleBackground";
import { Shield, Phone, MessageSquare } from "lucide-react";

export default function Banned() {
  const { currentUser, isLoggedIn, contactInfo } = useApp();

  if (!isLoggedIn || !currentUser?.isBanned) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <ParticleBackground />
      <div className="relative z-10 max-w-lg w-full">
        <div className="glass-card-static rounded-3xl p-8 border border-red-600/30 text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-red-900/30 border border-red-600/40 flex items-center justify-center mx-auto mb-6">
            <Shield size={36} className="text-red-400" />
          </div>
          <h1 className="font-cinzel font-black text-2xl text-red-400 mb-3">Account Suspended</h1>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Your account has been banned from the Rejoice Trust Ajo platform.
            You cannot access groups, make payments, or use any platform features until you are unbanned by an administrator.
          </p>
          <div className="p-4 rounded-xl bg-red-900/15 border border-red-600/20 text-left mb-6">
            <p className="text-red-300 text-xs font-cinzel font-bold mb-1 uppercase tracking-widest">What to do next</p>
            <p className="text-muted-foreground text-sm">Contact the platform administrator to appeal your ban. Provide your username and explain your situation.</p>
          </div>
          <div className="space-y-3">
            {contactInfo?.whatsapp && (
              <a href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-green-600/40 bg-green-900/20 text-green-400 hover:bg-green-900/35 transition-all text-sm font-bold">
                <MessageSquare size={16} /> Contact via WhatsApp
              </a>
            )}
            {contactInfo?.callNumber && (
              <a href={`tel:${contactInfo.callNumber}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 transition-all text-sm font-bold">
                <Phone size={16} /> Call Admin: {contactInfo.callNumber}
              </a>
            )}
          </div>
          <p className="text-muted-foreground/50 text-xs mt-6">Logged in as: @{currentUser.username}</p>
        </div>
      </div>
    </div>
  );
}
