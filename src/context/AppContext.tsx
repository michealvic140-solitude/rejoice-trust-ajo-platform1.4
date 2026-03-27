import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { api } from "@/lib/api";

export type UserRole = "admin" | "moderator" | "user";

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
}

export interface User {
  id: string;
  username: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  isVip: boolean;
  isRestricted: boolean;
  isBanned: boolean;
  isFrozen: boolean;
  profilePicture?: string;
  totalPaid: number;
  activeSlots: number;
  unreadNotifications: number;
  dob?: string;
  age?: number;
  stateOfOrigin?: string;
  lga?: string;
  currentState?: string;
  currentAddress?: string;
  homeAddress?: string;
  bvnNin?: string;
  nickname?: string;
  bankDetails?: BankDetails;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  contributionAmount: number;
  cycleType: "daily" | "weekly" | "monthly";
  totalSlots: number;
  filledSlots: number;
  isLive: boolean;
  isLocked: boolean;
  chatLocked: boolean;
  payoutAccount?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  termsText: string;
  createdAt: string;
}

export interface Slot {
  id: number;
  groupId: string;
  userId?: string;
  username?: string;
  fullName?: string;
  isVip?: boolean;
  status: "available" | "locked" | "taken" | "mine";
  isDisbursed?: boolean;
  disbursedAt?: string;
}

export interface Transaction {
  id: string;
  code: string;
  groupName: string;
  groupId?: string;
  userId: string;
  amount: number;
  status: "pending" | "approved" | "declined";
  date: string;
  screenshotUrl?: string;
  seatNo?: number;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: "announcement" | "promotion" | "server-update" | "group-message";
  imageUrl?: string;
  videoUrl?: string;
  targetGroupId?: string;
  createdAt: string;
  adminName: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  subject: string;
  message: string;
  status: "open" | "replied" | "closed";
  createdAt: string;
  adminReply?: string;
  repliedAt?: string;
  attachmentUrl?: string | null;
}

export interface ContactInfo {
  whatsapp: string;
  facebook: string;
  email: string;
  callNumber: string;
  smsNumber: string;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isLoggedIn: boolean;
  notifications: Notification[];
  markNotificationsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  groups: Group[];
  refreshGroups: () => Promise<void>;
  transactions: Transaction[];
  refreshTransactions: () => Promise<void>;
  leaderboard: User[];
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  refreshAnnouncements: () => Promise<void>;
  supportTickets: SupportTicket[];
  setSupportTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  refreshSupportTickets: () => Promise<void>;
  contactInfo: ContactInfo;
  setContactInfo: React.Dispatch<React.SetStateAction<ContactInfo>>;
  refreshContactInfo: () => Promise<void>;
  loading: boolean;
  maintenanceMode: boolean;
  setMaintenanceMode: React.Dispatch<React.SetStateAction<boolean>>;
  refreshMaintenanceMode: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({ whatsapp: "", facebook: "", email: "", callNumber: "", smsNumber: "" });
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user);
  }, []);

  const refreshMaintenanceMode = useCallback(async () => {
    try {
      const data = await api.get("/api/maintenance");
      setMaintenanceMode(data.enabled);
    } catch {}
  }, []);

  const refreshGroups = useCallback(async () => {
    try { setGroups(await api.get("/api/groups")); } catch {}
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await api.get("/api/users/notifications");
      setNotifications(data);
      const unread = data.filter((n: Notification) => !n.read).length;
      setCurrentUserState(prev => prev ? { ...prev, unreadNotifications: unread } : null);
    } catch {}
  }, [currentUser]);

  const refreshTransactions = useCallback(async () => {
    if (!currentUser) return;
    try { setTransactions(await api.get("/api/users/transactions")); } catch {}
  }, [currentUser]);

  const refreshAnnouncements = useCallback(async () => {
    try { setAnnouncements(await api.get("/api/announcements")); } catch {}
  }, []);

  const refreshSupportTickets = useCallback(async () => {
    if (!currentUser) return;
    try { setSupportTickets(await api.get("/api/support")); } catch {}
  }, [currentUser]);

  const refreshContactInfo = useCallback(async () => {
    try { setContactInfo(await api.get("/api/contact")); } catch {}
  }, []);

  const markNotificationsRead = useCallback(async () => {
    try {
      await api.post("/api/users/notifications/read", {});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setCurrentUserState(prev => prev ? { ...prev, unreadNotifications: 0 } : null);
    } catch {}
  }, []);

  // Initial load: check session + load public data
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [meData, grpData, annData, contactData, lbData, maintData] = await Promise.all([
          api.get("/api/auth/me"),
          api.get("/api/groups"),
          api.get("/api/announcements"),
          api.get("/api/contact"),
          api.get("/api/users/leaderboard"),
          api.get("/api/maintenance"),
        ]);
        setMaintenanceMode(maintData.enabled);
        if (meData.user) setCurrentUserState(meData.user);
        setGroups(grpData);
        setAnnouncements(annData);
        setContactInfo(contactData);
        setLeaderboard(lbData.map((u: { id: string; username: string; firstName: string; lastName: string; totalPaid: number; isVip: boolean }) => ({
          ...u, role: "user" as UserRole, isRestricted: false, isBanned: false, isFrozen: false,
          email: "", phone: "", activeSlots: 0, unreadNotifications: 0,
        })));
        if (meData.user) {
          const [notifData, txData] = await Promise.all([
            api.get("/api/users/notifications"),
            api.get("/api/users/transactions"),
          ]);
          setNotifications(notifData);
          setTransactions(txData);
        }
      } catch (e) {
        console.error("Init error:", e);
      }
      setLoading(false);
    };
    init();
  }, []);

  // Reload user-specific data when user changes
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setTransactions([]);
      setSupportTickets([]);
      return;
    }
    const loadUserData = async () => {
      try {
        const [notifData, txData] = await Promise.all([
          api.get("/api/users/notifications"),
          api.get("/api/users/transactions"),
        ]);
        setNotifications(notifData);
        setTransactions(txData);
      } catch {}
    };
    loadUserData();
  }, [currentUser?.id]);

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      isLoggedIn: !!currentUser,
      notifications,
      markNotificationsRead,
      refreshNotifications,
      groups,
      refreshGroups,
      transactions,
      refreshTransactions,
      leaderboard,
      announcements,
      setAnnouncements,
      refreshAnnouncements,
      supportTickets,
      setSupportTickets,
      refreshSupportTickets,
      contactInfo,
      setContactInfo,
      refreshContactInfo,
      loading,
      maintenanceMode,
      setMaintenanceMode,
      refreshMaintenanceMode,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
