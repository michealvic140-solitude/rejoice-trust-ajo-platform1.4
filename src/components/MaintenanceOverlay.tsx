import { Settings, Shield, Clock } from "lucide-react";

export default function MaintenanceOverlay() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.96)", backdropFilter: "blur(12px)" }}>

      {/* Animated background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{ backgroundImage: `linear-gradient(rgba(234,179,8,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(234,179,8,0.15) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />

      <div className="relative z-10 max-w-md w-full text-center animate-scale-in">

        {/* Pulsing icon */}
        <div className="relative mx-auto mb-6 w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-gold/10 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-gold/15 animate-pulse" />
          <div className="w-24 h-24 rounded-full bg-gold-gradient flex items-center justify-center relative">
            <Settings size={40} className="text-obsidian animate-spin" style={{ animationDuration: "8s" }} />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield size={16} className="text-gold" />
            <span className="text-gold text-xs font-bold uppercase tracking-widest">System Notice</span>
            <Shield size={16} className="text-gold" />
          </div>
          <h1 className="gold-gradient-text font-cinzel font-black text-3xl md:text-4xl mb-3">
            PLATFORM UNDER<br />MAINTENANCE
          </h1>
          <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent mx-auto w-48 mb-4" />
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            We are currently performing scheduled platform improvements to enhance your experience.
            The Rejoice Ajo platform will be back online shortly.
          </p>
        </div>

        <div className="glass-card-static rounded-2xl p-5 mb-6 border border-gold/20">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock size={14} className="text-gold" />
            <span className="text-gold text-xs font-semibold uppercase tracking-widest">What's Happening</span>
          </div>
          <ul className="text-muted-foreground text-sm space-y-2 text-left">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold/60 shrink-0" />
              Platform systems are being updated and improved
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold/60 shrink-0" />
              Your funds, data, and savings are completely safe
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold/60 shrink-0" />
              All pending payments will be processed upon restoration
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold/60 shrink-0" />
              No action is required from you at this time
            </li>
          </ul>
        </div>

        <div className="p-4 rounded-xl bg-gold/8 border border-gold/20">
          <p className="text-gold font-cinzel font-bold text-sm mb-1">Thank you for your patience</p>
          <p className="text-muted-foreground text-xs">
            We apologize for any inconvenience. Our team is working diligently to restore full service as quickly as possible.
            For urgent matters, please contact admin support.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-gold/70 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-gold/40 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
