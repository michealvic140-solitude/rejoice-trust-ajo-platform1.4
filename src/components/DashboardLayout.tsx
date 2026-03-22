import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, PiggyBank, Shield, Receipt, HeadphonesIcon,
  Settings, History, ChevronRight
} from "lucide-react";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",    to: "/dashboard",    id: "dashboard" },
  { icon: PiggyBank,       label: "Savings",       to: "/savings",      id: "savings" },
  { icon: Shield,          label: "Groups",        to: "/groups",       id: "groups" },
  { icon: Receipt,         label: "Transactions",  to: "/transactions", id: "transactions" },
  { icon: History,         label: "History",       to: "/history",      id: "history" },
  { icon: HeadphonesIcon,  label: "Support",       to: "/support",      id: "support" },
  { icon: Settings,        label: "Settings",      to: "/profile",      id: "settings" },
];

interface Props {
  children: React.ReactNode;
  activeTab?: string;
}

export default function DashboardLayout({ children, activeTab }: Props) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex relative overflow-hidden pt-16">
      {/* Sidebar */}
      <aside
        className="hidden md:flex w-52 shrink-0 flex-col border-r border-gold/10 z-10 pt-6 pb-6 fixed top-16 bottom-0 left-0"
        style={{ background: "rgba(8,8,8,0.85)", backdropFilter: "blur(20px)" }}>

        <div className="px-5 mb-8 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gold-gradient flex items-center justify-center shadow animate-glow-pulse shrink-0">
            <span className="text-obsidian font-cinzel font-black text-xs">RA</span>
          </div>
          <span className="gold-gradient-text font-cinzel font-bold text-sm tracking-wide">RTA</span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(item => {
            const isActive = location.pathname === item.to || activeTab === item.id;
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gold/15 border border-gold/25 text-gold"
                    : "text-muted-foreground hover:text-foreground hover:bg-gold/5 border border-transparent"
                }`}>
                <item.icon size={16} className={isActive ? "text-gold" : ""} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gold/10 flex"
        style={{ background: "rgba(8,8,8,0.95)", backdropFilter: "blur(20px)" }}>
        {NAV.slice(0, 6).map(item => {
          const isActive = location.pathname === item.to || activeTab === item.id;
          return (
            <Link key={item.to} to={item.to}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-all ${isActive ? "text-gold" : "text-muted-foreground"}`}>
              <item.icon size={16} />
              <span className="text-[8px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="md:ml-52 flex-1 min-w-0 relative z-10 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  );
}
