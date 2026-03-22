import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, User, LayoutDashboard, Shield, Crown } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/context/AppContext";

export default function Navbar() {
  const { currentUser, isLoggedIn, notifications, markNotificationsRead, setCurrentUser } = useApp();
  const location = useLocation();
  const navigate  = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  const unread = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    setCurrentUser(null);
    navigate("/");
  };

  const isActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-3 border-b border-gold/20 animate-navbar-bg"
      style={{
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">

        {/* Logo / Brand */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          {/* Crown icon pill */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gold/30 animate-glass-pulse"
            style={{
              background: "rgba(234,179,8,0.09)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            <Crown
              size={16}
              style={{
                color: "#f5d060",
                filter: "drop-shadow(0 0 6px rgba(234,179,8,0.7))",
              }}
            />
            <span
              className="font-cinzel font-black text-sm tracking-widest animate-brand-shimmer"
              style={{
                background: "linear-gradient(90deg, #c8860a, #f5d060, #eab308, #d4a017, #f5d060, #c8860a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                backgroundSize: "200% auto",
                animation: "brand-shimmer 3s linear infinite",
              }}
            >
              RTAS
            </span>
          </div>

          {/* Full platform name — animated glassy text */}
          <div className="hidden md:block">
            <span
              className="font-cinzel font-black text-xs tracking-wide leading-tight block"
              style={{
                background: "linear-gradient(90deg, #c8860a, #f5d060, #eab308, #d4a017, #f5d060, #c8860a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                backgroundSize: "200% auto",
                animation: "brand-shimmer 4s linear infinite",
              }}
            >
              REJOICE TRUST AJO
            </span>
            <span
              className="font-cinzel font-bold text-[8px] tracking-widest block"
              style={{
                background: "linear-gradient(90deg, #eab308, #f5d060, #c8860a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              SAVINGS PLATFORM
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 flex-wrap">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              isActive("/") && location.pathname === "/"
                ? "bg-gold/15 border-gold/40 text-gold"
                : "bg-transparent border-transparent text-muted-foreground hover:text-gold hover:border-gold/20 hover:bg-gold/5"
            }`}
          >Home</Link>

          <Link
            to="/groups"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              isActive("/groups")
                ? "bg-gold/15 border-gold/40 text-gold"
                : "bg-transparent border-transparent text-muted-foreground hover:text-gold hover:border-gold/20 hover:bg-gold/5"
            }`}
          >Groups</Link>

          {isLoggedIn && (
            <>
              <Link
                to="/dashboard"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1 ${
                  isActive("/dashboard")
                    ? "bg-gold/15 border-gold/40 text-gold"
                    : "bg-transparent border-transparent text-muted-foreground hover:text-gold hover:border-gold/20 hover:bg-gold/5"
                }`}
              >
                <LayoutDashboard size={11} />Dashboard
              </Link>

              <Link
                to="/profile"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1 ${
                  isActive("/profile")
                    ? "bg-gold/15 border-gold/40 text-gold"
                    : "bg-transparent border-transparent text-muted-foreground hover:text-gold hover:border-gold/20 hover:bg-gold/5"
                }`}
              >
                <User size={11} />Profile
              </Link>

              {currentUser?.role === "admin" && (
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1 ${
                    isActive("/admin")
                      ? "bg-gold/15 border-gold/40 text-gold"
                      : "bg-transparent border-transparent text-muted-foreground hover:text-gold hover:border-gold/20 hover:bg-gold/5"
                  }`}
                >
                  <Shield size={11} />Admin
                </Link>
              )}
            </>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {isLoggedIn ? (
            <>
              {/* Bell */}
              <div className="relative">
                <button
                  onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markNotificationsRead(); }}
                  className="relative p-2 rounded-lg border border-gold/20 bg-gold/5 hover:bg-gold/10 transition-all"
                >
                  <Bell size={15} className="text-gold" />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-12 w-80 border border-gold/20 rounded-xl p-2 animate-scale-in z-50 shadow-2xl"
                    style={{ background: "rgba(10,10,10,0.95)", backdropFilter: "blur(20px)" }}>
                    <p className="gold-text text-xs font-cinzel px-3 py-2 border-b border-gold/10 mb-1">NOTIFICATIONS</p>
                    {notifications.length === 0 ? (
                      <p className="text-muted-foreground text-sm p-3">No notifications</p>
                    ) : notifications.map(n => (
                      <div key={n.id} className={`px-3 py-2 rounded-lg mb-1 text-xs ${n.read ? "text-muted-foreground" : "text-foreground bg-gold/5"}`}>
                        {n.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 rounded-lg text-xs font-bold border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 transition-all flex items-center gap-1.5"
              >
                <LogOut size={11} />
                <span>SIGN OUT</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-lg text-xs font-bold border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 transition-all"
              >
                SIGN IN
              </Link>
              <Link
                to="/register"
                className="btn-gold px-4 py-1.5 rounded-lg text-xs font-bold"
              >
                SIGN UP
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
