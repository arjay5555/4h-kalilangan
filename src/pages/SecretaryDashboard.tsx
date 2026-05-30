import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { LogIn, LogOut, Users, FileText, Calendar, Plus, Trash2, Edit2, Save, X, Menu, ChevronLeft, Activity, Image as ImageIcon, Search, ArrowDownAZ, ArrowUpZA, Download, Eye, Folder, UploadCloud, Bold, Italic, List, ListOrdered, Type, Upload, RefreshCcw, AlertTriangle, FileCheck, CheckSquare, Square, Filter, Handshake, Shield, UsersRound, Bell, LayoutGrid } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { db, auth, handleFirestoreError, OperationType, storage } from "../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { DocumentsTab, CouncilTab, PartnersContainer } from "./Dashboard";
import { recordDocumentAccess } from "../lib/utils";

type TabType = "overview" | "members" | "minutes" | "memos" | "documents" | "council" | "partners";

export default function SecretaryDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalStatusFilter, setGlobalStatusFilter] = useState("All");
  const [globalCategoryFilter, setGlobalCategoryFilter] = useState("All");

  const [notifMembers, setNotifMembers] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u && u.email) {
        const { getDoc } = await import("firebase/firestore");
        const staffRef = doc(db, "staff", u.email.replace(/[@.]/g, "_"));
        const staffSnap = await getDoc(staffRef);
        if (staffSnap.exists()) {
          setUserRole(staffSnap.data().role);
        }
      }
      setAuthLoading(false);
    });
    
    const unsubMembers = onSnapshot(collection(db, "members"), snap => {
      setNotifMembers(snap.docs.map(doc => doc.data()));
    });
    
    return () => { unsubscribeAuth(); unsubMembers(); };
  }, []);

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const diff = Date.now() - new Date(dob).getTime();
    if (isNaN(diff)) return 0;
    const ageDate = new Date(diff); 
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const overAgeCount = notifMembers.filter(m => {
    if (!m.birthDate) return false;
    const age = calculateAge(m.birthDate);
    return age > 30 && m.category !== "Alumni" && m.status !== "Alumni";
  }).length;

  const renewalCount = notifMembers.filter(m => m.status === "Not Renewed").length;
  const totalNotifications = (overAgeCount > 0 ? 1 : 0) + (renewalCount > 0 ? 1 : 0);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-black"></div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#f8fafc] dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans">
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`fixed md:sticky top-0 left-0 h-[100dvh] w-72 bg-white dark:bg-[#111] border-r border-slate-200 dark:border-slate-800/60 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800/60 shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="4-H Kalilangan Logo" className="w-10 h-10 rounded-full object-cover shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold font-display text-[13px] leading-tight text-[var(--color-4h-green)]">4-H Club Kalilangan</span>
              <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Secretary Portal</span>
            </div>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-3">
          <div className="mb-6">
            <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Internal Management</h3>
            <div className="flex flex-col gap-1">
              {([
                { id: "overview", icon: Activity, label: "Overview" },
                { id: "members", icon: Users, label: "Members List" },
                { id: "minutes", icon: Calendar, label: "Meeting Minutes" },
                { id: "memos", icon: FileText, label: "Internal Documents" },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as TabType); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === tab.id ? 'bg-[var(--color-4h-green)] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Website Layout</h3>
            <div className="flex flex-col gap-1">
              {([
                { id: "documents", icon: FileText, label: "Public Documents" },
                { id: "council", icon: Shield, label: "Council Members" },
                { id: "partners", icon: Handshake, label: "Partners" },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as TabType); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === tab.id ? 'bg-[var(--color-4h-green)] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800/60 mt-auto flex flex-col gap-2">
          {userRole === "admin" && (
            <Link to="/dashboard" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors text-sm">
              <ChevronLeft size={18} />
              Return to Admin
            </Link>
          )}
          <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-sm">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800/60 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md z-30 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors md:hidden">
              <Menu size={20} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" 
                title="Notifications"
              >
                <Bell size={20} />
                {totalNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#111]"></span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#151515] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold">Notifications</h3>
                        {totalNotifications > 0 && <span className="text-xs font-bold bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] px-2 py-1 rounded-md">{totalNotifications} New</span>}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {overAgeCount > 0 && (
                          <div 
                            onClick={() => { setActiveTab("members"); setGlobalCategoryFilter("Alumni"); setShowNotifications(false); }}
                            className="p-4 border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-[#222] transition-colors cursor-pointer"
                          >
                            <p className="text-sm font-semibold truncate"><span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-2"></span>Over-aged Members ({overAgeCount})</p>
                            <p className="text-xs text-slate-500 mt-1">Some members have exceeded the age limit and need status updates.</p>
                          </div>
                        )}
                        {renewalCount > 0 && (
                          <div 
                            onClick={() => { setActiveTab("members"); setGlobalStatusFilter("Inactive"); setShowNotifications(false); }}
                            className="p-4 border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-[#222] transition-colors cursor-pointer"
                          >
                            <p className="text-sm font-semibold truncate"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block mr-2"></span>Renewal Required ({renewalCount})</p>
                            <p className="text-xs text-slate-500 mt-1">Pending membership renewals require your attention.</p>
                          </div>
                        )}
                        {totalNotifications === 0 && (
                           <div className="p-6 text-center text-sm text-slate-500">No new notifications.</div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-bold leading-none">{user.displayName || "Secretary"}</span>
              <span className="text-xs text-slate-500">{user.email}</span>
            </div>
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=4ade80&color=fff`} alt="User" className="w-9 h-9 rounded-full border-2 border-[var(--color-4h-green)]" />
          </div>
        </header>

        <div id="dashboard-scroll-area" className="flex-1 p-3 md:p-5 overflow-y-auto w-full">
          <div className="w-full max-w-none mx-auto pb-20 md:pb-0">
            <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800/60 rounded-3xl p-5 md:p-6 shadow-sm min-h-[50vh]">
              {activeTab === "overview" && <OverviewTab />}
              {activeTab === "members" && <MembersTab key={`${globalStatusFilter}-${globalCategoryFilter}`} initialStatusFilter={globalStatusFilter} initialCategoryFilter={globalCategoryFilter} />}
              {activeTab === "minutes" && <MinutesTab />}
              {activeTab === "memos" && <MemosTab />}
              {activeTab === "council" && <div className="mt-4"><CouncilTab /></div>}
              {activeTab === "partners" && <div className="mt-4"><PartnersContainer /></div>}
              {activeTab === "documents" && <div className="mt-4"><DocumentsTab /></div>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Sub components

function OverviewTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [council, setCouncil] = useState<any[]>([]);
  const [minutes, setMinutes] = useState<any[]>([]);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [memos, setMemos] = useState<any[]>([]);
  const [partnersCount, setPartnersCount] = useState(0);
  const [chartType, setChartType] = useState<"Status" | "Age" | "Gender" | "Interest" | "Chapter Type" | "Barangay Chapter" | "School Chapter">("Status");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accessLog, setAccessLog] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadAccessLog = () => {
      try {
        setAccessLog(JSON.parse(localStorage.getItem('4h_recent_access') || '{}'));
      } catch (e) {}
    };
    loadAccessLog();
    window.addEventListener('storage', loadAccessLog);
    // Custom event for same-window updates
    window.addEventListener('local-storage-update', loadAccessLog);
    return () => {
      window.removeEventListener('storage', loadAccessLog);
      window.removeEventListener('local-storage-update', loadAccessLog);
    };
  }, []);

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const diff = Date.now() - new Date(dob).getTime();
    if (isNaN(diff)) return 0;
    const ageDate = new Date(diff); 
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const getCategory = (age: number) => {
    if (age >= 7 && age <= 12) return "Little 4-Hers";
    if (age >= 13 && age <= 17) return "Junior 4-Hers";
    if (age >= 18 && age <= 21) return "Senior 4-Hers";
    if (age >= 22 && age <= 30) return "Professional 4-Hers";
    if (age > 30) return "Alumni";
    return "Out of Range";
  };

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "members"), snap => {
      const docs = snap.docs.map(doc => {
        const data = doc.data() as Member;
        if (data.birthDate) {
           data.age = calculateAge(data.birthDate);
           data.category = getCategory(data.age);
        }
        return { ...data, id: doc.id };
      });
      setMembers(docs);
    });
    const unsub2 = onSnapshot(collection(db, "council"), snap => setCouncil(snap.docs.map(d=>d.data())));
    const unsub3 = onSnapshot(collection(db, "minutes"), snap => setMinutes(snap.docs.map(d=>({ id: d.id, ...d.data() }))));
    const unsub4 = onSnapshot(collection(db, "documents_col"), snap => {
      const docs = snap.docs.map(d=>({ id: d.id, ...d.data() }));
      setRecentDocs(docs); 
    });
    const unsub5 = onSnapshot(collection(db, "memos"), snap => setMemos(snap.docs.map(d=>({ id: d.id, ...d.data() }))));
    const unsub6 = onSnapshot(collection(db, "partners"), snap => setPartnersCount(snap.size));
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); };
  }, []);

  // Members by Age Data
  const VALID_AGES = ["Little 4-Hers", "Junior 4-Hers", "Senior 4-Hers", "Professional 4-Hers", "Alumni"];
  
  const ageCount = members.reduce((acc, m) => {
    const c = m.category || "Unknown";
    if (VALID_AGES.includes(c)) {
      acc[c] = (acc[c] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const ageData = VALID_AGES.map((key, index) => ({
    name: key,
    value: ageCount[key] || 0,
    color: ['#4ade80', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa'][index % 5]
  }));

  const VALID_INTERESTS = ["Agriculture", "Education", "Environmental", "Art and Culture", "Health & Wellness", "STEM", "Leadership", "Community Service", "Livelihood"];

  // Members by Interest Data
  const interestCount = members.reduce((acc, m) => {
    if (m.interests && m.interests.length > 0) {
      m.interests.forEach(interest => {
        if (VALID_INTERESTS.includes(interest)) {
          acc[interest] = (acc[interest] || 0) + 1;
        }
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const interestData = VALID_INTERESTS.map((interest, index) => ({
    name: interest,
    value: interestCount[interest] || 0,
    color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#64748b'][index % 9]
  }));

  const statusColors: Record<string, string> = { "Active": "#4ade80", "Not Renewed": "#f87171", "Inactive": "#94a3b8", "Alumni": "#a78bfa", "Unknown": "#fbbf24" };
  const statusCount = members.reduce((acc, m) => {
    const st = m.status || "Unknown";
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const statusData = Object.keys(statusCount).map((key) => ({ name: key, value: statusCount[key], color: statusColors[key] || "#94a3b8" }));

  const genderCount = members.reduce((acc, m) => {
    const g = m.sex || m.gender || "Unknown";
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const genderData = Object.keys(genderCount).map((key, i) => ({ name: key, value: genderCount[key], color: ['#60a5fa', '#f43f5e', '#a78bfa'][i % 3] }));

  const chapterTypeCount = members.reduce((acc, m) => {
    let t = m.chapterType || "Unknown";
    if (t === "Both") t = m.primaryChapterType || "Both";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const chapterTypeData = Object.keys(chapterTypeCount).map((key, i) => ({ name: key, value: chapterTypeCount[key], color: ['#4ade80', '#60a5fa', '#f87171', '#a78bfa', '#fbbf24'][i % 5] }));

  const barangayCount = members.reduce((acc, m) => {
    if (m.chapterType === "Both" && m.primaryChapterType !== "Barangay Based") return acc;
    if (m.chapterType === "School Based") return acc;
    const b = m.barangayChapter || "No Chapter";
    acc[b] = (acc[b] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const barangayData = Object.keys(barangayCount).map((key, i) => ({ name: key, value: barangayCount[key], color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#64748b'][i % 9] })).sort((a,b)=>b.value-a.value);

  const schoolCount = members.reduce((acc, m) => {
    if (m.chapterType === "Both" && m.primaryChapterType !== "School Based") return acc;
    if (m.chapterType === "Barangay Based") return acc;
    const s = m.schoolChapter || "No Chapter";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const schoolData = Object.keys(schoolCount).map((key, i) => ({ name: key, value: schoolCount[key], color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#64748b'][i % 9] })).sort((a,b)=>b.value-a.value);

  const getChartData = () => {
    switch (chartType) {
      case "Age": return ageData;
      case "Gender": return genderData;
      case "Interest": return interestData;
      case "Chapter Type": return chapterTypeData;
      case "Barangay Chapter": return barangayData;
      case "School Chapter": return schoolData;
      case "Status": default: return statusData;
    }
  };
  const activeChartData = getChartData();

  const allRecent = [
    ...recentDocs.map(d => ({ ...d, _type: "Public Document", _date: d.date || d.createdAt || new Date().toISOString(), title: d.title || "Document", link: d.link || d.url })),
    ...memos.map(d => ({ ...d, _type: "Internal Memo", _date: d.date || d.createdAt || new Date().toISOString(), title: d.subject || d.title || "Memo", link: d.link || d.url })),
    ...minutes.map(d => ({ ...d, _type: "Meeting Minutes", _date: d.date || d.createdAt || new Date().toISOString(), title: d.type ? `${d.type} Meeting` : "Meeting", link: d.link || d.url }))
  ].filter(d => d.title).sort((a,b) => {
    const timeA = new Date(accessLog[a.id] || a._date).getTime();
    const timeB = new Date(accessLog[b.id] || b._date).getTime();
    return timeB - timeA;
  }).slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display tracking-tight">Overview</h2>
        <p className="text-slate-500 text-sm mt-1">Summary and action items for the secretary.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#111] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
             <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{members.length}</div>
            <div className="text-sm font-medium text-slate-500">Total Members</div>
          </div>
        </div>
        <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#111] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] flex items-center justify-center shrink-0">
             <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{council.length}</div>
            <div className="text-sm font-medium text-slate-500">Total Council</div>
          </div>
        </div>
        <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#111] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0">
             <Calendar size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{minutes.length}</div>
            <div className="text-sm font-medium text-slate-500">Meetings Recorded</div>
          </div>
        </div>
        <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#111] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0">
             <Handshake size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{partnersCount}</div>
            <div className="text-sm font-medium text-slate-500">Total Partners</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-4 relative z-20">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
              Members By {chartType}
            </h3>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {chartType}
              <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }}>
                <ChevronLeft className="w-4 h-4 -rotate-90" />
              </motion.div>
            </button>
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-30"
                >
                  {(["Status", "Chapter Type", "Barangay Chapter", "School Chapter", "Age", "Gender", "Interest"] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => { setChartType(type); setDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${chartType === type ? 'font-bold text-[var(--color-4h-green)]' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                      {type}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex-1 w-full relative z-10" style={{ minHeight: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeChartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                  labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) + 25;
                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                    return value > 0 ? (
                      <text x={x} y={y} fill="currentColor" className="text-[11px] font-medium fill-slate-600 dark:fill-slate-400" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                        {value}
                      </text>
                    ) : null;
                  }}
                >
                  {activeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col min-h-[400px]">
          <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200 mb-4"><Activity size={18} className="text-[var(--color-4h-green)]" /> Recent Documents & Activity</h3>
          {allRecent.length > 0 ? (
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2 no-scrollbar">
              {allRecent.map((doc, idx) => {
                const inner = (
                  <div className="flex items-start gap-3 overflow-hidden w-full">
                    <div className="p-2 bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] rounded-lg shrink-0 group-hover:scale-105 transition-transform">
                      {doc._type === "Meeting Minutes" ? <Calendar size={18} /> : (doc._type === "Internal Memo" ? <Folder size={18} /> : <FileText size={18} />)}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate group-hover:text-[var(--color-4h-green)] transition-colors" title={doc.title}>{doc.title}</h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{doc._type} • {new Date(doc._date).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
                return doc.link ? (
                   <a key={idx} href={doc.link} target="_blank" rel="noreferrer" className="group flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800/60 rounded-xl hover:shadow-md dark:hover:bg-slate-900 transition-all bg-slate-50 dark:bg-slate-900/30">
                     {inner}
                   </a>
                ) : (
                   <div key={idx} className="group flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800/60 rounded-xl hover:shadow-sm dark:hover:bg-slate-900 transition-all bg-slate-50 dark:bg-slate-900/30">
                     {inner}
                   </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-slate-500 flex flex-col items-center justify-center flex-1">
              <Activity size={32} className="opacity-20 mb-2" />
              No recent documents or activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type Member = {
  id: string;
  picture?: string;
  name?: string; // Legacy
  chapter?: string; // Legacy
  role?: string; // Legacy
  joined?: string; // Legacy
  firstName?: string;
  lastName?: string;
  middleName?: string;
  suffix?: string;
  age?: number;
  birthDate?: string;
  address?: {
    region?: string;
    province?: string;
    municipality?: string;
    barangay?: string;
    purok?: string;
    street?: string; // Legacy
  };
  gender?: string; // Legacy for Sex
  sex?: string;
  civilStatus?: string;
  highestEducationalAttainment?: string;
  degree?: string;
  chapterType?: string;
  primaryChapterType?: string;
  barangayChapter?: string;
  schoolChapter?: string;
  contactNumber?: string;
  email?: string;
  occupation?: string;
  registrationDate?: string;
  interests?: string[];
  documents?: {name: string, url: string}[];
  dataPrivacyUrl?: string;
  guardianConsentUrl?: string;
  category?: string;
  status?: string;
};

const PILLARS = ["Agriculture", "Education", "Environmental", "Art and Culture", "Health & Wellness", "STEM", "Leadership", "Community Service", "Livelihood"];

function MembersTab({ initialStatusFilter = "All", initialCategoryFilter = "All" }: { initialStatusFilter?: string, initialCategoryFilter?: string }) {
  const [items, setItems] = useState<Member[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Member>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [viewDetailsFor, setViewDetailsFor] = useState<Member | null>(null);
  const [docsFor, setDocsFor] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter);
  const [genderFilter, setGenderFilter] = useState("All");
  const [interestFilter, setInterestFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter !== "All" ? initialStatusFilter : "Active");
  const [showFilters, setShowFilters] = useState(initialStatusFilter !== "All" || initialCategoryFilter !== "All");

  useEffect(() => {
    if (isAdding) {
      document.getElementById('dashboard-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isAdding]);

  const [isRenewMode, setIsRenewMode] = useState(false);
  const [selectedForRenewal, setSelectedForRenewal] = useState<string[]>([]);

  const [regions, setRegions] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [barangays, setBarangays] = useState<any[]>([]);
  const [regionCode, setRegionCode] = useState("");
  const [provCode, setProvCode] = useState("");
  const [munCode, setMunCode] = useState("");
  const [schoolChaptersList, setSchoolChaptersList] = useState<any[]>([]);
  const [barangayChaptersList, setBarangayChaptersList] = useState<any[]>([]);

  const CATEGORIES = ["All", "Little 4-Hers", "Junior 4-Hers", "Senior 4-Hers", "Professional 4-Hers", "Alumni"];
  const GENDERS = ["All", "Male", "Female"];
  const INTERESTS = ["All", ...PILLARS];
  const STATUSES = ["Active", "Inactive", "Alumni"];

  useEffect(() => {
    fetch("https://psgc.gitlab.io/api/regions/")
      .then(res => res.json())
      .then(data => setRegions(data))
      .catch(console.error);

    const unsubCouncil = onSnapshot(collection(db, "council"), snap => {
      const b: any[] = [];
      const s: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.type === "Barangay Based") b.push(data);
        if (data.type === "School Based") s.push(data);
      });
      setBarangayChaptersList(b);
      setSchoolChaptersList(s);
    });
    return () => unsubCouncil();
  }, []);

  useEffect(() => {
    if (editForm.address?.region && regions.length > 0 && !regionCode) {
      const match = regions.find(r => r.name === editForm.address?.region);
      if (match) {
        setRegionCode(match.code);
        fetch(`https://psgc.gitlab.io/api/regions/${match.code}/provinces/`).then(r => r.json()).then(p => {
          setProvinces(p);
          if (p.length === 0) {
            fetch(`https://psgc.gitlab.io/api/regions/${match.code}/cities-municipalities/`).then(r=>r.json()).then(setMunicipalities).catch(()=>setMunicipalities([]));
          }
        }).catch(()=>setProvinces([]));
      }
    }
  }, [editForm.address?.region, regions, regionCode]);

  useEffect(() => {
    if (editForm.address?.province && provinces.length > 0 && !provCode) {
      const match = provinces.find(p => p.name === editForm.address?.province);
      if (match) {
        setProvCode(match.code);
        fetch(`https://psgc.gitlab.io/api/provinces/${match.code}/cities-municipalities/`).then(r=>r.json()).then(setMunicipalities).catch(()=>setMunicipalities([]));
      }
    }
  }, [editForm.address?.province, provinces, provCode]);

  useEffect(() => {
    if (editForm.address?.municipality && municipalities.length > 0 && !munCode) {
      const match = municipalities.find(m => m.name === editForm.address?.municipality);
      if (match) {
        setMunCode(match.code);
        fetch(`https://psgc.gitlab.io/api/cities-municipalities/${match.code}/barangays/`).then(r=>r.json()).then(setBarangays).catch(()=>setBarangays([]));
      }
    }
  }, [editForm.address?.municipality, municipalities, munCode]);

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const diff = Date.now() - new Date(dob).getTime();
    if (isNaN(diff)) return 0;
    const ageDate = new Date(diff); 
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const getCategory = (age: number) => {
    if (age >= 7 && age <= 12) return "Little 4-Hers";
    if (age >= 13 && age <= 17) return "Junior 4-Hers";
    if (age >= 18 && age <= 21) return "Senior 4-Hers";
    if (age >= 22 && age <= 30) return "Professional 4-Hers";
    if (age > 30) return "Alumni";
    return "Out of Range";
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "members"), snap => {
      const docs = snap.docs.map(doc => {
        const data = doc.data() as Member;
        if (data.birthDate) {
           data.age = calculateAge(data.birthDate);
           data.category = getCategory(data.age);
        }
        return { id: doc.id, ...data };
      });
      setItems(docs);
    }, err => handleFirestoreError(err, OperationType.GET, "members"));
    return unsub;
  }, []);

  const handleDOBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value;
    const age = calculateAge(dob);
    setEditForm({ ...editForm, birthDate: dob, age, category: getCategory(age) });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: "picture" | "dataPrivacyUrl" | "guardianConsentUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `members/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setEditForm(prev => ({ ...prev, [fieldName]: url }));
    } catch (err: any) {
      console.error(err);
      alert("Upload failed: " + err.message);
    }
    setIsUploading(false);
  };

  const toggleInterest = (pillar: string) => {
    const curr = editForm.interests || [];
    if (curr.includes(pillar)) {
      setEditForm({ ...editForm, interests: curr.filter(p => p !== pillar) });
    } else {
      setEditForm({ ...editForm, interests: [...curr, pillar] });
    }
  };

  const handleSave = async () => {
    // Determine the name if not present
    const isLegacy = editForm.name !== undefined && !editForm.firstName;
    if (!isLegacy && (!editForm.firstName || !editForm.lastName)) {
      alert("Please fill required fields (Name).");
      return;
    }
    try {
      let id = editForm.id;
      let memberId = (editForm as any).memberId;
      
      if (!id) {
        // Generate new member ID
        const yearSuffix = new Date().getFullYear().toString().slice(-2);
        const prefix = `${yearSuffix}4H`;
        const membersSnap = await getDocs(collection(db, "members"));
        let maxCounter = -1;
        membersSnap.forEach(d => {
           const dId = d.id;
           if (dId.startsWith(prefix)) {
              const countStr = dId.replace(prefix, '');
              const count = parseInt(countStr, 10);
              if (!isNaN(count) && count > maxCounter) {
                 maxCounter = count;
              }
           }
        });
        const nextCounter = maxCounter + 1;
        const paddedCounter = nextCounter.toString().padStart(4, '0');
        id = `${prefix}${paddedCounter}`;
        memberId = id;
      }

      let additionalFields: any = {};
      if (id) {
        const existing = items.find(i => i.id === id);
        if (existing && existing.status !== editForm.status) {
          additionalFields.statusUpdatedAt = new Date().toISOString();
        }
      } else {
        additionalFields.statusUpdatedAt = new Date().toISOString();
      }

      await setDoc(doc(db, "members", id), {
        ...editForm,
        ...additionalFields,
        id,
        memberId: memberId || id
      });
      setIsAdding(false);
      setEditForm({});
    } catch(err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "members", id));
    } catch(err) {
      console.error(err);
    }
  };

  const handleBulkRenew = async () => {
    if (selectedForRenewal.length === 0) return;
    if (!confirm(`Are you sure you want to renew ${selectedForRenewal.length} member(s)?`)) return;
    try {
      const { writeBatch } = await import("firebase/firestore");
      const batch = writeBatch(db);
      selectedForRenewal.forEach(id => {
        batch.update(doc(db, "members", id), {
          status: "Active",
          lastRenewed: new Date().toISOString()
        });
      });
      await batch.commit();
      setSelectedForRenewal([]);
      setIsRenewMode(false);
      alert(`Successfully renewed ${selectedForRenewal.length} member(s).`);
    } catch (err) {
      console.error("Bulk Renewal Error", err);
      handleFirestoreError(err, OperationType.UPDATE, "members");
    }
  };

  const handleRenew = async (item: Member) => {
    if (!confirm(`Are you sure you want to renew the membership for ${item.firstName || item.name}?`)) return;
    try {
      await updateDoc(doc(db, "members", item.id), { 
        status: "Active", 
        lastRenewed: new Date().toISOString() 
      });
    } catch(err) {
      console.error("Renewal Error", err);
      handleFirestoreError(err, OperationType.UPDATE, "members");
    }
  };

  const openForm = (item?: Member) => {
    setRegionCode("");
    setProvCode("");
    setMunCode("");
    if (item) {
      setEditForm({
        ...item,
        address: item.address || { region: "", province: "", municipality: "", barangay: "", purok: "", street: "" },
        interests: item.interests || []
      });
    } else {
      setEditForm({ 
        status: "Active", 
        registrationDate: new Date().toISOString().split('T')[0],
        address: { region: "", province: "", municipality: "", barangay: "", purok: "" },
        interests: []
      });
    }
    setIsAdding(true);
  };

  // Filter and sort
  const getEffectiveStatus = (member: Member) => {
    if (member.status === "Alumni" || member.category === "Alumni") return "Alumni";
    if (member.status === "Inactive") return "Inactive";
    if (member.status === "Not Renewed") {
      const refDateStr = (member as any).statusUpdatedAt || (member as any).lastRenewed || member.registrationDate;
      if (refDateStr) {
        const refDate = new Date(refDateStr).getTime();
        const ms6Months = 6 * 30 * 24 * 60 * 60 * 1000;
        const isStatusUpdatedAt = !!(member as any).statusUpdatedAt;
        const threshold = isStatusUpdatedAt ? ms6Months : (365 * 24 * 60 * 60 * 1000 + ms6Months);
        
        if (Date.now() - refDate > threshold) {
          return "Inactive";
        }
      }
      return "Active";
    }
    return "Active";
  };

  const filteredItems = items
    .filter(it => {
      const term = searchQuery.toLowerCase();
      const searchableStr = JSON.stringify(it).toLowerCase();
      const effStatus = getEffectiveStatus(it);
      
      return searchableStr.includes(term) &&
      (categoryFilter === "All" || it.category === categoryFilter) &&
      (genderFilter === "All" || it.sex === genderFilter || it.gender === genderFilter) &&
      (interestFilter === "All" || (it.interests && it.interests.includes(interestFilter)) || (it as any).pillar === interestFilter) &&
      (statusFilter === "All" || effStatus === statusFilter);
    })
    .sort((a,b) => {
      if (a.status === "Not Renewed" && b.status !== "Not Renewed") return 1;
      if (a.status !== "Not Renewed" && b.status === "Not Renewed") return -1;
      const nameA = a.firstName ? a.firstName : a.name || "";
      const nameB = b.firstName ? b.firstName : b.name || "";
      if (sortOrder === "asc") return nameA.localeCompare(nameB);
      return nameB.localeCompare(nameA);
    });

  const exportCSV = () => {
    if (filteredItems.length === 0) return;
    const headers = [
      "Member ID", "First Name", "Middle Name", "Last Name", "Suffix", 
      "Sex", "Civil Status", "Date of Birth", "Age", "Category", 
      "Educational Attainment", "Degree", "Region", "Province", "Municipality", "Barangay", "Street",
      "Contact Number", "Email", "Occupation", "Pillars", "Registration Date", "Status"
    ];
    
    const escapeCsv = (str: string | undefined | null) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = filteredItems.map(m => [
      m.id || "",
      m.firstName || m.name || "",
      m.middleName || "",
      m.lastName || "",
      m.suffix || "",
      m.sex || m.gender || "",
      m.civilStatus || "",
      m.birthDate || "",
      m.age?.toString() || "",
      m.category || "",
      m.highestEducationalAttainment || "",
      m.degree || "",
      m.address?.region || "",
      m.address?.province || "",
      m.address?.municipality || "",
      m.address?.barangay || "",
      m.address?.purok || m.address?.street || "",
      m.contactNumber || "",
      m.email || "",
      m.occupation || m.role || "",
      m.interests?.join(", ") || "",
      m.registrationDate || "",
      m.status || ""
    ].map(escapeCsv).join(","));

    const csvContent = [headers.map(escapeCsv).join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `4H_Members_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold font-display">Members Directory</h2>
            <p className="text-sm text-slate-500">Manage 4-H members and their info.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search members..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-4h-green)]" 
              />
            </div>
            <button 
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Sort by Name"
            >
              {sortOrder === "asc" ? <ArrowDownAZ size={20} /> : <ArrowUpZA size={20} />}
            </button>
            {isRenewMode ? (
               <>
                 <button 
                   onClick={() => {
                     const notRenewedInView = filteredItems.filter(m => m.status === "Not Renewed").map(m => m.id);
                     if (selectedForRenewal.length === notRenewedInView.length && notRenewedInView.length > 0) {
                        setSelectedForRenewal([]);
                     } else {
                        setSelectedForRenewal(notRenewedInView);
                     }
                   }}
                   className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-200 transition text-sm whitespace-nowrap"
                 >
                   <CheckSquare size={16} /> Select All Not Renewed
                 </button>
                 <button 
                   onClick={handleBulkRenew}
                   disabled={selectedForRenewal.length === 0}
                   className="bg-[var(--color-4h-green)] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition text-sm whitespace-nowrap disabled:opacity-50"
                 >
                   <RefreshCcw size={16} /> Execute Renew ({selectedForRenewal.length})
                 </button>
                 <button onClick={() => { setIsRenewMode(false); setSelectedForRenewal([]); }} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-300 transition text-sm whitespace-nowrap">
                   Cancel
                 </button>
               </>
            ) : (
               <>
                 <button onClick={() => setShowFilters(!showFilters)} className={`w-10 h-10 rounded-xl transition flex items-center justify-center shrink-0 ${showFilters ? 'bg-[var(--color-4h-green)] text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`} title="Filters">
                   <Filter size={18} />
                 </button>
                 <button onClick={() => setIsRenewMode(true)} className="w-10 h-10 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-900/60 transition shrink-0 flex items-center justify-center" title="Bulk Renew">
                   <RefreshCcw size={18} />
                 </button>
                 <button onClick={() => openForm()} className="bg-[var(--color-4h-green)] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition text-sm whitespace-nowrap shrink-0">
                   <Plus size={16} /> Add
                 </button>
                 <button onClick={exportCSV} className="w-10 h-10 bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-xl hover:opacity-90 transition shrink-0 flex items-center justify-center" title="Export CSV">
                   <Download size={18} />
                 </button>
               </>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 -mt-2">
          {STATUSES.map(stat => (
            <button
               key={`tab-${stat}`}
               onClick={() => setStatusFilter(stat)}
               className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${statusFilter === stat ? 'bg-[var(--color-4h-green)] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
               {stat} Members
            </button>
          ))}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} className="overflow-hidden">
              <div className="pt-4 flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider w-16 shrink-0">Category</div>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={`cat-${cat}`}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors ${categoryFilter === cat ? 'bg-[var(--color-4h-green)] border-[var(--color-4h-green)] text-white' : 'bg-transparent border-slate-300 dark:border-slate-700 text-slate-500 hover:border-slate-400'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider w-16 shrink-0">Gender</div>
                  <div className="flex flex-wrap gap-2">
                    {GENDERS.map(gen => (
                      <button
                        key={`gen-${gen}`}
                        onClick={() => setGenderFilter(gen)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors ${genderFilter === gen ? 'bg-blue-500 border-blue-500 text-white' : 'bg-transparent border-slate-300 dark:border-slate-700 text-slate-500 hover:border-slate-400'}`}
                      >
                        {gen}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider w-16 shrink-0">Interest</div>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map(int => (
                      <button
                        key={`int-${int}`}
                        onClick={() => setInterestFilter(int)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors ${interestFilter === int ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-transparent border-slate-300 dark:border-slate-700 text-slate-500 hover:border-slate-400'}`}
                      >
                        {int}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl overflow-hidden mb-6">
            <h3 className="font-bold mb-4 font-display text-lg">Member Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <input type="text" placeholder="First Name *" value={editForm.firstName || ""} onChange={e=>setEditForm({...editForm, firstName: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none" required />
              <input type="text" placeholder="Middle Name" value={editForm.middleName || ""} onChange={e=>setEditForm({...editForm, middleName: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none" />
              <input type="text" placeholder="Last Name *" value={editForm.lastName || ""} onChange={e=>setEditForm({...editForm, lastName: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none" required />
              <input type="text" placeholder="Suffix (Jr. Sr. I...)" value={editForm.suffix || ""} onChange={e=>setEditForm({...editForm, suffix: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
              <div className="flex flex-col md:col-span-2">
                <span className="text-xs font-bold text-slate-500 mb-1">Birth Date *</span>
                <input type="date" value={editForm.birthDate || ""} onChange={handleDOBChange} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none" required />
              </div>
              <div className="flex flex-col md:col-span-1">
                <span className="text-xs font-bold text-slate-500 mb-1">Age</span>
                <input type="number" readOnly value={editForm.age || ""} className="border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl outline-none text-slate-500" />
              </div>
              <div className="flex flex-col md:col-span-3">
                <span className="text-xs font-bold text-slate-500 mb-1">Category (Auto)</span>
                <input type="text" readOnly value={editForm.category || ""} className="border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl outline-none font-semibold text-[var(--color-4h-green)]" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-500 mb-1">Status *</span>
                <select value={editForm.status || "Active"} onChange={e=>setEditForm({...editForm, status: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none font-bold text-[var(--color-4h-green)]">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Alumni">Alumni</option>
                  <option value="Not Renewed">Not Renewed</option>
                </select>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-500 mb-1">Date Member Joined</span>
                <input type="date" value={editForm.registrationDate || ""} onChange={e=>setEditForm({...editForm, registrationDate: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-500 mb-1">Sex</span>
                <select value={editForm.sex || editForm.gender || ""} onChange={e=>setEditForm({...editForm, sex: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none">
                  <option value="">Select Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-500 mb-1">Civil Status</span>
                <select value={editForm.civilStatus || ""} onChange={e=>setEditForm({...editForm, civilStatus: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none">
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div className="flex flex-col md:col-span-2">
                <span className="text-xs font-bold text-slate-500 mb-1">Highest Educational Attainment</span>
                <input type="text" placeholder="e.g. College Graduate" value={editForm.highestEducationalAttainment || ""} onChange={e=>setEditForm({...editForm, highestEducationalAttainment: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none" />
              </div>
              <div className="flex flex-col w-full md:col-span-3">
                <span className="text-xs font-bold text-slate-500 mb-1">Degree (Write in complete)</span>
                <input type="text" placeholder="e.g. Bachelor of Science in Agriculture, Major in Crop Science" value={editForm.degree || ""} onChange={e=>setEditForm({...editForm, degree: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none w-full" />
              </div>
            </div>

            <div className="mb-4">
              <span className="text-xs font-bold text-slate-500 mb-2 block">Chapter Membership</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <select value={editForm.chapterType || ""} onChange={e => {
                  const ct = e.target.value;
                  setEditForm({...editForm, chapterType: ct, barangayChapter: (ct === "School Based") ? "" : editForm.barangayChapter, schoolChapter: (ct === "Barangay Based") ? "" : editForm.schoolChapter});
                }} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none text-sm appearance-none">
                  <option value="">Select Chapter Type</option>
                  <option value="Barangay Based">Barangay Based</option>
                  <option value="School Based">School Based</option>
                  <option value="Both">Both (Barangay & School Based)</option>
                </select>

                {(editForm.chapterType === "Barangay Based" || editForm.chapterType === "Both") && (
                  <select value={editForm.barangayChapter || ""} onChange={e=>setEditForm({...editForm, barangayChapter: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none text-sm appearance-none">
                    <option value="">Select Barangay Chapter</option>
                    {barangayChaptersList.map((ch, i) => (
                      <option key={i} value={ch.role}>{ch.role}</option>
                    ))}
                  </select>
                )}

                {(editForm.chapterType === "School Based" || editForm.chapterType === "Both") && (
                  <select value={editForm.schoolChapter || ""} onChange={e=>setEditForm({...editForm, schoolChapter: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none text-sm appearance-none">
                    <option value="">Select School Chapter</option>
                    {schoolChaptersList.map((ch, i) => (
                      <option key={i} value={ch.role}>{ch.role}</option>
                    ))}
                  </select>
                )}

                {editForm.chapterType === "Both" && (
                  <div className="md:col-span-3 mt-2">
                    <span className="text-xs font-bold text-slate-500 mb-1 block">Primary Chapter (For Record Counting)</span>
                    <select value={editForm.primaryChapterType || ""} onChange={e=>setEditForm({...editForm, primaryChapterType: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none text-sm appearance-none w-full">
                      <option value="">Select Primary Chapter Category</option>
                      <option value="Barangay Based">Barangay Based</option>
                      <option value="School Based">School Based</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <span className="text-xs font-bold text-slate-500 mb-2 block">Address</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <select value={regionCode} onChange={e => {
                  const code = e.target.value;
                  setRegionCode(code);
                  const tReg = regions.find(r=>r.code===code);
                  setEditForm({...editForm, address: {...(editForm.address || {}), region: tReg ? tReg.name : "", province: "", municipality: "", barangay: ""}});
                  setProvCode(""); setMunCode("");
                  fetch(`https://psgc.gitlab.io/api/regions/${code}/provinces/`).then(r=>r.json()).then(p => {
                    setProvinces(p);
                    if (p.length === 0 && code) {
                      fetch(`https://psgc.gitlab.io/api/regions/${code}/cities-municipalities/`).then(r=>r.json()).then(setMunicipalities);
                    } else {
                      setMunicipalities([]); setBarangays([]);
                    }
                  }).catch(() => setProvinces([]));
                }} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none text-sm appearance-none">
                  <option value="">Select Region</option>
                  {regions.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
                </select>

                <select value={provCode} onChange={e => {
                  const code = e.target.value;
                  setProvCode(code);
                  const tProv = provinces.find(p=>p.code===code);
                  setEditForm({...editForm, address: {...(editForm.address || {}), province: tProv ? tProv.name : "", municipality: "", barangay: ""}});
                  setMunCode(""); setBarangays([]);
                  if(code) {
                    fetch(`https://psgc.gitlab.io/api/provinces/${code}/cities-municipalities/`).then(r=>r.json()).then(setMunicipalities).catch(()=>setMunicipalities([]));
                  }
                }} disabled={provinces.length === 0 && regionCode !== ""} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none text-sm appearance-none disabled:opacity-50">
                  <option value="">Select Province</option>
                  {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                </select>

                <select value={munCode} onChange={e => {
                  const code = e.target.value;
                  setMunCode(code);
                  const tMun = municipalities.find(m=>m.code===code);
                  setEditForm({...editForm, address: {...(editForm.address || {}), municipality: tMun ? tMun.name : "", barangay: ""}});
                  if(code) {
                    fetch(`https://psgc.gitlab.io/api/cities-municipalities/${code}/barangays/`).then(r=>r.json()).then(setBarangays).catch(()=>setBarangays([]));
                  }
                }} disabled={municipalities.length === 0} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none text-sm appearance-none disabled:opacity-50">
                  <option value="">Select Municipality</option>
                  {municipalities.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
                </select>

                <select value={editForm.address?.barangay || ""} onChange={e => setEditForm({...editForm, address: {...(editForm.address || {}), barangay: e.target.value}})} disabled={barangays.length === 0} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none text-sm appearance-none disabled:opacity-50">
                  <option value="">Select Barangay</option>
                  {barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                </select>

                <input type="text" placeholder="Street / Purok" value={editForm.address?.purok || ""} onChange={e=>setEditForm({...editForm, address: {...(editForm.address || {}), purok: e.target.value}})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-500 mb-1">Contact Number</span>
                <input type="tel" placeholder="09xxxxxxxxx" value={editForm.contactNumber || ""} onChange={e=>setEditForm({...editForm, contactNumber: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-500 mb-1">Email Address</span>
                <input type="email" placeholder="juan@example.com" value={editForm.email || ""} onChange={e=>setEditForm({...editForm, email: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-500 mb-1">Occupation / Position / Designation</span>
                <input type="text" placeholder="For a student, just write 'student'" value={editForm.occupation || ""} onChange={e=>setEditForm({...editForm, occupation: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none" />
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-500 block">Interests & Pillars</span>
              <div className="flex flex-wrap gap-2">
                {PILLARS.map(pillar => {
                  const isSelected = editForm.interests?.includes(pillar);
                  return (
                    <button 
                      key={pillar}
                      type="button"
                      onClick={() => toggleInterest(pillar)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border ${isSelected ? 'bg-[var(--color-4h-green)] border-[var(--color-4h-green)] text-white' : 'bg-transparent border-slate-300 dark:border-slate-700 text-slate-500 hover:border-slate-400'}`}
                    >
                      {pillar}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex flex-col gap-1 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                <span className="text-xs font-bold mb-1">Profile Picture (Optional)</span>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "picture")} className="text-xs text-slate-500 cursor-pointer w-full" />
                {editForm.picture && <a href={editForm.picture} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1">View Image</a>}
              </div>
              <div className="flex flex-col gap-1 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                <span className="text-xs font-bold mb-1">Data Privacy Form</span>
                <input type="file" accept="image/*,.pdf" onChange={(e) => handleImageUpload(e, "dataPrivacyUrl")} className="text-xs text-slate-500 cursor-pointer w-full" />
                {editForm.dataPrivacyUrl && <a href={editForm.dataPrivacyUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1">View Form</a>}
              </div>
              {(editForm.age !== undefined && editForm.age < 18) && (
                <div className="flex flex-col gap-1 border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-500 mb-1">Guardian Consent (&lt;18)</span>
                  <input type="file" accept="image/*,.pdf" onChange={(e) => handleImageUpload(e, "guardianConsentUrl")} className="text-xs text-slate-500 cursor-pointer w-full" />
                  {editForm.guardianConsentUrl && <a href={editForm.guardianConsentUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1">View Consent</a>}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button type="button" onClick={() => { setIsAdding(false); setEditForm({}); }} className="px-6 py-2 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer">Cancel</button>
              <button disabled={isUploading} onClick={handleSave} className="bg-[var(--color-4h-green)] text-white px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50">
                {isUploading ? "Uploading..." : <><Save size={16} /> Save Member</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {filteredItems.map(item => (
          <div key={item.id} className="p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 flex justify-between items-start hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
            <div className="flex items-center gap-4">
              {item.picture ? (
                <img src={item.picture} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                  <Users size={20} />
                </div>
              )}
              <div>
                <div className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <span className="font-mono text-slate-400 text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{item.id}</span>
                  {item.firstName ? `${item.firstName} ${item.middleName ? item.middleName[0] + '.' : ''} ${item.lastName} ${item.suffix || ''}` : item.name} 
                  {item.category && <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] font-bold uppercase">{item.category}</span>}
                  {item.status && <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.status}</span>}
                </div>
                <div className="text-sm text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                  {item.age !== undefined && <span>{item.age} yrs</span>}
                  {(item.sex || item.gender) && <span>• {item.sex || item.gender}</span>}
                  {item.civilStatus && <span>• {item.civilStatus}</span>}
                  {item.address?.municipality && <span>• {item.address.municipality}</span>}
                  {item.contactNumber && <span>• {item.contactNumber}</span>}
                  {(item.occupation) && <span>• {item.occupation}</span>}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {item.degree || item.highestEducationalAttainment}
                </div>
                {item.interests && item.interests.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {item.interests.map((int: string) => <span key={int} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{int}</span>)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {isRenewMode ? (
                 item.status === "Not Renewed" ? (
                   <button
                     onClick={() => {
                        if (selectedForRenewal.includes(item.id)) {
                           setSelectedForRenewal(selectedForRenewal.filter(id => id !== item.id));
                        } else {
                           setSelectedForRenewal([...selectedForRenewal, item.id]);
                        }
                     }}
                     className={`p-2 rounded-lg transition-colors border ${selectedForRenewal.includes(item.id) ? 'bg-[var(--color-4h-green)] border-[var(--color-4h-green)] text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-transparent'}`}
                   >
                     <CheckSquare size={20} className={selectedForRenewal.includes(item.id) ? 'opacity-100' : 'opacity-0'} />
                   </button>
                 ) : (
                   <span className="text-xs text-slate-400 font-bold px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg">Up to date</span>
                 )
              ) : (
                 <>
                   <button onClick={() => setDocsFor(item)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors" title="Documents"><Folder size={16} /></button>
                   <button onClick={() => { recordDocumentAccess(item.id); setViewDetailsFor(item); }} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors" title="View Details"><Eye size={16} /></button>
                   <button onClick={() => openForm(item)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors" title="Edit Member"><Edit2 size={16} /></button>
                   <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors" title="Delete Member"><Trash2 size={16} /></button>
                 </>
              )}
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && <div className="p-12 text-center text-slate-500">No members found matching your search.</div>}
      </div>

      <AnimatePresence>
        {viewDetailsFor && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto hidden-scrollbar relative">
              <div className="sticky top-0 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center z-10">
                <h3 className="font-bold font-display text-2xl tracking-tight">Member Details</h3>
                <button onClick={() => setViewDetailsFor(null)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-6">
                  {viewDetailsFor.picture ? (
                    <img src={viewDetailsFor.picture} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-[var(--color-4h-green)]" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <Users size={32} />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-mono text-slate-500 mb-1">ID: {viewDetailsFor.id}</div>
                    <h2 className="text-2xl font-bold">{viewDetailsFor.firstName} {viewDetailsFor.middleName} {viewDetailsFor.lastName} {viewDetailsFor.suffix}</h2>
                    <div className="text-slate-500">{viewDetailsFor.category || viewDetailsFor.status}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Registration Date</p>
                    <p className="font-medium">{viewDetailsFor.registrationDate || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Date of Birth</p>
                    <p className="font-medium">{viewDetailsFor.birthDate || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Age</p>
                    <p className="font-medium">{viewDetailsFor.age || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Sex</p>
                    <p className="font-medium">{viewDetailsFor.sex || viewDetailsFor.gender || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Civil Status</p>
                    <p className="font-medium">{viewDetailsFor.civilStatus || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Education</p>
                    <p className="font-medium">{viewDetailsFor.highestEducationalAttainment || '-'}</p>
                    {viewDetailsFor.degree && <p className="font-medium text-sm text-slate-500">{viewDetailsFor.degree}</p>}
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs font-bold text-slate-500 uppercase">Address</p>
                    <p className="font-medium">{[viewDetailsFor.address?.purok || viewDetailsFor.address?.street, viewDetailsFor.address?.barangay, viewDetailsFor.address?.municipality, viewDetailsFor.address?.province, viewDetailsFor.address?.region].filter(Boolean).join(", ")}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs font-bold text-slate-500 uppercase">Chapter Membership</p>
                    <div className="font-medium flex items-center gap-2">
                      {viewDetailsFor.chapterType || "Unspecified"}
                      {viewDetailsFor.chapterType === "Both" && viewDetailsFor.primaryChapterType && (
                         <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs font-bold uppercase tracking-wider">{viewDetailsFor.primaryChapterType} (Primary)</span>
                      )}
                    </div>
                    {viewDetailsFor.barangayChapter && <p className="text-sm font-medium text-slate-500 mt-1 flex gap-2"><span className="text-slate-400">Barangay:</span> {viewDetailsFor.barangayChapter}</p>}
                    {viewDetailsFor.schoolChapter && <p className="text-sm font-medium text-slate-500 flex gap-2"><span className="text-slate-400">School:</span> {viewDetailsFor.schoolChapter}</p>}
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Contact</p>
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Number</span>
                        <p className="font-medium">{viewDetailsFor.contactNumber || '-'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Email</span>
                        <p className="font-medium text-[var(--color-4h-green)] break-all">{viewDetailsFor.email || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-bold text-slate-500 uppercase">Occupation</p>
                    <p className="font-medium">{viewDetailsFor.occupation || '-'}</p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-xs font-bold text-slate-500 uppercase">Pillars/Interests</p>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {viewDetailsFor.interests?.map(i => <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">{i}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {docsFor && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col relative overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#111] z-10 shrink-0">
                <div>
                  <h3 className="font-bold font-display text-xl tracking-tight">Documents</h3>
                  <p className="text-sm text-slate-500">{docsFor.firstName} {docsFor.lastName}</p>
                </div>
                <button onClick={() => setDocsFor(null)} className="p-2 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 rounded-full"><X size={20} /></button>
              </div>
              <div className="p-6 overflow-y-auto hidden-scrollbar grow flex flex-col gap-4">
                {(!docsFor.documents || docsFor.documents.length === 0) && !docsFor.dataPrivacyUrl && !docsFor.guardianConsentUrl ? (
                  <div className="text-center py-12 text-slate-500">
                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                    No documents uploaded.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {docsFor.dataPrivacyUrl && (
                      <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] rounded-lg shrink-0">
                            <FileText size={20} />
                          </div>
                          <a href={docsFor.dataPrivacyUrl} target="_blank" rel="noreferrer" className="font-medium truncate hover:underline hover:text-[var(--color-4h-green)] transition-colors">Data Privacy Form</a>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <a href={docsFor.dataPrivacyUrl} target="_blank" rel="noreferrer" className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Preview / Download"><Eye size={16} /></a>
                        </div>
                      </div>
                    )}
                    {docsFor.guardianConsentUrl && (
                      <div className="flex items-center justify-between p-4 border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/10 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
                            <FileText size={20} />
                          </div>
                          <a href={docsFor.guardianConsentUrl} target="_blank" rel="noreferrer" className="font-medium text-amber-900 dark:text-amber-100 truncate hover:underline transition-colors">Guardian Consent</a>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <a href={docsFor.guardianConsentUrl} target="_blank" rel="noreferrer" className="p-2 text-amber-700 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-lg transition-colors" title="Preview / Download"><Eye size={16} /></a>
                        </div>
                      </div>
                    )}
                    {docsFor.documents?.map((docItem, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] rounded-lg shrink-0">
                            <FileText size={20} />
                          </div>
                          <a href={docItem.url} target="_blank" rel="noreferrer" className="font-medium truncate hover:underline hover:text-[var(--color-4h-green)] transition-colors">{docItem.name}</a>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <a href={docItem.url} target="_blank" rel="noreferrer" className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors" title="Preview / Download"><Eye size={16} /></a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                <label className={`w-full flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  {isUploading ? <Activity className="animate-spin" size={20} /> : <UploadCloud size={20} />}
                  <span>{isUploading ? 'Uploading...' : 'Upload Document'}</span>
                  <input type="file" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if(!file) return;
                    setIsUploading(true);
                    try {
                      const fileRef = ref(storage, `members/${docsFor.id}/docs/${Date.now()}_${file.name}`);
                      await uploadBytes(fileRef, file);
                      const url = await getDownloadURL(fileRef);
                      const updatedDocs = [...(docsFor.documents || []), { name: file.name, url }];
                      await setDoc(doc(db, "members", docsFor.id), { documents: updatedDocs }, { merge: true });
                      setDocsFor({ ...docsFor, documents: updatedDocs });
                    } catch(err) {
                      console.error("Upload error", err);
                      alert("Upload failed.");
                    } finally {
                      setIsUploading(false);
                    }
                  }} />
                </label>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type AttendanceStatus = "Present" | "Late" | "Excuse" | "Absent";

type AttendanceRecord = {
  memberId: string;
  name: string;
  status: AttendanceStatus;
  role?: string;
};

type Minutes = { 
  id: string; 
  title: string; 
  date: string; 
  timeStart?: string;
  timeDone?: string;
  type?: string; 
  attendance?: AttendanceRecord[]; 
  content?: string; 
  fileUrl?: string; 
  fileName?: string;
  attendees?: string;
  images?: string[];
};

function MinutesTab() {
  const [items, setItems] = useState<Minutes[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Minutes>>({});
  
  const [members, setMembers] = useState<any[]>([]);
  const [council, setCouncil] = useState<any[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [activeFolder, setActiveFolder] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewDetailsFor, setViewDetailsFor] = useState<Minutes | null>(null);

  const formatNiceDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => {
    if (isAdding) {
      document.getElementById('dashboard-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isAdding]);

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "minutes"), snap => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Minutes[];
      docs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItems(docs);
    }, err => handleFirestoreError(err, OperationType.GET, "minutes"));
    
    const unsub2 = onSnapshot(collection(db, "members"), snap => {
      setMembers(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
    const unsub3 = onSnapshot(collection(db, "council"), snap => {
      setCouncil(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
    
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const handleSave = async () => {
    try {
      const id = editForm.id || "min_" + Date.now();
      
      let attendeesCountStr = editForm.attendees || '';
      if (editForm.attendance && editForm.attendance.length > 0) {
        const count = editForm.attendance.filter(a => a.status === "Present" || a.status === "Late").length;
        attendeesCountStr = count.toString();
      }
      
      await setDoc(doc(db, "minutes", id), {
        ...editForm,
        id,
        attendees: attendeesCountStr
      }, {merge: true});
      setIsAdding(false);
      setEditForm({});
    } catch(err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "minutes", id));
    } catch(err) {
      console.error(err);
    }
  };

  const getAttendanceList = () => {
    let list: any[] = [];
    if (editForm.type === "General Assembly Meeting") {
      const cList = council.map(c => ({ id: c.id, name: c.name || `${c.firstName} ${c.lastName}`, role: c.role || c.type || 'Council' }));
      const mList = members.map(m => ({ id: m.id, name: m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim(), role: 'Member' }));
      const combined = [...cList, ...mList];
      const seen = new Set();
      list = combined.filter(item => {
        if (!item.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    } else if (editForm.type === "Regular Meeting") {
      list = council.filter(c => c.type === "Executive Board").map(c => ({ id: c.id, name: c.name || `${c.firstName} ${c.lastName}`, role: c.role || c.type || 'Council' }));
    } else if (editForm.type === "Merge Meeting") {
      // Merge meeting has Executive Board and Chapter Presidents (Barangay/School Based)
      list = council.filter(c => c.type === "Executive Board" || c.type === "Barangay Based" || c.type === "School Based").map(c => ({ id: c.id, name: c.name || `${c.firstName} ${c.lastName}`, role: c.role || c.type || 'Council' }));
    } else {
      list = council.map(c => ({ id: c.id, name: c.name || `${c.firstName} ${c.lastName}`, role: c.role || c.type || 'Council' }));
    }
    return list;
  };

  const handleAttendanceChange = (memberId: string, name: string, role: string, status: AttendanceStatus) => {
    const current = [...(editForm.attendance || [])];
    const index = current.findIndex(a => a.memberId === memberId);
    if (index >= 0) {
      current[index] = { memberId, name, status, role };
    } else {
      current.push({ memberId, name, status, role });
    }
    setEditForm({ ...editForm, attendance: current });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fileRef = ref(storage, `minutes/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setEditForm({ ...editForm, fileUrl: url, fileName: file.name });
    } catch(err) {
       console.error("Upload error", err);
       alert("Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const validFiles = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 1024 * 1024) {
        alert(`File ${files[i].name} is over 1MB limit and will not be uploaded.`);
      } else {
        validFiles.push(files[i]);
      }
    }
    
    if (validFiles.length === 0) return;

    setIsUploading(true);
    try {
      const newImages = [...(editForm.images || [])];
      for (let i = 0; i < validFiles.length; i++) {
        const fileRef = ref(storage, `minutes_images/${Date.now()}_${validFiles[i].name}`);
        await uploadBytes(fileRef, validFiles[i]);
        const url = await getDownloadURL(fileRef);
        newImages.push(url);
      }
      setEditForm({ ...editForm, images: newImages });
    } catch(err) {
       console.error("Upload error", err);
       alert("Failed to upload images.");
    } finally {
      setIsUploading(false);
    }
  };

  // Utility to handle contenteditable
  const execCmd = (e: React.MouseEvent, command: string, value?: string) => {
    e.preventDefault();
    document.execCommand(command, false, value);
  };

  const meetingFolders = ["All", "Regular Meeting", "Emergency Meeting", "Merge Meeting", "General Assembly Meeting"];

  const filteredItems = items.filter(item => {
    if (activeFolder !== "All" && item.type !== activeFolder) return false;
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      const searchableStr = JSON.stringify(item).toLowerCase();
      if (!searchableStr.includes(term)) return false;
    }
    return true;
  });

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold font-display">Meeting Minutes</h2>
          <p className="text-sm text-slate-500">Record minutes, upload documents, and track attendance.</p>
        </div>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full sm:w-48 pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#111] outline-none text-sm" />
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-[#111] shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-[#111] shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>

          <button onClick={() => { setEditForm({ date: new Date().toISOString().split('T')[0], type: "Regular Meeting" }); setIsAdding(true); }} className="bg-[var(--color-4h-green)] text-white px-4 py-2 rounded-xl font-bold flex items-center shrink-0 gap-2 hover:opacity-90 transition text-sm">
            <Plus size={16} /> New <span className="hidden sm:inline">Record</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 hidden-scrollbar">
        {meetingFolders.map(folder => (
          <button
            key={folder}
            onClick={() => setActiveFolder(folder)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${activeFolder === folder ? 'bg-[var(--color-4h-green)] border-[var(--color-4h-green)] text-white' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400'}`}
          >
            {folder}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl overflow-hidden mb-6">
            <div className="grid gap-4 mb-4">
              <input type="text" placeholder="Meeting Title / Agenda" value={editForm.title || ""} onChange={e=>setEditForm({...editForm, title: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input type="date" placeholder="Date" value={editForm.date || ""} onChange={e=>setEditForm({...editForm, date: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none" />
                <input type="time" placeholder="Time Start" value={editForm.timeStart || ""} onChange={e=>setEditForm({...editForm, timeStart: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none" />
                <input type="time" placeholder="Time Done" value={editForm.timeDone || ""} onChange={e=>setEditForm({...editForm, timeDone: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none" />
                <select value={editForm.type || "Regular Meeting"} onChange={e=>setEditForm({...editForm, type: e.target.value, attendance: []})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none">
                  <option value="Regular Meeting">Regular Meeting</option>
                  <option value="General Assembly Meeting">General Assembly Meeting</option>
                  <option value="Merge Meeting">Merge Meeting</option>
                  <option value="Emergency Meeting">Emergency Meeting</option>
                </select>
              </div>

              <div className="mt-4">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Attendance</label>
                <div className="max-h-48 overflow-y-auto bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-3 hidden-scrollbar">
                  {getAttendanceList().length === 0 ? <p className="text-slate-500 text-sm italic">No participants found.</p> : null}
                  {getAttendanceList().map(p => {
                    const status = editForm.attendance?.find(a => a.memberId === p.id)?.status;
                    return (
                      <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 pl-1">
                        <div>
                          <span className="font-medium text-sm truncate block">{p.name || 'Unknown'}</span>
                          <span className="text-[10px] text-slate-500 uppercase font-bold">{p.role}</span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => handleAttendanceChange(p.id, p.name, p.role, "Present")} className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md transition-colors ${status === "Present" ? "bg-green-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-green-100 hover:text-green-600"}`}>Present</button>
                          <button onClick={() => handleAttendanceChange(p.id, p.name, p.role, "Late")} className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md transition-colors ${status === "Late" ? "bg-amber-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-amber-100 hover:text-amber-600"}`}>Late</button>
                          <button onClick={() => handleAttendanceChange(p.id, p.name, p.role, "Excuse")} className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md transition-colors ${status === "Excuse" ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-blue-100 hover:text-blue-600"}`}>Excuse</button>
                          <button onClick={() => handleAttendanceChange(p.id, p.name, p.role, "Absent")} className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md transition-colors ${status === "Absent" ? "bg-red-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-red-100 hover:text-red-600"}`}>Absent</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4">
                 <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Meeting Details / Upload</label>
                 
                 <div className="flex flex-col sm:flex-row gap-4 mb-4">
                   <label className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0">
                      {isUploading ? <Activity className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                      <span className="text-sm font-bold">{isUploading ? 'Uploading...' : 'Upload Document'}</span>
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                   </label>
                   {editForm.fileName && (
                     <div className="flex items-center justify-between bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] px-4 py-2 rounded-xl text-sm font-medium w-full">
                       <div className="flex items-center gap-2 truncate">
                         <FileText size={16} className="shrink-0" />
                         <span className="truncate">{editForm.fileName}</span>
                       </div>
                       <button onClick={() => setEditForm({...editForm, fileUrl: '', fileName: ''})} className="ml-2 text-slate-500 hover:text-red-500 p-1 shrink-0"><X size={14} /></button>
                     </div>
                   )}
                 </div>

                 <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#111] focus-within:ring-2 ring-[var(--color-4h-green)] group">
                    <div className="flex gap-1 p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-x-auto hidden-scrollbar">
                      <button onPointerDown={(e) => execCmd(e, 'bold')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300" title="Bold"><Bold size={16}/></button>
                      <button onPointerDown={(e) => execCmd(e, 'italic')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300" title="Italic"><Italic size={16}/></button>
                      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 my-auto mx-1" />
                      <button onPointerDown={(e) => execCmd(e, 'insertUnorderedList')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300" title="Bullet List"><List size={16}/></button>
                      <button onPointerDown={(e) => execCmd(e, 'insertOrderedList')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300" title="Numbered List"><ListOrdered size={16}/></button>
                      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 my-auto mx-1" />
                      <button onPointerDown={(e) => { 
                         e.preventDefault(); 
                         const selection = window.getSelection();
                         if(selection && !selection.isCollapsed) {
                           const text = selection.toString();
                           document.execCommand('insertText', false, text.toUpperCase());
                         }
                      }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded font-bold text-slate-700 dark:text-slate-300" title="Capitalize"><Type size={16}/></button>
                    </div>
                    <div 
                      contentEditable
                      className="p-4 min-h-[150px] outline-none text-sm rich-text-editor"
                      dangerouslySetInnerHTML={{ __html: editForm.content || "" }}
                      onBlur={(e) => setEditForm({...editForm, content: e.currentTarget.innerHTML})}
                    />
                 </div>
                 
                 <div className="mt-4">
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Meeting Pictures</label>
                   <div className="flex flex-wrap gap-2 mb-2">
                     {editForm.images?.map((url, idx) => (
                       <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 group">
                         <img src={url} alt="" className="w-full h-full object-cover" />
                         <button onClick={() => setEditForm({...editForm, images: editForm.images?.filter((_, i) => i !== idx)})} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                       </div>
                     ))}
                     <label className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                        <ImageIcon size={20} />
                        <span className="text-[10px] mt-1">Add</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                     </label>
                   </div>
                 </div>
              </div>

            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => { setIsAdding(false); setEditForm({}); }} className="px-6 py-2 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer">Cancel</button>
              <button disabled={isUploading} onClick={handleSave} className="bg-[var(--color-4h-green)] text-white px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"><Save size={16} /> Save</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div key={item.id} onClick={() => { recordDocumentAccess(item.id); setViewDetailsFor(item); }} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#111] hover:border-slate-300 dark:hover:border-slate-700 transition-all group relative flex flex-col cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <div className="pr-10">
                  <div className="flex items-center gap-2 mb-2">
                    {item.type && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md">{item.type}</span>}
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-1">{item.title}</h3>
                  <div className="text-sm text-slate-500 font-mono flex flex-col gap-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar size={12}/> {formatNiceDate(item.date)}
                      {item.timeStart && item.timeDone ? ` • ${item.timeStart} - ${item.timeDone}` : item.timeStart ? ` • ${item.timeStart}` : ''}
                    </span>
                    {item.attendees && <span className="flex items-center gap-1"><Users size={12}/> {item.attendees} present attendees</span>}
                  </div>
                </div>
              </div>
              
              <div className="absolute top-4 right-4 flex gap-1">
                <button className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300" title="View Details"><Eye size={16} /></button>
              </div>
              
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); setEditForm(item); setIsAdding(true); }} className="text-xs font-bold text-slate-500 hover:text-[var(--color-4h-green)] flex items-center gap-1 p-2 -ml-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50"><Edit2 size={12} /> Edit</button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="text-xs font-bold text-slate-500 hover:text-red-500 flex items-center gap-1 p-2 -mr-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={12} /> Delete</button>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && <div className="col-span-full p-8 text-center text-slate-500">No meeting minutes found.</div>}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {filteredItems.map(item => (
            <div key={item.id} onClick={() => { recordDocumentAccess(item.id); setViewDetailsFor(item); }} className="p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] rounded-xl flex items-center justify-center shrink-0">
                  <Calendar size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{item.title}</h3>
                    {item.type && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md">{item.type}</span>}
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={12}/> {formatNiceDate(item.date)}
                      {item.timeStart && item.timeDone ? ` • ${item.timeStart} - ${item.timeDone}` : item.timeStart ? ` • ${item.timeStart}` : ''}
                    </span>
                    {item.attendees && <span className="flex items-center gap-1"><Users size={12}/> {item.attendees} attendees</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300" title="View Details"><Eye size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); setEditForm(item); setIsAdding(true); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500" title="Edit"><Edit2 size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500" title="Delete"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && <div className="p-8 text-center text-slate-500">No meeting minutes found.</div>}
        </div>
      )}

      <AnimatePresence>
        {viewDetailsFor && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex-none bg-white/80 dark:bg-[#111]/80 backdrop-blur-md p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center z-10">
                <div>
                  <h3 className="font-bold font-display text-2xl tracking-tight">{viewDetailsFor.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={14}/> {formatNiceDate(viewDetailsFor.date)}
                      {viewDetailsFor.timeStart && viewDetailsFor.timeDone ? ` • ${viewDetailsFor.timeStart} - ${viewDetailsFor.timeDone}` : viewDetailsFor.timeStart ? ` • ${viewDetailsFor.timeStart}` : ''}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-bold uppercase tracking-wider">{viewDetailsFor.type}</span>
                  </div>
                </div>
                <button onClick={() => setViewDetailsFor(null)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
              </div>
              
              <div className="flex-grow overflow-y-auto hidden-scrollbar p-6 space-y-6">
                
                {viewDetailsFor.attendance && viewDetailsFor.attendance.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">Attendance</h4>
                    <div className="flex flex-wrap gap-2">
                       {viewDetailsFor.attendance.map(a => (
                         <span key={a.memberId} className={`px-2 py-1 border rounded-md text-[10px] font-bold uppercase tracking-wider ${
                           a.status === 'Present' ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-500' :
                           a.status === 'Late' ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-500' :
                           a.status === 'Excuse' ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-500' :
                           'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-500'
                         }`}>
                           {a.name} ({a.status.charAt(0)})
                         </span>
                       ))}
                    </div>
                  </div>
                )}
                
                {viewDetailsFor.content && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">Details</h4>
                    <div className="text-sm text-slate-800 dark:text-slate-300 bg-white dark:bg-[#111] p-4 border border-slate-200 dark:border-slate-800 rounded-xl rich-text-editor ql-editor" dangerouslySetInnerHTML={{ __html: viewDetailsFor.content }} />
                  </div>
                )}

                {viewDetailsFor.images && viewDetailsFor.images.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">Pictures</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {viewDetailsFor.images.map((img, idx) => (
                        <a key={idx} href={img} target="_blank" rel="noreferrer" className="aspect-square rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:opacity-90 transition-opacity">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                {viewDetailsFor.fileUrl && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">Documents</h4>
                    <a href={viewDetailsFor.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] px-4 py-3 rounded-xl text-sm font-bold w-fit hover:bg-[var(--color-4h-green)] hover:text-white transition-colors">
                       <FileText size={18} />
                       {viewDetailsFor.fileName || 'View Attached Document'}
                    </a>
                  </div>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type Memo = { id: string; title: string; date: string; content: string; status: string; };

function MemosTab() {
  const [items, setItems] = useState<Memo[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Memo>>({});

  useEffect(() => {
    if (isAdding) {
      document.getElementById('dashboard-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isAdding]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "memos"), snap => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Memo[];
      docs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItems(docs);
    }, err => handleFirestoreError(err, OperationType.GET, "memos"));
    return unsub;
  }, []);

  const handleSave = async () => {
    try {
      const id = editForm.id || "memo_" + Date.now();
      await setDoc(doc(db, "memos", id), {
        ...editForm,
        id
      });
      setIsAdding(false);
      setEditForm({});
    } catch(err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "memos", id));
    } catch(err) {
      console.error(err);
    }
  };

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold font-display">Internal Documents</h2>
          <p className="text-sm text-slate-500">Manage internal memorandums.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-[#111] shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="List View"
            >
              <List size={18} />
            </button>
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-[#111] shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <button onClick={() => { setEditForm({ date: new Date().toISOString().split('T')[0], status: 'Draft' }); setIsAdding(true); }} className="bg-[var(--color-4h-green)] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition text-sm grow sm:grow-0 justify-center">
            <Plus size={16} /> New Memo
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl overflow-hidden">
            <div className="grid gap-4 mb-4">
              <input type="text" placeholder="Memo Title" value={editForm.title || ""} onChange={e=>setEditForm({...editForm, title: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={editForm.date || ""} onChange={e=>setEditForm({...editForm, date: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none" />
                <select value={editForm.status || "Draft"} onChange={e=>setEditForm({...editForm, status: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none">
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>
              <textarea placeholder="Memo content..." value={editForm.content || ""} onChange={e=>setEditForm({...editForm, content: e.target.value})} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] p-3 rounded-xl outline-none h-32 resize-none" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setIsAdding(false); setEditForm({}); }} className="px-6 py-2 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={handleSave} className="bg-[var(--color-4h-green)] text-white px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2"><Save size={16} /> Save</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} onClick={() => recordDocumentAccess(item.id)} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#111] hover:border-slate-300 dark:hover:border-slate-700 transition-all group relative flex flex-col h-full cursor-pointer">
              <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl font-bold text-[10px] uppercase tracking-wider ${item.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{item.status}</div>
              
              <div className="flex justify-between items-start mb-2 pr-20">
                <div>
                  <h3 className="font-bold text-lg leading-tight">{item.title}</h3>
                  <div className="text-sm text-slate-500 font-mono mt-1">{item.date}</div>
                </div>
              </div>
              {item.content && <div className="text-sm text-slate-600 dark:text-slate-400 mt-3 whitespace-pre-wrap leading-relaxed line-clamp-4">{item.content}</div>}
              
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditForm(item); setIsAdding(true); }} className="text-xs font-bold text-slate-500 hover:text-[var(--color-4h-green)] flex items-center gap-1"><Edit2 size={12} /> Edit</button>
                <button onClick={() => handleDelete(item.id)} className="text-xs font-bold text-slate-500 hover:text-red-500 flex items-center gap-1"><Trash2 size={12} /> Delete</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="col-span-full p-8 text-center text-slate-500">No memos found.</div>}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} onClick={() => recordDocumentAccess(item.id)} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-[#151515] transition-colors group relative overflow-hidden bg-white dark:bg-[#111] cursor-pointer">
              <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl font-bold text-[10px] uppercase tracking-wider ${item.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{item.status}</div>
              
              <div className="flex justify-between items-start mb-2 pr-20">
                <div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <div className="text-sm text-slate-500 font-mono mt-1">{item.date}</div>
                </div>
              </div>
              {item.content && <div className="text-sm text-slate-600 dark:text-slate-400 mt-3 whitespace-pre-wrap leading-relaxed">{item.content}</div>}
              
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <button onClick={() => { setEditForm(item); setIsAdding(true); }} className="py-1 px-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 font-medium text-sm flex items-center gap-2"><Edit2 size={14} /> Edit</button>
                <button onClick={() => handleDelete(item.id)} className="py-1 px-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg font-medium text-sm flex items-center gap-2"><Trash2 size={14} /> Delete</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="p-8 text-center text-slate-500">No memos found.</div>}
        </div>
      )}
    </div>
  );
}
