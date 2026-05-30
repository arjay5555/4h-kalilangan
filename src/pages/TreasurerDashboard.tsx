import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogIn, LogOut, Activity, Menu, ChevronLeft, LayoutDashboard, TrendingUp, TrendingDown, DollarSign, CheckSquare, Check, X, Bell, FileText } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { signOut, User } from "firebase/auth";
import { 
  collection, 
  onSnapshot,
  doc,
  setDoc
} from "firebase/firestore";
import { LedgerDashboardTab, LedgerItem, DocumentsTab } from "./Dashboard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function TreasurerOverview() {
  const [items, setItems] = useState<LedgerItem[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "transparency"), snap => {
      const arr: LedgerItem[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as LedgerItem));
      // Sort by date desc initially
      arr.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItems(arr);
    }, err => handleFirestoreError(err, OperationType.GET, "transparency"));
    return () => unsub();
  }, []);

  const totalCashIn = items.filter(it => it.amount > 0).reduce((acc, it) => acc + it.amount, 0);
  const totalCashOut = items.filter(it => it.amount < 0).reduce((acc, it) => acc + Math.abs(it.amount), 0);
  const balance = totalCashIn - totalCashOut;

  // Let's create an overview per category
  const categoriesMap = items.reduce((acc, item) => {
     const cat = item.category || "Uncategorized";
     if(!acc[cat]) acc[cat] = 0;
     acc[cat] += item.amount;
     return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(categoriesMap).map(key => ({
    name: key,
    value: Math.abs(categoriesMap[key])
  })).filter(x => x.value > 0);

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#6366F1'];

  // Prepare data for line chart (running balance or cash in/out over time)
  // Let's group by month/year
  const monthlyDataMap = items.reduce((acc, item) => {
    const d = new Date(item.date);
    if(isNaN(d.getTime())) return acc;
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if(!acc[key]) acc[key] = { name: key, in: 0, out: 0, net: 0 };
    if(item.amount > 0) acc[key].in += item.amount;
    else acc[key].out += Math.abs(item.amount);
    acc[key].net = acc[key].in - acc[key].out;
    return acc;
  }, {} as Record<string, {name: string, in: number, out: number, net: number}>);

  const monthlyData = Object.values(monthlyDataMap).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
               <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Cash In</div>
               <div className="text-3xl font-display font-bold text-[var(--color-4h-green)]">₱{totalCashIn.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] rounded-full">
               <TrendingUp size={24} />
            </div>
         </div>
         <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
               <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Cash Out</div>
               <div className="text-3xl font-display font-bold text-red-500">₱{totalCashOut.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-red-500/10 text-red-500 rounded-full">
               <TrendingDown size={24} />
            </div>
         </div>
         <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
            <div>
               <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Net Balance</div>
               <div className="text-3xl font-display font-bold text-slate-900 dark:text-white">₱{balance.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
               <DollarSign size={24} />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
            <h3 className="font-bold text-lg mb-6">Cash Flow Over Time</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dx={-10} tickFormatter={(v) => `₱${v/1000}k`} />
                  <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                     formatter={(value: number) => [`₱${value.toLocaleString()}`, '']}
                  />
                  <Area type="monotone" dataKey="in" name="Cash In" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
                  <Area type="monotone" dataKey="out" name="Cash Out" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>
         <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col">
            <h3 className="font-bold text-lg mb-2">Category Breakdown</h3>
            <div className="flex-1 flex items-center justify-center min-h-[250px]">
               {pieData.length > 0 ? (
                 <ResponsiveContainer width="100%" height={250}>
                   <PieChart>
                     <Pie
                       data={pieData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                     >
                       {pieData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip formatter={(value: number) => `₱${value.toLocaleString()}`} />
                   </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="text-slate-400 text-sm">No categorical data available</div>
               )}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {pieData.slice(0, 4).map((entry, index) => (
                 <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="truncate text-slate-600 dark:text-slate-300" title={entry.name}>{entry.name}</span>
                 </div>
              ))}
            </div>
         </div>
      </div>
    </div>
  );
}

function ApprovalsTab() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "shop_discounts"), snap => {
      if (snap.exists()) {
        setSettings(snap.data());
      }
      setLoading(false);
    }, err => handleFirestoreError(err, OperationType.GET, "settings"));
    return unsub;
  }, []);

  const handleApprove = async () => {
    try {
      await setDoc(doc(db, "settings", "shop_discounts"), {
        activeMemberDiscount: settings.pendingChanges.activeMemberDiscount || 0,
        alumniTier1: settings.pendingChanges.alumniTier1 || 0,
        alumniTier2: settings.pendingChanges.alumniTier2 || 0,
        alumniTier3: settings.pendingChanges.alumniTier3 || 0,
        pendingChanges: null,
        status: "approved"
      }, { merge: true });
      alert("Changes approved successfully.");
    } catch (err) {
      alert("Approval failed.");
    }
  };

  const handleReject = async () => {
    try {
      await setDoc(doc(db, "settings", "shop_discounts"), {
        pendingChanges: null,
        status: "approved" // revert to approved state but without changes
      }, { merge: true });
      alert("Changes rejected.");
    } catch (err) {
      alert("Rejection failed.");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display tracking-tight">Pending Approvals</h2>
        <p className="text-slate-500 text-sm mt-1">Review requests from the Business Manager.</p>
      </div>

      {!settings || settings.status !== "pending_approval" ? (
        <div className="text-slate-500 p-8 text-center bg-slate-50 dark:bg-[#151515] rounded-3xl border border-slate-200 dark:border-slate-800">
           No pending approvals at this time.
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
             <h3 className="font-bold text-lg">Shop Discount Updates</h3>
             <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Pending Analysis</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-[#151515] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-500 mb-2 uppercase text-xs">Current</h4>
              <ul className="text-sm space-y-1">
                <li><span className="font-semibold text-slate-400">Active Member:</span> {settings.activeMemberDiscount || 0}%</li>
                <li><span className="font-semibold text-slate-400">Alumni Tier 1 (1-4 yrs):</span> {settings.alumniTier1 || 0}%</li>
                <li><span className="font-semibold text-slate-400">Alumni Tier 2 (5-8 yrs):</span> {settings.alumniTier2 || 0}%</li>
                <li><span className="font-semibold text-slate-400">Alumni Tier 3 (9+ yrs):</span> {settings.alumniTier3 || 0}%</li>
              </ul>
            </div>
            <div className="bg-[var(--color-4h-green)]/5 p-4 rounded-xl border border-[var(--color-4h-green)]/20">
              <h4 className="font-bold text-[var(--color-4h-green)] mb-2 uppercase text-xs">Requested</h4>
              <ul className="text-sm space-y-1">
                <li><span className="font-semibold text-slate-400">Active Member:</span> {settings.pendingChanges?.activeMemberDiscount || 0}%</li>
                <li><span className="font-semibold text-slate-400">Alumni Tier 1 (1-4 yrs):</span> {settings.pendingChanges?.alumniTier1 || 0}%</li>
                <li><span className="font-semibold text-slate-400">Alumni Tier 2 (5-8 yrs):</span> {settings.pendingChanges?.alumniTier2 || 0}%</li>
                <li><span className="font-semibold text-slate-400">Alumni Tier 3 (9+ yrs):</span> {settings.pendingChanges?.alumniTier3 || 0}%</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={handleApprove} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--color-4h-green)] text-white font-bold rounded-xl hover:bg-green-700 transition">
              <Check size={18} /> Approve Changes
            </button>
            <button onClick={handleReject} className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition">
              <X size={18} /> Reject Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type TabType = "overview" | "transparency" | "approvals" | "documents";

export default function TreasurerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "shop_discounts"), snap => {
      if (snap.exists() && snap.data().status === "pending_approval") {
        setPendingCount(1);
      } else {
        setPendingCount(0);
      }
    });

    const unsubAuth = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u && u.email) {
        const { getDoc, doc } = await import("firebase/firestore");
        const staffRef = doc(db, "staff", u.email.replace(/[@.]/g, "_"));
        const staffSnap = await getDoc(staffRef);
        if (staffSnap.exists()) {
          setUserRole(staffSnap.data().role);
        }
      }
      setLoading(false);
    });
    return () => { unsub(); unsubAuth(); };
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-500 flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#f8fafc] dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#111] border-r border-slate-200 dark:border-slate-800 
        transform transition-transform duration-300 ease-in-out z-50 flex flex-col
        ${menuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:relative md:flex'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800/60 shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="4-H Kalilangan Logo" className="w-10 h-10 rounded-full object-cover shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold font-display text-[13px] leading-tight text-[var(--color-4h-green)]">4-H Club Kalilangan</span>
              <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Treasurer Portal</span>
            </div>
          </Link>
          <button className="md:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded transition" onClick={() => setMenuOpen(false)}>
            <ChevronLeft size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 mt-4 px-2">Management</div>
          {([
            { id: "overview", icon: LayoutDashboard, label: "Overview" },
            { id: "transparency", icon: Activity, label: "Transparency Ledger" },
            { id: "documents", icon: FileText, label: "Financial Documents" },
            { id: "approvals", icon: CheckSquare, label: "Approvals" },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as TabType); setMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all text-sm ${activeTab === tab.id ? 'bg-[var(--color-4h-green)] text-white shadow-md shadow-[var(--color-4h-green)]/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3">
                 <tab.icon size={18} />
                 {tab.label}
              </div>
              {tab.id === 'approvals' && pendingCount > 0 && (
                <div className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                  {pendingCount}
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {userRole === "admin" && (
            <Link to="/dashboard" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10">
              <ChevronLeft size={18} /> Return to Admin
            </Link>
          )}
          <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronLeft size={18} /> Back to Site
          </Link>
          <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800/60 bg-white/80 dark:bg-[#111]/80 backdrop-blur-md z-30 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors md:hidden">
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
                {pendingCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#111]"></span>}
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
                        {pendingCount > 0 && <span className="text-xs font-bold bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] px-2 py-1 rounded-md">{pendingCount} New</span>}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {pendingCount > 0 && (
                          <div 
                            onClick={() => { setActiveTab("approvals"); setShowNotifications(false); }}
                            className="p-4 border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-[#222] transition-colors cursor-pointer"
                          >
                            <p className="text-sm font-semibold truncate"><span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-2"></span>Pending Approvals ({pendingCount})</p>
                            <p className="text-xs text-slate-500 mt-1">There are pending approvals for shop discounts.</p>
                          </div>
                        )}
                        {pendingCount === 0 && (
                           <div className="p-6 text-center text-sm text-slate-500">No new notifications.</div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-bold leading-none">{user.displayName || "Treasurer"}</span>
              <span className="text-xs text-slate-500">{user.email}</span>
            </div>
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=10B981&color=fff`} alt="User" className="w-9 h-9 rounded-full border-2 border-[var(--color-4h-green)]" />
          </div>
        </header>

        <div id="dashboard-scroll-area" className="flex-1 p-3 md:p-5 overflow-y-auto w-full">
          <div className="w-full max-w-none mx-auto pb-20 md:pb-0">
            <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800/60 rounded-3xl p-5 md:p-6 shadow-sm min-h-[50vh]">
              {activeTab === "overview" && <TreasurerOverview />}
              {activeTab === "transparency" && <LedgerDashboardTab />}
              {activeTab === "documents" && <div className="mt-4"><DocumentsTab collectionName="financial_documents_col" title="Financial Documents" /></div>}
              {activeTab === "approvals" && <ApprovalsTab />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
