import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, User, LayoutDashboard, Shield, Crown, Menu, X } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/context/AppContext";

export default function Navbar() {
  const { currentUser, isLoggedIn, notifications, markNotificationsRead, setCurrentUser } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const unread = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    setCurrentUser(null);
    navigate("/");
    setMobileOpen(false);
  };

  const isActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  const navLinks = [
    { to: "/", label: "Home", exact: true },
    { to: "/groups", label: "Groups" },
    ...(isLoggedIn ? [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/profile", label: "Profile", icon: User },
      ...(currentUser?.role === "admin" || currentUser?.role === "moderator" ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
    ] : []),
  ];

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-3 border-b border-gold/20 animate-navbar-bg"
        style={{ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0" onClick={() => setMobileOpen(false)}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gold/30 animate-glass-pulse"
              style={{ background: "rgba(234,179,8,0.09)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
              <Crown size={16} style={{ color: "#f5d060", filter: "drop-shadow(0 0 6px rgba(234,179,8,0.7))" }} />
              <span className="font-cinzel font-black text-sm tracking-widest"
                style={{ background: "linear-gradient(90deg,#c8860a,#f5d060,#eab308,#d4a017,#f5d060,#c8860a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", backgroundSize: "200% auto", animation: "brand-shimmer 3s linear infinite" }}>
                RTAS
              </span>
            </div>
            <div className="hidden md:block">
              <span className="font-cinzel font-black text-xs tracking-wide leading-tight block"
                style={{ background: "linear-gradient(90deg,#c8860a,#f5d060,#eab308,#d4a017,#f5d060,#c8860a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", backgroundSize: "200% auto", animation: "brand-shimmer 4s linear infinite" }}>
                REJOICE TRUST AJO
              </span>
              <span className="font-cinzel font-bold text-[8px] tracking-widest block"
                style={{ background: "linear-gradient(90deg,#eab308,#f5d060,#c8860a)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                SAVINGS PLATFORM
              </span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, exact }) => (
              <Link key={to} to={to}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  (exact ? location.pathname === to : isActive(to))
                    ? "bg-gold/15 border-gold/40 text-gold"
                    : "bg-transparent border-transparent text-muted-foreground hover:text-gold hover:border-gold/20 hover:bg-gold/5"
                }`}>
                {label}
              </Link>
            ))}
          </div>

          {/* Right: notifications + auth + hamburger */}
          <div className="flex items-center gap-2 shrink-0">
            {isLoggedIn && (
              <div className="relative">
                <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markNotificationsRead(); }}
                  className="relative p-2 rounded-lg border border-gold/20 bg-gold/5 hover:bg-gold/10 transition-all">
                  <Bell size={15} className="text-gold" />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">
                      {unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-12 w-80 border border-gold/20 rounded-xl p-2 animate-scale-in z-50 shadow-2xl"
                    style={{ background: "rgba(10,10,10,0.97)", backdropFilter: "blur(20px)" }}>
                    <p className="gold-text text-xs font-cinzel px-3 py-2 border-b border-gold/10 mb-1">NOTIFICATIONS</p>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-muted-foreground text-sm p-3">No notifications</p>
                      ) : notifications.map(n => (
                        <div key={n.id} className={`px-3 py-2 rounded-lg mb-1 text-xs ${n.read ? "text-muted-foreground" : "text-foreground bg-gold/5 border border-gold/10"}`}>
                          {n.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Desktop auth buttons */}
            <div className="hidden md:flex items-center gap-2">
              {isLoggedIn ? (
                <button onClick={handleLogout}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 transition-all flex items-center gap-1.5">
                  <LogOut size={11} /><span>SIGN OUT</span>
                </button>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-1.5 rounded-lg text-xs font-bold border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 transition-all">SIGN IN</Link>
                  <Link to="/register" className="btn-gold px-4 py-1.5 rounded-lg text-xs font-bold">SIGN UP</Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg border border-gold/20 bg-gold/5 hover:bg-gold/10 transition-all">
              {mobileOpen ? <X size={18} className="text-gold" /> : <Menu size={18} className="text-gold" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
          <div className="absolute top-[57px] left-0 right-0 border-b border-gold/20 animate-scale-in"
            style={{ background: "rgba(8,8,8,0.97)", backdropFilter: "blur(24px)" }}
            onClick={e => e.stopPropagation()}>
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(({ to, label, exact }) => (
                <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                    (exact ? location.pathname === to : isActive(to))
                      ? "bg-gold/15 border-gold/40 text-gold"
                      : "bg-transparent border-transparent text-muted-foreground hover:text-gold hover:border-gold/20 hover:bg-gold/5"
                  }`}>
                  {label}
                </Link>
              ))}
              <div className="pt-3 border-t border-gold/10 mt-3">
                {isLoggedIn ? (
                  <button onClick={handleLogout}
                    className="w-full px-4 py-3 rounded-xl text-sm font-bold border border-red-600/30 bg-red-900/15 text-red-400 hover:bg-red-900/25 transition-all flex items-center justify-center gap-2">
                    <LogOut size={14} /> Sign Out
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <Link to="/login" onClick={() => setMobileOpen(false)}
                      className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-center border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 transition-all">
                      Sign In
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)}
                      className="flex-1 btn-gold px-4 py-3 rounded-xl text-sm font-bold text-center">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
