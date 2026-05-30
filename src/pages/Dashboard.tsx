import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogIn, LogOut, Package, Plus, Trash2, Edit3, Edit2, Save, X, Image as ImageIcon, LayoutDashboard, Users, Activity, Target, FileText, Newspaper, Handshake, Menu, ChevronLeft, ChevronUp, ChevronDown, ShoppingCart, LayoutList, TrendingUp, BarChart3, UsersRound, MessageSquareQuote, Info, Calendar, Film, CheckCircle2, Archive, Eye, Bell, LayoutGrid, List, MessageSquare, Reply, Mail, Instagram, Twitter, Download } from "lucide-react";
import * as lucideIcons from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { cn, recordDocumentAccess } from "../lib/utils";
import { ShopDashboard } from "../components/ShopDashboard";
import { MediaLibraryPicker } from "../components/MediaLibraryPicker";
import { MediaItem } from "../components/MediaLibraryModal";
import { db, auth, storage, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signInWithPopup, GoogleAuthProvider, signOut, User, signInWithEmailAndPassword } from "firebase/auth";

// Types
type Merchandise = { id: string; name: string; price: number; salePrice?: number; costPerItem?: number; sku?: string; stockQuantity?: number; stockStatus?: string; category: string; image: string; description: string; sizes?: string[]; };
type WhyJoinItem = { title: string; description: string; };
type FAQItem = { question: string; answer: string; };
type SiteSettings = { 
  heroTitle: string;
  heroSubtitle: string;
  mission: string; 
  vision: string; 
  videoUrl: string; 
  facebookUrl?: string; 
  instagramUrl?: string; 
  twitterUrl?: string; 
  tiktokUrl?: string; 
  acceptingNewMembers?: boolean;
  aboutDescription?: string;
  pillarsDescription?: string;
  transparencyDescription?: string;
  newsDescription?: string;
  partnersDescription?: string;
  shopDescription?: string;
  whyJoinDescription?: string;
  whyJoinItems?: WhyJoinItem[];
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  faqs?: FAQItem[];
};
type CouncilMember = { id: string; name: string; role: string; type: string; image?: string; };
type ActivityItem = { id: string; title: string; date: string; location: string; type: string; status: string; };
type PillarItem = { id: string; title: string; description: string; icon: string; profilePicture?: string; extendedDescription?: string; sampleProjects?: { title: string; tagline?: string; objective?: string; status?: string; about?: string; timeline?: { date: string; event: string }[]; impact?: string; downloadUrl?: string; sustainabilityPlan?: string; acknowledgment?: string; callToAction?: { text: string; url: string }; image?: string; year?: string; isArchived?: boolean }[]; upcomingEvents?: { title: string; date: string; timeStart?: string; timeEnd?: string; description: string; image?: string; year?: string; isArchived?: boolean; location?: string; videoLink?: string; documents?: {title: string, url: string}[]; photos?: {url: string}[] }[]; image?: string; heroVideo?: string; highlightImages?: { url: string; name: string }[]; albums?: { id: string; title: string; description?: string; location?: string; cover?: string; date?: string; media: { url: string; type: 'image' | 'video'; title?: string; description?: string; date?: string; }[] }[]; media?: { url: string; type: 'image' | 'video'; name: string }[]; order?: number; };
type DocumentItem = { id: string; title: string; description: string; type: string; category: string; link: string; };
type NewsItem = { id: string; title: string; excerpt: string; date: string; category: string; content: string; image?: string; media?: { url: string; type: 'image' | 'video'; name: string }[]; };
type PartnerItem = { id: string; name: string; logo: string; };
export type LedgerItem = { id: string; date: string; description: string; category: string; amount: number; status: string; };
type VoiceItem = { id: string; quote: string; name: string; role: string; office: string; avatarUrl: string; };

type TabType = "settings" | "pillars" | "news" | "shop" | "staff" | "messages";

export function PartnersContainer() {
  const [subTab, setSubTab] = useState<"brand" | "voices">("brand");
  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button onClick={() => setSubTab("brand")} className={`px-4 py-2 font-bold rounded-xl transition-colors ${subTab === "brand" ? "bg-[var(--color-4h-green)] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>Brand Partners</button>
        <button onClick={() => setSubTab("voices")} className={`px-4 py-2 font-bold rounded-xl transition-colors ${subTab === "voices" ? "bg-[var(--color-4h-green)] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>Voices from the Field</button>
      </div>
      {subTab === "brand" ? (
        <CrudTab<PartnerItem> collectionName="partners" title="Partners" emptyItem={{ name: "", logo: "" }} fields={[{ key: "name", label: "Partner Name" }, { key: "logo", label: "Logo URL (optional)" }]} />
      ) : (
        <CrudTab<VoiceItem> collectionName="voices" title="Voices from the Field" emptyItem={{ quote: "", name: "", role: "", office: "", avatarUrl: "" }} fields={[{ key: "quote", label: "Quote", isTextArea: true }, { key: "name", label: "Name" }, { key: "role", label: "Role/Position" }, { key: "office", label: "Office/Organization (optional)" }, { key: "avatarUrl", label: "Avatar/Image URL" }]} />
      )}
    </div>
  );
}

export function DocumentsContainer() {
  const [subTab, setSubTab] = useState<"files" | "ledger">("files");
  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button onClick={() => setSubTab("files")} className={`px-4 py-2 font-bold rounded-xl transition-colors ${subTab === "files" ? "bg-[var(--color-4h-green)] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>Public Documents</button>
        <button onClick={() => setSubTab("ledger")} className={`px-4 py-2 font-bold rounded-xl transition-colors ${subTab === "ledger" ? "bg-[var(--color-4h-green)] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>Transparency Ledger</button>
      </div>
      {subTab === "files" ? (
        <DocumentsTab />
      ) : (
        <LedgerDashboardTab />
      )}
    </div>
  );
}

export function LedgerDashboardTab() {
  const collectionName = "transparency";
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LedgerItem>>({});

  useEffect(() => {
    if (isAdding || isEditing) {
      document.getElementById('dashboard-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isAdding, isEditing]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, collectionName), snap => {
      const arr: LedgerItem[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as LedgerItem));
      // Sort by date desc
      arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItems(arr);
    }, err => handleFirestoreError(err, OperationType.GET, collectionName));
    return () => unsub();
  }, []);

  const handleSave = async () => {
    try {
      if (isAdding) {
        const id = doc(collection(db, collectionName)).id;
        await setDoc(doc(db, collectionName, id), editForm);
      } else if (isEditing) {
        await updateDoc(doc(db, collectionName, isEditing), editForm);
      }
      setIsAdding(false);
      setIsEditing(null);
      setEditForm({});
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, collectionName);
    }
  };

  const handleDelete = async (id: string) => {
    if (true) {
      try { await deleteDoc(doc(db, collectionName, id)); }
      catch (err) { handleFirestoreError(err, OperationType.DELETE, collectionName); }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Transparency Ledger</h2>
        <button 
          onClick={() => { 
            setIsAdding(!isAdding); 
            setIsEditing(null); 
            setEditForm({ date: new Date().toISOString().split('T')[0], description: "", category: "General", amount: 0, status: "Cleared" }); 
          }} 
          className="bg-slate-900 text-white dark:bg-white dark:text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 text-sm"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />} {isAdding ? "Cancel" : "Add Entry"}
        </button>
      </div>

      <AnimatePresence>
        {(isAdding || isEditing) && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-slate-50 dark:bg-[#151515] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{isAdding ? 'Add Entry' : 'Edit Entry'}</h3>
              <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-1">Date (YYYY-MM-DD)</label>
                <input type="date" value={editForm.date || ''} onChange={e => setEditForm({...editForm, date: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Description</label>
                <input type="text" value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Category</label>
                <input type="text" value={editForm.category || ''} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Amount (Use negative for expense)</label>
                <input type="number" value={editForm.amount || 0} onChange={e => setEditForm({...editForm, amount: parseFloat(e.target.value)})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Status</label>
                <select value={editForm.status || 'Cleared'} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]">
                  <option value="Cleared">Cleared</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="px-6 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-sm">Cancel</button>
              <button onClick={handleSave} className="bg-[var(--color-4h-green)] text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 text-sm"><Save size={16} /> Save</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Description</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Category</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Amount</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, i) => (
                <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-sm whitespace-nowrap">{row.date}</td>
                  <td className="px-6 py-4 text-slate-900 dark:text-white font-medium min-w-[200px]">{row.description}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap">
                      {row.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-mono font-bold whitespace-nowrap ${row.amount >= 0 ? "text-[var(--color-4h-green)]" : "text-rose-500"}`}>
                    ₱{Math.abs(row.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => { setIsEditing(row.id); setIsAdding(false); setEditForm({...row}); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(row.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-100 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No ledger records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const compressImage = async (file: File, maxSizeMB: number = 1): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;
  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size <= maxSize) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const maxDimension = 1920; 
        if (width > height && width > maxDimension) {
          height *= maxDimension / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width *= maxDimension / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (!blob) return resolve(file);
            if (blob.size <= maxSize || quality <= 0.3) {
              resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }));
            } else {
              quality -= 0.15;
              tryCompress();
            }
          }, 'image/jpeg', quality);
        };
        tryCompress();
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("settings");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a]"></div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#f8fafc] dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 md:w-64 lg:w-72 border-r border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#111] flex-shrink-0 flex flex-col h-full transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800/60 shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.jpg" alt="4-H Kalilangan Logo" className="w-10 h-10 rounded-full object-cover shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold font-display text-[13px] leading-tight text-[var(--color-4h-green)]">4-H Club Kalilangan</span>
              <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Admin Portal</span>
            </div>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 p-2 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar py-4 flex flex-col gap-1 px-3">
          {([
            { id: "settings", icon: Target, label: "Site Settings" },
            { id: "pillars", icon: LayoutDashboard, label: "Pillars" },
            { id: "news", icon: Newspaper, label: "News & Press" },
            { id: "messages", icon: MessageSquare, label: "Messages" },
            { id: "staff", icon: UsersRound, label: "Staff Management" },
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

        <div className="p-4 border-t border-slate-200 dark:border-slate-800/60 flex flex-col gap-2">
          <Link 
            to="/"
            className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-3 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition text-sm"
          >
            <ChevronLeft size={16} /> Back to Site
          </Link>
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition text-sm"
          >
            <LogOut size={16} /> Logout Account
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
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
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        <div className="p-6 text-center text-sm text-slate-500">No new notifications.</div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-bold leading-none">{user.displayName || "Admin"}</span>
              <span className="text-xs text-slate-500">{user.email}</span>
            </div>
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=4ade80&color=fff`} alt="User" className="w-9 h-9 rounded-full border-2 border-[var(--color-4h-green)]" />
          </div>
        </header>

        <div id="dashboard-scroll-area" className="flex-1 p-3 md:p-5 overflow-y-auto w-full">
          <div className="w-full max-w-none mx-auto pb-20 md:pb-0">
            <div className="bg-white dark:bg-[#111] rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden min-h-[50vh]">
              {activeTab === "settings" && <SettingsTab />}
              {activeTab === "pillars" && <PillarsDashboardTab />}
              {activeTab === "news" && <NewsTab />}
              {activeTab === "messages" && <MessagesTab />}
              {activeTab === "staff" && <StaffTab />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState<SiteSettings>({ heroTitle: "", heroSubtitle: "", mission: "", vision: "", videoUrl: "", acceptingNewMembers: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSettingTab, setActiveSettingTab] = useState("general");

  useEffect(() => {
    getDoc(doc(db, "settings", "site")).then(snap => {
      if (snap.exists()) {
        const data = snap.data() as SiteSettings;
        if (data.acceptingNewMembers === undefined) {
          data.acceptingNewMembers = true;
        }
        setSettings(data);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "site"), settings);
      alert("Settings saved successfully!");
    } catch(err) {
      handleFirestoreError(err, OperationType.WRITE, "settings/site");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="font-display font-bold text-3xl text-slate-900 dark:text-white">Site Settings</h2>
          <p className="text-slate-500 text-sm mt-1">Manage global content and configurations for the website</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-[var(--color-4h-green)] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 text-sm shadow-md transition-all shrink-0">
          <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
         <button onClick={() => setActiveSettingTab('general')} className={cn("px-4 py-2 font-bold text-sm whitespace-nowrap rounded-t-lg border-b-2 transition-all", activeSettingTab === 'general' ? "border-[var(--color-4h-green)] text-[var(--color-4h-green)] bg-green-50 dark:bg-green-900/10" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-[#111]")}>General & Hero</button>
         <button onClick={() => setActiveSettingTab('about')} className={cn("px-4 py-2 font-bold text-sm whitespace-nowrap rounded-t-lg border-b-2 transition-all", activeSettingTab === 'about' ? "border-[var(--color-4h-green)] text-[var(--color-4h-green)] bg-green-50 dark:bg-green-900/10" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-[#111]")}>About & Join</button>
         <button onClick={() => setActiveSettingTab('pages')} className={cn("px-4 py-2 font-bold text-sm whitespace-nowrap rounded-t-lg border-b-2 transition-all", activeSettingTab === 'pages' ? "border-[var(--color-4h-green)] text-[var(--color-4h-green)] bg-green-50 dark:bg-green-900/10" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-[#111]")}>Page Descriptions</button>
         <button onClick={() => setActiveSettingTab('contact')} className={cn("px-4 py-2 font-bold text-sm whitespace-nowrap rounded-t-lg border-b-2 transition-all", activeSettingTab === 'contact' ? "border-[var(--color-4h-green)] text-[var(--color-4h-green)] bg-green-50 dark:bg-green-900/10" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-[#111]")}>Contact & Social</button>
         <button onClick={() => setActiveSettingTab('faqs')} className={cn("px-4 py-2 font-bold text-sm whitespace-nowrap rounded-t-lg border-b-2 transition-all", activeSettingTab === 'faqs' ? "border-[var(--color-4h-green)] text-[var(--color-4h-green)] bg-green-50 dark:bg-green-900/10" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-[#111]")}>FAQs</button>
      </div>

      <div className="bg-slate-50 dark:bg-[#151515] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[500px]">
        {activeSettingTab === 'general' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Homepage Hero Options</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Hero Headline</label>
                  <input value={settings.heroTitle || ""} onChange={e => setSettings({...settings, heroTitle: e.target.value})} placeholder="Cultivating The 4-H Future" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] transition-colors" />
                  <p className="text-xs text-slate-500 mt-1">Main text displayed instantly on page load. Use &lt;br/&gt; to break lines.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Hero Subtitle</label>
                  <textarea value={settings.heroSubtitle || ""} onChange={e => setSettings({...settings, heroSubtitle: e.target.value})} placeholder="Empowering the youth through modernized agriculture..." className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] h-24 resize-none transition-colors" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Media & Embeds</h3>
              <div>
                <label className="block text-sm font-semibold mb-2">Video Embed URL</label>
                <div className="flex items-center gap-2">
                  <div className="bg-slate-200 dark:bg-slate-700 p-3 rounded-xl text-slate-500"><Film size={18} /></div>
                  <input value={settings.videoUrl || ""} onChange={e => setSettings({...settings, videoUrl: e.target.value})} placeholder="https://www.youtube.com/embed/..." className="flex-1 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] transition-colors" />
                </div>
                <p className="text-xs text-slate-500 mt-2">Display video for the homepage section. (Accepts standard YouTube links or direct embed URLs)</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Membership Enablement</h3>
              <label htmlFor="acceptingNewMembers" className="flex items-center gap-4 cursor-pointer p-5 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl hover:border-[var(--color-4h-green)] transition-colors shadow-sm">
                <div className="shrink-0 flex items-center justify-center">
                  <input type="checkbox" id="acceptingNewMembers" checked={settings.acceptingNewMembers === true} onChange={e => setSettings({...settings, acceptingNewMembers: e.target.checked})} className="w-5 h-5 accent-[var(--color-4h-green)]" />
                </div>
                <div>
                  <span className="block text-base font-bold text-slate-900 dark:text-white">Accepting New Members</span>
                  <span className="block text-sm text-slate-500 mt-0.5">Toggle to show or hide the "Join Now" call to action universally across the entire website.</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {activeSettingTab === 'about' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">About Page Statements</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><Target size={16} className="text-[var(--color-4h-green)]"/> Mission Statement</label>
                  <textarea value={settings.mission || ""} onChange={e => setSettings({...settings, mission: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] h-32 resize-none transition-colors" placeholder="Enter the organization's mission..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><Eye size={16} className="text-[var(--color-4h-green)]"/> Vision Statement</label>
                  <textarea value={settings.vision || ""} onChange={e => setSettings({...settings, vision: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] h-32 resize-none transition-colors" placeholder="Enter the organization's vision..." />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Why Join 4-H</h3>
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Introductory Description</label>
                <textarea value={settings.whyJoinDescription || ""} onChange={e => setSettings({...settings, whyJoinDescription: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] h-24 resize-none transition-colors" placeholder="Briefly explain why youth should join..." />
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold">Join Reasons & Benefits</label>
                <button onClick={() => setSettings({...settings, whyJoinItems: [...(settings.whyJoinItems || []), {title: "", description: ""}]})} className="text-sm bg-[var(--color-4h-green)] text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 hover:opacity-90 transition-colors shadow-sm">
                  <Plus size={16} /> Add Reason
                </button>
              </div>
              <div className="space-y-4">
                {(settings.whyJoinItems || []).map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-5 bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800 relative group shadow-sm">
                    <div className="bg-slate-100 dark:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-500 shrink-0">{idx + 1}</div>
                    <div className="flex-1 space-y-3">
                      <input value={item.title} onChange={e => {
                        const newItems = [...(settings.whyJoinItems || [])];
                        newItems[idx].title = e.target.value;
                        setSettings({...settings, whyJoinItems: newItems});
                      }} placeholder="Benefit Title" className="w-full bg-slate-50 dark:bg-[#151515] border-b-2 border-slate-200 dark:border-slate-800 px-3 py-2 outline-none text-base font-bold focus:border-[var(--color-4h-green)] transition-colors" />
                      <textarea value={item.description} onChange={e => {
                        const newItems = [...(settings.whyJoinItems || [])];
                        newItems[idx].description = e.target.value;
                        setSettings({...settings, whyJoinItems: newItems});
                      }} placeholder="Provide a short description of the benefit..." className="w-full bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none text-sm h-24 resize-none focus:border-[var(--color-4h-green)] transition-colors" />
                    </div>
                    <button onClick={() => {
                      const newItems = [...(settings.whyJoinItems || [])];
                      newItems.splice(idx, 1);
                      setSettings({...settings, whyJoinItems: newItems});
                    }} className="absolute top-5 right-5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-xl transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {(!settings.whyJoinItems || settings.whyJoinItems.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-black/50">
                    <Target className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="font-semibold text-slate-600 dark:text-slate-400">No join benefits added yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSettingTab === 'pages' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">Page Header Descriptions</h3>
              <p className="text-sm text-slate-500">Provide a short introduction paragraph for the top of each page.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-8">
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><Info size={16} className="text-blue-500"/> About Page Header</label>
                <textarea value={settings.aboutDescription || ""} onChange={e => setSettings({...settings, aboutDescription: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] h-24 resize-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><LayoutDashboard size={16} className="text-[var(--color-4h-green)]"/> Pillars Page Header</label>
                <textarea value={settings.pillarsDescription || ""} onChange={e => setSettings({...settings, pillarsDescription: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] h-24 resize-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><FileText size={16} className="text-purple-500"/> Transparency Page Header</label>
                <textarea value={settings.transparencyDescription || ""} onChange={e => setSettings({...settings, transparencyDescription: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] h-24 resize-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><Newspaper size={16} className="text-amber-500"/> News Page Header</label>
                <textarea value={settings.newsDescription || ""} onChange={e => setSettings({...settings, newsDescription: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] h-24 resize-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><Handshake size={16} className="text-teal-500"/> Partners Page Header</label>
                <textarea value={settings.partnersDescription || ""} onChange={e => setSettings({...settings, partnersDescription: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] h-24 resize-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><ShoppingCart size={16} className="text-orange-500"/> Shop Page Header</label>
                <textarea value={settings.shopDescription || ""} onChange={e => setSettings({...settings, shopDescription: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] h-24 resize-none transition-colors" />
              </div>
            </div>
          </div>
        )}

        {activeSettingTab === 'contact' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Contact Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Contact Email</label>
                  <input value={settings.contactEmail || ""} onChange={e => setSettings({...settings, contactEmail: e.target.value})} placeholder="contact@4h.org" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Contact Phone</label>
                  <input value={settings.contactPhone || ""} onChange={e => setSettings({...settings, contactPhone: e.target.value})} placeholder="+63 900 000 0000" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Physical Address</label>
                  <input value={settings.contactAddress || ""} onChange={e => setSettings({...settings, contactAddress: e.target.value})} placeholder="Kalilangan, Bukidnon" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] transition-colors" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">Social Media Links</h3>
              <p className="text-sm text-slate-500 mb-6">Leave the URL empty to hide the respective social icon in the website footer.</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><span className="w-6 h-6 bg-[#1877F2] rounded-md flex justify-center items-center text-white font-bold text-xs">f</span> Facebook URL</label>
                  <input value={settings.facebookUrl || ""} onChange={e => setSettings({...settings, facebookUrl: e.target.value})} placeholder="https://facebook.com/..." className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><span className="w-6 h-6 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 rounded-md flex justify-center items-center text-white"><Instagram size={14} /></span> Instagram URL</label>
                  <input value={settings.instagramUrl || ""} onChange={e => setSettings({...settings, instagramUrl: e.target.value})} placeholder="https://instagram.com/..." className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><span className="w-6 h-6 bg-black rounded-md flex justify-center items-center text-white"><Twitter size={14} /></span> X (Twitter) URL</label>
                  <input value={settings.twitterUrl || ""} onChange={e => setSettings({...settings, twitterUrl: e.target.value})} placeholder="https://twitter.com/..." className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><span className="w-6 h-6 bg-black rounded-md flex justify-center items-center text-white font-bold text-xs">🎵</span> TikTok URL</label>
                  <input value={settings.tiktokUrl || ""} onChange={e => setSettings({...settings, tiktokUrl: e.target.value})} placeholder="https://tiktok.com/@..." className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] transition-colors" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSettingTab === 'faqs' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">Frequently Asked Questions</h3>
                <p className="text-sm text-slate-500">Manage FAQs appearing on the Contact page.</p>
              </div>
              <button onClick={() => setSettings({...settings, faqs: [...(settings.faqs || []), {question: "", answer: ""}]})} className="text-sm bg-[var(--color-4h-green)] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm">
                <Plus size={16} /> Add FAQ
              </button>
            </div>
            
            <div className="space-y-4">
              {(settings.faqs || []).map((faq, idx) => (
                <div key={idx} className="flex gap-4 p-5 bg-white dark:bg-black rounded-2xl border border-slate-200 dark:border-slate-800 relative group shadow-sm">
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Question {idx + 1}</label>
                      <input value={faq.question} onChange={e => {
                        const newFaqs = [...(settings.faqs || [])];
                        newFaqs[idx].question = e.target.value;
                        setSettings({...settings, faqs: newFaqs});
                      }} placeholder="What is 4-H about?" className="w-full bg-slate-50 dark:bg-[#151515] border-b-2 border-slate-200 dark:border-slate-800 px-3 py-2 outline-none text-base font-bold focus:border-[var(--color-4h-green)] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Answer</label>
                      <textarea value={faq.answer} onChange={e => {
                        const newFaqs = [...(settings.faqs || [])];
                        newFaqs[idx].answer = e.target.value;
                        setSettings({...settings, faqs: newFaqs});
                      }} placeholder="Provide a detailed explanation..." className="w-full bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none text-sm h-24 resize-none focus:border-[var(--color-4h-green)] transition-colors" />
                    </div>
                  </div>
                  <button onClick={() => {
                    const newFaqs = [...(settings.faqs || [])];
                    newFaqs.splice(idx, 1);
                    setSettings({...settings, faqs: newFaqs});
                  }} className="absolute top-5 right-5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-xl transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {(!settings.faqs || settings.faqs.length === 0) && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-black/50">
                  <MessageSquareQuote className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-600 dark:text-slate-400">No FAQs added yet.</p>
                  <p className="mt-1">Click "Add FAQ" to create your first frequently asked question.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CouncilTab() {
  const [items, setItems] = useState<CouncilMember[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CouncilMember>>({});
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isAdding || isEditing) {
      document.getElementById('dashboard-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isAdding, isEditing]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "council"), snap => {
      const arr: CouncilMember[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as CouncilMember));
      
      const roleHierarchy: Record<string, number> = {
        "President": 1,
        "Vice-President": 2,
        "Secretary": 3,
        "Treasurer": 4,
        "Auditor": 5,
        "PIRO": 6,
        "Business Manager": 7
      };
      
      arr.sort((a, b) => {
        if (a.type === "Executive Board" && b.type !== "Executive Board") return -1;
        if (a.type !== "Executive Board" && b.type === "Executive Board") return 1;
        
        const rankA = roleHierarchy[a.role] || 99;
        const rankB = roleHierarchy[b.role] || 99;
        
        if (rankA !== rankB) return rankA - rankB;
        return a.name.localeCompare(b.name);
      });
      
      setItems(arr);
    }, err => handleFirestoreError(err, OperationType.GET, "council"));

    const unsubMembers = onSnapshot(collection(db, "members"), snap => {
       const mArr: any[] = [];
       snap.forEach(d => mArr.push(d.data()));
       setMembers(mArr);
    });

    return () => { unsub(); unsubMembers(); };
  }, []);

  const handleSave = async () => {
    try {
      if (isAdding) {
        const id = doc(collection(db, "council")).id;
        await setDoc(doc(db, "council", id), {
          ...editForm,
          type: editForm.type || "Executive Board"
        });
      } else if (isEditing) {
        await updateDoc(doc(db, "council", isEditing), {
          name: editForm.name || "",
          image: editForm.image || null,
          role: editForm.role || "",
          type: editForm.type || "Executive Board"
        });
      }
      setIsEditing(null);
      setIsAdding(false);
      setEditForm({});
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "council");
    }
  };

  const handleDelete = async (id: string) => {
    if (true) {
      try { await deleteDoc(doc(db, "council", id)); }
      catch (err) { handleFirestoreError(err, OperationType.DELETE, "council"); }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="font-bold text-2xl">Council Members</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
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
          <button 
            onClick={async () => {
              const termName = window.prompt("Enter term name for this administration (e.g. 2024-2025):");
              if (termName) {
                if (window.confirm(`Are you sure you want to archive this administration as '${termName}' and vacant all positions?`)) {
                  try {
                    const id = doc(collection(db, "pastAdmins")).id;
                    await setDoc(doc(db, "pastAdmins", id), {
                      termName,
                      createdAt: new Date().toISOString(),
                      officers: items
                    });
                    
                    for (const item of items) {
                      await updateDoc(doc(db, "council", item.id), {
                        name: "Vacant",
                        image: ""
                      });
                    }
                    alert("Administration archived successfully!");
                  } catch (err) {
                    alert("Error archiving administration. See console.");
                    console.error(err);
                  }
                }
              }
            }} 
            className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 flex-1 sm:flex-none justify-center rounded-xl font-bold flex items-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-700 transition text-sm whitespace-nowrap"
          >
            <Archive size={16} /> Past Admin
          </button>
          <button onClick={() => { setIsAdding(true); setIsEditing(null); setEditForm({ type: "Executive Board" }); }} className="bg-[var(--color-4h-green)] text-white px-4 py-2 flex-1 sm:flex-none justify-center rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition text-sm whitespace-nowrap">
            <Plus size={16} /> Add Position
          </button>
        </div>
      </div>

      <AnimatePresence>
        {(isAdding || isEditing) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-50 dark:bg-[#151515] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{isAdding ? 'Add Position' : 'Edit Member'}</h3>
              <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-1">Type</label>
                <select 
                  value={editForm.type || "Executive Board"}
                  onChange={e => setEditForm({...editForm, type: e.target.value, role: ""})}
                  disabled={!!isEditing}
                  className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="Executive Board">Executive Board</option>
                  <option value="Barangay Based">Barangay Based</option>
                  <option value="School Based">School Based</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  {editForm.type === "Barangay Based" ? "Barangay Name" : editForm.type === "School Based" ? "School Name" : "Position / Role"}
                </label>
                {editForm.type === "Executive Board" ? (
                  <select 
                    value={editForm.role || ""}
                    onChange={e => setEditForm({...editForm, role: e.target.value})}
                    disabled={!!isEditing}
                    className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="" disabled>Select Position</option>
                    {["President", "Vice-President", "Secretary", "Treasurer", "Auditor", "PIRO", "Business Manager"].map(r => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text"
                    placeholder={editForm.type === "Barangay Based" ? "e.g., Barangay Name" : "e.g., School Name"}
                    value={editForm.role || ""}
                    onChange={e => setEditForm({...editForm, role: e.target.value})}
                    disabled={!!isEditing}
                    className={`w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Name</label>
                <input 
                  type="text"
                  value={editForm.name || ""}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Full Name (e.g., John Doe)"
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Image URL</label>
                <input 
                  type="text"
                  value={editForm.image || ""}
                  onChange={e => setEditForm({...editForm, image: e.target.value})}
                  placeholder="https://..."
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] mb-2"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsUploading(true);
                    try {
                      const fileRef = ref(storage, `council/${Date.now()}_${file.name}`);
                      await uploadBytes(fileRef, file);
                      const downloadURL = await getDownloadURL(fileRef);
                      setEditForm(prev => ({ ...prev, image: downloadURL }));
                      alert("Upload complete!");
                    } catch (err) {
                      console.error("Upload error:", err);
                      alert("Upload failed. Make sure Firebase Storage rules allow write access.");
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-[var(--color-4h-green)] hover:file:bg-slate-200 transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="px-6 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={isUploading} className="bg-[var(--color-4h-green)] text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                <Save size={16} /> {isUploading ? "Uploading..." : "Save"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-6">
        {[
           { title: "Executive Council", type: "Executive Board" },
           { title: "Barangay Based", type: "Barangay Based" },
           { title: "School Based", type: "School Based" },
        ].map((group) => {
          const groupItems = items.filter(item => item.type === group.type);
          if (groupItems.length === 0 && !isAdding) return null;

          return (
            <div key={group.type}>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 text-lg px-1 text-[var(--color-4h-green)]">{group.title}</h3>
              {viewMode === 'list' ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 px-4">
                  {groupItems.map(item => (
                    <div key={item.id} className="py-4 flex gap-4 items-center justify-between group">
                      <div className="flex-1 min-w-0 flex items-center gap-4">
                        {item.image ? (
                          <img src={item.image} alt={item.name} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 shrink-0">
                            {(item.name || 'V').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold truncate text-slate-900 dark:text-white">
                            {item.role} {item.type !== "Executive Board" ? <span className="font-normal text-slate-500">({item.type})</span> : ''}
                          </h4>
                          <p className="text-sm text-slate-500 truncate">
                             {item.type !== "Executive Board" ? <span className="font-semibold text-slate-700 dark:text-slate-300">President: </span> : ''}
                             {item.name || "Vacant"}
                          </p>
                          {item.type !== "Executive Board" && (
                            <p className="text-xs text-[var(--color-4h-green)] font-semibold mt-0.5">
                              {members.filter(m => (item.type === "Barangay Based" && m.barangayChapter === item.role) || (item.type === "School Based" && m.schoolChapter === item.role)).length} Members
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setIsEditing(item.id); setIsAdding(false); setEditForm({...item}); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                          title="Edit Name/Image"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-100 hover:text-red-500 transition-colors"
                          title="Remove Position"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {groupItems.length === 0 && <p className="text-slate-500 py-4 text-center text-sm">No members in this category.</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {groupItems.map(item => (
                    <div key={item.id} className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col group">
                      <div className="flex items-center gap-3 mb-4">
                        {item.image ? (
                          <img src={item.image} alt={item.name} referrerPolicy="no-referrer" className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 shrink-0">
                            {(item.name || 'V').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">
                             {item.role} 
                          </h4>
                          <p className="text-sm text-slate-500 truncate">
                             {item.type !== "Executive Board" ? <span className="font-semibold text-slate-700 dark:text-slate-300">President: </span> : ''}
                             {item.name || "Vacant"}
                          </p>
                        </div>
                      </div>
                      {item.type !== "Executive Board" && (
                        <p className="text-xs text-[var(--color-4h-green)] font-semibold mt-auto mb-4 bg-[var(--color-4h-green)]/10 self-start px-2 py-1 rounded">
                          {members.filter(m => (item.type === "Barangay Based" && m.barangayChapter === item.role) || (item.type === "School Based" && m.schoolChapter === item.role)).length} Members
                        </p>
                      )}
                      <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setIsEditing(item.id); setIsAdding(false); setEditForm({...item}); }}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 hover:text-blue-600 transition-colors text-xs font-bold text-slate-600"
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="w-10 flex items-center justify-center py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-100 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {groupItems.length === 0 && <p className="col-span-full text-slate-500 py-4 text-center text-sm">No members in this category.</p>}
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && !isAdding && <p className="text-slate-500 py-8 text-center text-sm">No council members found.</p>}
      </div>
    </div>
  );
}

export type CrudTabProps<T> = {
  collectionName: string;
  title: string;
  emptyItem: Partial<T>;
  fields: { key: keyof T; label: string; type?: string; isTextArea?: boolean }[];
};

export function CrudTab<T extends { id: string; [key: string]: any }>({ collectionName, title, emptyItem, fields }: CrudTabProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<T>>({});
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isAdding || isEditing) {
      document.getElementById('dashboard-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isAdding, isEditing]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, collectionName), snap => {
      const arr: T[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as T));
      setItems(arr);
    }, err => handleFirestoreError(err, OperationType.GET, collectionName));
    return () => unsub();
  }, [collectionName]);

  const handleSave = async () => {
    try {
      if (isAdding) {
        const id = doc(collection(db, collectionName)).id;
        await setDoc(doc(db, collectionName, id), editForm as any);
      } else if (isEditing) {
        await updateDoc(doc(db, collectionName, isEditing), editForm as any);
      }
      setIsEditing(null);
      setIsAdding(false);
      setEditForm({});
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, collectionName);
    }
  };

  const handleDelete = async (id: string) => {
    if (true) {
      try { await deleteDoc(doc(db, collectionName, id)); }
      catch (err) { handleFirestoreError(err, OperationType.DELETE, collectionName); }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="font-bold text-2xl">{title}</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
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
          <button onClick={() => { setIsAdding(true); setIsEditing(null); setEditForm(emptyItem); }} className="bg-[var(--color-4h-green)] text-white px-4 py-2 flex-1 sm:flex-none justify-center rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition text-sm whitespace-nowrap">
            <Plus size={16} /> Add New
          </button>
        </div>
      </div>

      <AnimatePresence>
        {(isAdding || isEditing) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-50 dark:bg-[#151515] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{isAdding ? 'Add' : 'Edit'}</h3>
              <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {fields.map(f => (
                <div key={f.key as string} className={f.isTextArea ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-semibold mb-1">{f.label}</label>
                  {f.isTextArea ? (
                    <textarea 
                      value={editForm[f.key] as any || ''} 
                      onChange={e => setEditForm({...editForm, [f.key]: e.target.value})}
                      className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] h-24 resize-none"
                    />
                  ) : f.key === "image" || f.key === "logo" || f.key === "avatarUrl" ? (
                    <div>
                      <input 
                        type="text"
                        value={editForm[f.key] as any || ''} 
                        onChange={e => setEditForm({...editForm, [f.key]: e.target.value})}
                        placeholder="https://..."
                        className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] mb-2"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          setIsUploading(true);
                          try {
                            const fileRef = ref(storage, `${collectionName}/${Date.now()}_${file.name}`);
                            await uploadBytes(fileRef, file);
                            const downloadURL = await getDownloadURL(fileRef);
                            setEditForm({ ...editForm, [f.key]: downloadURL });
                            alert("Upload complete!");
                          } catch (err) {
                            console.error("Upload failed", err);
                            alert("Upload failed. Make sure Firebase Storage rules allow write access.");
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                        disabled={isUploading}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-[var(--color-4h-green)] hover:file:bg-slate-200 transition-colors"
                      />
                    </div>
                  ) : (
                    <input 
                      type={f.type || "text"}
                      value={editForm[f.key] as any || ''} 
                      onChange={e => setEditForm({...editForm, [f.key]: f.type === 'number' ? parseFloat(e.target.value) : e.target.value})}
                      className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="px-6 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={isUploading} className="bg-[var(--color-4h-green)] text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                <Save size={16} /> {isUploading ? "Uploading..." : "Save"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'list' ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {items.map(item => (
            <div key={item.id} className="py-4 flex gap-4 items-center justify-between group">
              <div className="flex-1 min-w-0 flex items-center gap-4">
                {(item.avatarUrl || item.logo || item.image) && (
                  <img src={item.avatarUrl || item.logo || item.image} referrerPolicy="no-referrer" alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                )}
                <div className="min-w-0">
                  <h4 className="font-bold truncate text-slate-900 dark:text-white">
                    {collectionName === 'voices' ? item.name : item[fields[0].key as string]}
                  </h4>
                  <p className="text-sm text-slate-500 truncate">
                    {collectionName === 'voices' 
                      ? `${item.role || ''} ${item.office ? `• ${item.office}` : ''}`
                      : (fields.length > 1 ? String(item[fields[1].key as string] || '') : '')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setIsEditing(item.id); setIsAdding(false); setEditForm({...item}); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                  title="Edit"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-100 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && !isAdding && <p className="text-slate-500 py-8 text-center text-sm">No items found.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col group">
              <div className="flex items-center gap-3 mb-4">
                {(item.avatarUrl || item.logo || item.image) ? (
                  <img src={item.avatarUrl || item.logo || item.image} referrerPolicy="no-referrer" alt="" className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                ) : (
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
                     <ImageIcon size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate text-slate-900 dark:text-white">
                    {collectionName === 'voices' ? item.name : item[fields[0].key as string]}
                  </h4>
                  <p className="text-sm text-slate-500 truncate">
                    {collectionName === 'voices' 
                      ? `${item.role || ''} ${item.office ? `• ${item.office}` : ''}`
                      : (fields.length > 1 ? String(item[fields[1].key as string] || '') : '')}
                  </p>
                </div>
              </div>
              {collectionName === 'voices' && item.quote && (
                <p className="text-sm text-slate-600 dark:text-slate-400 italic line-clamp-3 mb-4 flex-1">"{item.quote}"</p>
              )}
              {collectionName !== 'voices' && fields.length > 2 && (
                 <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 flex-1">{String(item[fields[2].key as string] || '')}</p>
              )}
              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setIsEditing(item.id); setIsAdding(false); setEditForm({...item}); }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 hover:text-blue-600 transition-colors text-xs font-bold text-slate-600"
                >
                  <Edit3 size={14} /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="w-10 flex items-center justify-center py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-100 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && !isAdding && <p className="col-span-full text-slate-500 py-8 text-center text-sm">No items found.</p>}
        </div>
      )}
    </div>
  );
}

export function DocumentsTab({ collectionName = "documents_col", title = "Documents" }: { collectionName?: string, title?: string }) {
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DocumentItem>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<DocumentItem | null>(null);

  useEffect(() => {
    if (isAdding || isEditing) {
      document.getElementById('dashboard-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isAdding, isEditing]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, collectionName), snap => {
      const arr: DocumentItem[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as DocumentItem));
      setItems(arr);
    }, err => handleFirestoreError(err, OperationType.GET, collectionName));
    return () => unsub();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileRef = ref(storage, `documents/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      setEditForm({ ...editForm, link: downloadURL });
      alert("Upload complete!");
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload document. Make sure Firebase Storage rules allow write access.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (isAdding) {
        const id = doc(collection(db, collectionName)).id;
        await setDoc(doc(db, collectionName, id), editForm);
      } else if (isEditing) {
        await updateDoc(doc(db, collectionName, isEditing), editForm);
      }
      setIsEditing(null);
      setIsAdding(false);
      setEditForm({});
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, collectionName);
    }
  };

  const handleDelete = async (id: string) => {
    if (true) {
      try { await deleteDoc(doc(db, collectionName, id)); }
      catch (err) { handleFirestoreError(err, OperationType.DELETE, collectionName); }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="font-bold text-2xl">{title}</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
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
          <button onClick={() => { setIsAdding(true); setIsEditing(null); setEditForm({ title: "", description: "", type: "Page", category: "Governance", link: "" }); }} className="bg-[var(--color-4h-green)] text-white px-4 py-2 flex-1 sm:flex-none justify-center rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition text-sm whitespace-nowrap">
            <Plus size={16} /> Add Document
          </button>
        </div>
      </div>

      <AnimatePresence>
        {(isAdding || isEditing) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-50 dark:bg-[#151515] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{isAdding ? 'Add Document' : 'Edit Document'}</h3>
              <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input type="text" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-1">Type</label>
                <select value={editForm.type || 'Page'} onChange={e => setEditForm({...editForm, type: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]">
                  <option value="Page">Page (Link)</option>
                  <option value="Download">Download (File)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Category</label>
                <input type="text" value={editForm.category || ''} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] h-20 resize-none" />
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="block text-sm font-semibold mb-1">Document Link / File</label>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <input type="text" value={editForm.link || ''} onChange={e => setEditForm({...editForm, link: e.target.value})} placeholder="https://..." className="flex-1 w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" />
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">OR</span>
                  <label className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer px-4 py-3 rounded-xl font-semibold text-sm transition text-center whitespace-nowrap">
                    {isUploading ? "Uploading..." : "Upload File"}
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="px-6 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={isUploading} className="bg-[var(--color-4h-green)] text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 text-sm"><Save size={16} /> Save</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'list' ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {items.map(item => (
            <div key={item.id} className="py-4 flex gap-4 items-center justify-between group">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold truncate text-slate-900 dark:text-white">{item.title}</h4>
                <p className="text-sm text-slate-500 truncate">{item.category} • {item.type}</p>
              </div>
              <div className="flex gap-2">
                {item.link && (
                  <button
                    onClick={() => { recordDocumentAccess(item.id); setViewingDocument(item); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-green-100 hover:text-green-600 transition-colors"
                    title="View"
                  >
                    <Eye size={16} />
                  </button>
                )}
                <button 
                  onClick={() => { setIsEditing(item.id); setIsAdding(false); setEditForm({...item}); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                  title="Edit"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-100 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && !isAdding && <p className="text-slate-500 py-8 text-center text-sm">No items found.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col group">
              <div className="flex-1 min-w-0 mb-4">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">{item.title}</h4>
                <p className="text-sm text-slate-500 line-clamp-2">{item.description}</p>
              </div>
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">{item.category}</span>
                  <span className="text-xs font-semibold bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] px-2 py-1 rounded">{item.type}</span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.link && (
                    <button
                      onClick={() => { recordDocumentAccess(item.id); setViewingDocument(item); }}
                      className="w-10 flex items-center justify-center py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-green-100 hover:text-green-600 transition-colors"
                      title="View"
                    >
                      <Eye size={14} />
                    </button>
                  )}
                  <button 
                    onClick={() => { setIsEditing(item.id); setIsAdding(false); setEditForm({...item}); }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 hover:text-blue-600 transition-colors text-xs font-bold text-slate-600"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="w-10 flex items-center justify-center py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-100 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && !isAdding && <p className="col-span-full text-slate-500 py-8 text-center text-sm">No items found.</p>}
        </div>
      )}

      {/* Document View Modal */}
      <AnimatePresence>
        {viewingDocument && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[75vh] h-[75vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex-none bg-white/80 dark:bg-[#111]/80 backdrop-blur-md p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center z-10">
                <div className="flex-1 min-w-0 mr-4">
                  <h3 className="font-bold text-lg sm:text-xl truncate">{viewingDocument.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{viewingDocument.category} • {viewingDocument.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  {viewingDocument.link && (
                    <a href={viewingDocument.link} target="_blank" rel="noreferrer" download className="flex items-center gap-2 bg-[var(--color-4h-green)] text-white px-3 py-2 sm:px-4 rounded-xl font-bold hover:bg-green-700 transition">
                      <Download size={16} /> <span className="hidden sm:inline">Download</span>
                    </a>
                  )}
                  <button onClick={() => setViewingDocument(null)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition">
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-grow bg-slate-50 dark:bg-[#0a0a0a] overflow-hidden rounded-b-3xl">
                {viewingDocument.link ? (
                  viewingDocument.link.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) || (viewingDocument.link.includes('alt=media&token=') && !viewingDocument.link.toLowerCase().includes('.pdf') && !viewingDocument.link.toLowerCase().match(/\.(doc|docx|ppt|pptx|xls|xlsx)($|\?)/i)) ? (
                    <div className="w-full h-full overflow-auto flex items-center justify-center p-6">
                        <img src={viewingDocument.link} alt={viewingDocument.title} className="max-w-full max-h-full object-contain rounded-xl shadow-sm border border-slate-200 dark:border-slate-800" />
                    </div>
                  ) : viewingDocument.link.toLowerCase().match(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx)($|\?)/i) || viewingDocument.link.includes('alt=media&token=') ? (
                    <iframe 
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewingDocument.link)}&embedded=true`} 
                      className="w-full h-full border-0 bg-white" 
                      title={viewingDocument.title}
                    />
                  ) : (
                    <iframe 
                      src={viewingDocument.link} 
                      className="w-full h-full border-0 bg-white" 
                      title={viewingDocument.title}
                    />
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <FileText size={48} className="mb-4 opacity-50" />
                    <p>No document link available.</p>
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

export function NewsTab() {
  const collectionName = "news";
  const [items, setItems] = useState<NewsItem[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<NewsItem>>({});
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isAdding || isEditing) {
      document.getElementById('dashboard-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isAdding, isEditing]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, collectionName), snap => {
      const arr: NewsItem[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as NewsItem));
      setItems(arr.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, err => handleFirestoreError(err, OperationType.GET, collectionName));
    return () => unsub();
  }, []);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentMedia = editForm.media || [];
    if (currentMedia.length + files.length > 10) {
      alert("You can only upload up to 10 files.");
      return;
    }

    setIsUploading(true);
    const newMedia = [...currentMedia];

    const uploadPromises = Array.from(files as FileList).map(async (file: File) => {
      const isVideo = file.type.startsWith('video/');
      const fileRef = ref(storage, `news/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      newMedia.push({ url: downloadURL, type: isVideo ? 'video' : 'image', name: file.name });
    });

    try {
      await Promise.all(uploadPromises);
      setEditForm({ ...editForm, media: newMedia });
      alert("All files uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to upload some files. Make sure Firebase Storage rules allow write access.");
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const removeMedia = (index: number) => {
    const newMedia = [...(editForm.media || [])];
    newMedia.splice(index, 1);
    setEditForm({ ...editForm, media: newMedia });
  };

  const handleSave = async () => {
    try {
      if (isAdding) {
        const id = doc(collection(db, collectionName)).id;
        await setDoc(doc(db, collectionName, id), editForm);
      } else if (isEditing) {
        await updateDoc(doc(db, collectionName, isEditing), editForm);
      }
      setIsEditing(null);
      setIsAdding(false);
      setEditForm({});
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, collectionName);
    }
  };

  const handleDelete = async (id: string) => {
    if (true) {
      try { await deleteDoc(doc(db, collectionName, id)); }
      catch (err) { handleFirestoreError(err, OperationType.DELETE, collectionName); }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="font-bold text-2xl">News & Press</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
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
          <button onClick={() => { setIsAdding(true); setIsEditing(null); setEditForm({ title: "", excerpt: "", content: "", date: new Date().toISOString().split('T')[0], category: "General", media: [] }); setUploadProgress({}); }} className="bg-[var(--color-4h-green)] text-white px-4 py-2 flex-1 sm:flex-none justify-center rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition text-sm whitespace-nowrap">
            <Plus size={16} /> Add News
          </button>
        </div>
      </div>

      <AnimatePresence>
        {(isAdding || isEditing) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-50 dark:bg-[#151515] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{isAdding ? 'Add News' : 'Edit News'}</h3>
              <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input type="text" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Excerpt (Short Description - shown in list)</label>
                <textarea value={editForm.excerpt || ''} onChange={e => setEditForm({...editForm, excerpt: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] h-20 resize-none" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Full Content (shown in detail view)</label>
                <textarea value={editForm.content || ''} onChange={e => setEditForm({...editForm, content: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] h-40 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Date (YYYY-MM-DD)</label>
                <input type="date" value={editForm.date || ''} onChange={e => setEditForm({...editForm, date: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Category</label>
                <input list="news-categories-list" type="text" value={editForm.category || ''} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" placeholder="Select or type new category" />
                <datalist id="news-categories-list">
                  {Array.from(new Set(items.map(item => item.category).filter(Boolean))).map((cat, idx) => (
                    <option key={idx} value={cat} />
                  ))}
                </datalist>
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="block text-sm font-semibold mb-1">Media (up to 10 photos/videos)</label>
                <div className="flex flex-wrap gap-4 mb-2">
                  {(editForm.media || []).map((m, idx) => (
                    <div key={idx} className="relative w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden group border border-slate-300 dark:border-slate-700 font-sans">
                      {m.type === 'video' ? (
                        <video src={m.url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={m.url} alt="media" className="w-full h-full object-cover" />
                      )}
                      <button onClick={() => removeMedia(idx)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {(editForm.media || []).length < 10 && (
                    <label className="w-24 h-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center cursor-pointer hover:border-[var(--color-4h-green)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} disabled={isUploading} />
                      {isUploading ? <span className="text-xs text-slate-400">Wait...</span> : <Plus className="text-slate-400" />}
                    </label>
                  )}
                </div>
                {Object.keys(uploadProgress).length > 0 && (
                  <div className="text-sm text-slate-500 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                    {Object.entries(uploadProgress).map(([name, prog]) => (
                      <div key={name} className="flex items-center gap-2">
                        <div className="flex-1 text-xs truncate">{name}</div>
                        <div className="w-32 h-2 bg-slate-300 dark:bg-slate-600 rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--color-4h-green)]" style={{ width: `${prog}%` }}></div>
                        </div>
                        <div className="text-xs w-8 text-right">{Math.round(prog as number)}%</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-1 mt-4">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Or legacy image URL:</span>
                    <input type="text" value={editForm.image || ''} onChange={e => setEditForm({...editForm, image: e.target.value})} placeholder="https://..." className="w-full text-sm bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)]" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="px-6 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={isUploading} className="bg-[var(--color-4h-green)] text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 text-sm"><Save size={16} /> Save</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'list' ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {items.map(item => (
            <div key={item.id} className="py-4 flex gap-4 items-center justify-between group">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold truncate text-slate-900 dark:text-white">{item.title}</h4>
                <p className="text-sm text-slate-500 truncate">{item.date} • {item.category} • {(item.media?.length || 0)} media files</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setIsEditing(item.id); setIsAdding(false); setEditForm({...item}); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                  title="Edit"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-100 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && !isAdding && <p className="text-slate-500 py-8 text-center text-sm">No items found.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col group">
              <div className="flex items-center gap-3 mb-4">
                {(item.image || (item.media && item.media[0])) ? (
                  <img src={item.image || item.media![0].url} alt={item.title} referrerPolicy="no-referrer" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                    <ImageIcon size={24} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{item.date}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 flex-1">
                {item.excerpt || item.content}
              </p>
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">{item.category}</span>
                  <span className="text-xs font-semibold text-slate-500">{(item.media?.length || 0)} media</span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setIsEditing(item.id); setIsAdding(false); setEditForm({...item}); }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 hover:text-blue-600 transition-colors text-xs font-bold text-slate-600"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="w-10 flex items-center justify-center py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-100 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && !isAdding && <p className="col-span-full text-slate-500 py-8 text-center text-sm">No items found.</p>}
        </div>
      )}
    </div>
  );
}

export function PillarsDashboardTab() {
  const collectionName = "pillars";
  const [items, setItems] = useState<PillarItem[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PillarItem>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [editTab, setEditTab] = useState("general"); // general | events | projects | visual | media
  const [expandedAlbumIdx, setExpandedAlbumIdx] = useState<number | null>(null);
  const [expandedEventIdx, setExpandedEventIdx] = useState<number | null>(null);
  const [expandedProjectIdx, setExpandedProjectIdx] = useState<number | null>(null);
  
  const [hasSeeded, setHasSeeded] = useState(false);

  useEffect(() => {
    if (isAdding || isEditing) {
      document.getElementById('dashboard-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isAdding, isEditing]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, collectionName), snap => {
      const arr: PillarItem[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as PillarItem));
      arr.sort((a, b) => (a.order || 0) - (b.order || 0));
      setItems(arr);
    }, err => handleFirestoreError(err, OperationType.GET, collectionName));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (items.length === 0 && !hasSeeded) {
      const defaultPillars = [
        { 
          id: "agriculture", 
          title: "Agriculture", 
          description: "Promoting modern farming techniques, food security, and sustainable agricultural practices.", 
          icon: "Tractor", 
          image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1000&auto=format&fit=crop",
          extendedDescription: "Our Agriculture pillar focuses on integrating technology with traditional farming to create a sustainable, high-yield food system for our community. We provide hands-on workshops, modern drone crop monitoring sessions, and community gardening programs that empower the youth to take an active role in food security. Through partnerships with local farms, members get real-world experience in agronomy, hydroponics, and sustainable ecosystem management.",
          heroVideo: "https://www.youtube.com/watch?v=2UrcEqxZt38",
          highlightImages: [
            { name: "Urban Garden", url: "https://images.unsplash.com/photo-1530836369250-ef71a3f5e9ce?q=80&w=600&auto=format&fit=crop" },
            { name: "Drone Farming", url: "https://images.unsplash.com/photo-1554104707-a7ea0ce7dc3e?q=80&w=600&auto=format&fit=crop" },
            { name: "Hydroponics Startup", url: "https://images.unsplash.com/photo-1585250484964-bce248085d34?q=80&w=600&auto=format&fit=crop" },
            { name: "Community Farm", url: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=600&auto=format&fit=crop" }
          ],
          sampleProjects: [
            { title: "Community Hydroponics Initiative" },
            { title: "Smart Farming & Soil Sensors Workshop" },
            { title: "Urban Gardening Mentorship" },
            { title: "Youth Farmers Market" }
          ],
          upcomingEvents: [
            { title: "Intro to Drone Mapping", date: "2026-06-15", description: "Learn how to fly and use drones for crop health mapping." },
            { title: "Harvest Festival", date: "2026-08-20", description: "Celebrating local yields and showcasing youth agricultural projects." }
          ],
          media: [
            { name: "Urban Garden", type: "image", url: "https://images.unsplash.com/photo-1530836369250-ef71a3f5e9ce?q=80&w=600&auto=format&fit=crop" },
            { name: "Drone Farming", type: "image", url: "https://images.unsplash.com/photo-1554104707-a7ea0ce7dc3e?q=80&w=600&auto=format&fit=crop" },
            { name: "Hydroponics Startup", type: "image", url: "https://images.unsplash.com/photo-1585250484964-bce248085d34?q=80&w=600&auto=format&fit=crop" }
          ]
        },
        { id: "stem", title: "Science, Technology, Engineering, and Mathematics (STEM)", description: "Fostering innovation and critical thinking through technology and scientific exploration.", icon: "Microscope", image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop" },
        { id: "education", title: "Education", description: "Empowering communities through continuous learning and capability building.", icon: "GraduationCap", image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop" },
        { id: "environmental", title: "Environmental", description: "Advocating for conservation, climate action, and sustainable ecosystems.", icon: "TreePine", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop" },
        { id: "health-recreation", title: "Well-being", description: "Promoting health, nutrition, sports, and recreational activities for holistic well-being.", icon: "Activity", image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1000&auto=format&fit=crop" },
        { id: "community-service", title: "Community Service", description: "Engaging in volunteerism, social responsibility, and community outreach.", icon: "HeartHandshake", image: "https://images.unsplash.com/photo-1593113511867-b50aba8f7142?q=80&w=1000&auto=format&fit=crop" },
        { id: "arts-culture", title: "Arts and Culture", description: "Preserving heritage and celebrating creativity through various art forms.", icon: "Palette", image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=1000&auto=format&fit=crop" }
      ];

      const seedData = async () => {
        try {
          // Delay by a second to ensure snapshot had time to load existing
          setTimeout(async () => {
            const tempDoc = await getDoc(doc(db, "settings", "seeded"));
            if (!tempDoc.exists()) {
               await setDoc(doc(db, "settings", "seeded"), { seeded: true });
               for (const p of defaultPillars) {
                 await setDoc(doc(db, collectionName, p.id), p);
               }
            } else {
               // Update agriculture with example if missing extended details
               const agDocRef = doc(db, collectionName, "agriculture");
               const agDocSnap = await getDoc(agDocRef);
               if (agDocSnap.exists()) {
                 const data = agDocSnap.data() as PillarItem;
                 if (!data.extendedDescription) {
                   await updateDoc(agDocRef, {
                      extendedDescription: defaultPillars[0].extendedDescription,
                      sampleProjects: defaultPillars[0].sampleProjects,
                      upcomingEvents: defaultPillars[0].upcomingEvents,
                      media: defaultPillars[0].media
                   });
                 }
               }
            }
          }, 1000);
        } catch (err) { }
      };
      seedData();
      setHasSeeded(true);
    } else if (items.length > 0 && !hasSeeded) {
      // Just check agriculture to update the default example
      const updateExample = async () => {
         try {
             const agDocRef = doc(db, collectionName, "agriculture");
             const agDocSnap = await getDoc(agDocRef);
             if (agDocSnap.exists()) {
               const data = agDocSnap.data() as PillarItem;
               if (!data.extendedDescription) {
                 await updateDoc(agDocRef, {
                    extendedDescription: "Our Agriculture pillar focuses on integrating technology with traditional farming to create a sustainable, high-yield food system for our community. We provide hands-on workshops, modern drone crop monitoring sessions, and community gardening programs that empower the youth to take an active role in food security. Through partnerships with local farms, members get real-world experience in agronomy, hydroponics, and sustainable ecosystem management.",
                    heroVideo: "https://www.youtube.com/watch?v=2UrcEqxZt38", // some random educational or placeholder video (maybe big buck bunny)
                    highlightImages: [
                      { name: "Urban Garden", url: "https://images.unsplash.com/photo-1530836369250-ef71a3f5e9ce?q=80&w=600&auto=format&fit=crop" },
                      { name: "Drone Farming", url: "https://images.unsplash.com/photo-1554104707-a7ea0ce7dc3e?q=80&w=600&auto=format&fit=crop" },
                      { name: "Hydroponics Startup", url: "https://images.unsplash.com/photo-1585250484964-bce248085d34?q=80&w=600&auto=format&fit=crop" },
                      { name: "Community Farm", url: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=600&auto=format&fit=crop" }
                    ],
                    sampleProjects: [
                      { title: "Community Hydroponics Initiative", image: "https://images.unsplash.com/photo-1530836369250-ef71a3f5e9ce?q=80&w=600&auto=format&fit=crop" },
                      { title: "Smart Farming & Soil Sensors Workshop", image: "https://images.unsplash.com/photo-1554104707-a7ea0ce7dc3e?q=80&w=600&auto=format&fit=crop" },
                      { title: "Urban Gardening Mentorship", image: "https://images.unsplash.com/photo-1585250484964-bce248085d34?q=80&w=600&auto=format&fit=crop" },
                      { title: "Youth Farmers Market", image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=600&auto=format&fit=crop" }
                    ],
                    upcomingEvents: [
                      { title: "Intro to Drone Mapping", date: "2026-06-15", description: "Learn how to fly and use drones for crop health mapping." },
                      { title: "Harvest Festival", date: "2026-08-20", description: "Celebrating local yields and showcasing youth agricultural projects." }
                    ],
                    media: [
                      { name: "Urban Garden", type: "image", url: "https://images.unsplash.com/photo-1530836369250-ef71a3f5e9ce?q=80&w=600&auto=format&fit=crop" },
                      { name: "Drone Farming", type: "image", url: "https://images.unsplash.com/photo-1554104707-a7ea0ce7dc3e?q=80&w=600&auto=format&fit=crop" },
                      { name: "Hydroponics Startup", type: "image", url: "https://images.unsplash.com/photo-1585250484964-bce248085d34?q=80&w=600&auto=format&fit=crop" }
                    ]
                 });
               }
             }
         } catch (e) {}
      };
      updateExample();
      setHasSeeded(true);
    }
  }, [items.length, hasSeeded]);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentMedia = editForm.media || [];
    if (currentMedia.length + files.length > 20) {
      alert("You can only upload up to 20 files.");
      return;
    }

    setIsUploading(true);
    const newMedia = [...currentMedia];

    const uploadPromises = Array.from(files as FileList).map(async (file: File) => {
      const isVideo = file.type.startsWith('video/');
      const fileRef = ref(storage, `pillars/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      newMedia.push({ url: downloadURL, type: isVideo ? 'video' : 'image', name: file.name });
    });

    try {
      await Promise.all(uploadPromises);
      setEditForm({ ...editForm, media: newMedia });
      alert("All files uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to upload some files.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const payload = { ...editForm };
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (payload.upcomingEvents) {
        payload.upcomingEvents = payload.upcomingEvents.map((ev: any) => {
          const evDate = new Date(ev.date);
          return {
             ...ev,
             isArchived: ev.isArchived || (ev.date && evDate < today)
          };
        });
      }

      if (isAdding) {
        const id = doc(collection(db, collectionName)).id;
        await setDoc(doc(db, collectionName, id), {...payload, order: items.length});
      } else if (isEditing) {
        await updateDoc(doc(db, collectionName, isEditing), payload);
      }
      setIsAdding(false);
      setIsEditing(null);
      setEditForm({});
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, collectionName);
    }
  };

  const handleMovePillar = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const current = newItems[index];
    newItems.splice(index, 1);
    newItems.splice(direction === 'up' ? index - 1 : index + 1, 0, current);
    try {
       for (let i = 0; i < newItems.length; i++) {
          await updateDoc(doc(db, collectionName, newItems[i].id), { order: i });
       }
    } catch (err) {
       handleFirestoreError(err, OperationType.UPDATE, collectionName);
    }
  };

  const handleDelete = async (id: string) => {
    if (true) {
      try { await deleteDoc(doc(db, collectionName, id)); }
      catch (err) { handleFirestoreError(err, OperationType.DELETE, collectionName); }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="font-bold text-2xl">Pillars</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
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
          <button onClick={() => { setIsAdding(true); setIsEditing(null); setEditForm({}); setEditTab("general"); }} className="bg-[var(--color-4h-green)] text-white px-4 py-2 flex-1 sm:flex-none justify-center rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition text-sm whitespace-nowrap">
            <Plus size={16} /> Add Pillar
          </button>
        </div>
      </div>

      <AnimatePresence>
        {(isAdding || isEditing) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-50 dark:bg-[#151515] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-8 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{isAdding ? 'Add Pillar' : 'Edit Pillar'}</h3>
              <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
            </div>
            
            {/* TABS HEADER */}
            <div className="flex overflow-x-auto gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2 custom-scrollbar">
              {[
                { id: "general", label: "General Info", icon: <Info size={16}/> },
                { id: "events", label: "Activities & Events", icon: <Calendar size={16}/> },
                { id: "projects", label: "Projects", icon: <CheckCircle2 size={16}/> },
                { id: "visuals", label: "Hero & Highlights", icon: <ImageIcon size={16}/> },
                { id: "media", label: "Media & Pictures", icon: <Film size={16}/> },
                { id: "archive", label: "Archive", icon: <Archive size={16}/> }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={(e) => { e.preventDefault(); setEditTab(tab.id); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    editTab === tab.id 
                      ? 'bg-[var(--color-4h-green)] text-white shadow-md' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6 relative min-h-[300px] content-start">
              {editTab === "general" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Title</label>
                    <input type="text" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Icon Name (lucide-react)</label>
                    <input type="text" value={editForm.icon || ''} onChange={e => setEditForm({...editForm, icon: e.target.value})} placeholder="e.g. Heart, Tractor" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-1">Short Description</label>
                    <textarea value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] h-20 resize-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-1">Extended Description / Plan</label>
                    <textarea value={editForm.extendedDescription || ''} onChange={e => setEditForm({...editForm, extendedDescription: e.target.value})} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] h-32 resize-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-1">Cover Photo (General Info)</label>
                    <div className="flex items-center gap-4">
                      {editForm.image && <img src={editForm.image} alt="Cover" className="h-16 w-16 object-cover rounded-xl border border-slate-200" />}
                      <input 
                        type="file" 
                        accept="image/*"
                        disabled={isUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploading(true);
                          try {
                            const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
                            const storage = getStorage();
                            const fileRef = ref(storage, `pillars/cover_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`);
                            await uploadBytes(fileRef, file);
                            const url = await getDownloadURL(fileRef);
                            setEditForm({...editForm, image: url});
                            alert("Cover photo uploaded successfully!");
                          } catch (err) {
                            console.error(err);
                            alert("Failed to upload cover photo.");
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </>
              )}
              {editTab === "events" && (
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold">Activities / Upcoming Events</h4>
                    <button onClick={(e) => {
                      e.preventDefault();
                      const newEvs = [...(editForm.upcomingEvents || []), { title: "", date: "", timeStart: "", timeEnd: "", description: "" }];
                      setEditForm({...editForm, upcomingEvents: newEvs});
                      setExpandedEventIdx(newEvs.length - 1);
                    }} className="text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition">
                      <Plus size={16} /> Add Event
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(editForm.upcomingEvents || []).map((ev, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col gap-3 relative">
                        {expandedEventIdx === idx ? (
                          <>
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-bold text-sm text-[var(--color-4h-green)]">Edit Event</h5>
                              <button onClick={(e) => { e.preventDefault(); setExpandedEventIdx(null); }} className="text-slate-500 hover:text-slate-700 bg-slate-100 dark:bg-slate-800 p-1 rounded-md"><X size={16}/></button>
                            </div>
                            <input type="text" placeholder="Event Title" value={ev.title} onChange={e => {
                              const newEvs = [...(editForm.upcomingEvents || [])];
                              newEvs[idx].title = e.target.value;
                              setEditForm({...editForm, upcomingEvents: newEvs});
                            }} className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 px-2 py-1 outline-none font-semibold text-sm focus:border-[var(--color-4h-green)] pr-10" />
                            <div className="flex gap-4 items-center">
                              <div className="flex-1 flex gap-2">
                                <input type="date" value={ev.date} onChange={e => {
                                  const newEvs = [...(editForm.upcomingEvents || [])];
                                  newEvs[idx].date = e.target.value;
                                  setEditForm({...editForm, upcomingEvents: newEvs});
                                }} className="bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm flex-1" />
                                <input type="time" value={ev.timeStart || ev.time || ''} onChange={e => {
                                  const newEvs = [...(editForm.upcomingEvents || [])];
                                  newEvs[idx].timeStart = e.target.value;
                                  // Clear old time to migrate cleanly
                                  delete newEvs[idx].time;
                                  setEditForm({...editForm, upcomingEvents: newEvs});
                                }} className="bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm w-32" title="Time Start" />
                                <input type="time" value={ev.timeEnd || ''} onChange={e => {
                                  const newEvs = [...(editForm.upcomingEvents || [])];
                                  newEvs[idx].timeEnd = e.target.value;
                                  setEditForm({...editForm, upcomingEvents: newEvs});
                                }} className="bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm w-32" title="Time End" />
                              </div>
                              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer whitespace-nowrap">
                                <input type="checkbox" checked={ev.isArchived || false} onChange={e => {
                                  const newEvs = [...(editForm.upcomingEvents || [])];
                                  newEvs[idx].isArchived = e.target.checked;
                                  setEditForm({...editForm, upcomingEvents: newEvs});
                                }} className="w-4 h-4 rounded text-green-600 focus:ring-green-500" />
                                Archived
                              </label>
                              <input type="text" placeholder="Year (e.g. 2024)" value={ev.year || ''} onChange={e => {
                                const newEvs = [...(editForm.upcomingEvents || [])];
                                newEvs[idx].year = e.target.value;
                                setEditForm({...editForm, upcomingEvents: newEvs});
                              }} className="w-24 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm" />
                            </div>
                            <textarea placeholder="Event Description..." value={ev.description} onChange={e => {
                              const newEvs = [...(editForm.upcomingEvents || [])];
                              newEvs[idx].description = e.target.value;
                              setEditForm({...editForm, upcomingEvents: newEvs});
                            }} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] h-20 resize-none text-sm" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <input type="text" placeholder="Location/Venue" value={ev.location || ''} onChange={e => {
                                const newEvs = [...(editForm.upcomingEvents || [])];
                                newEvs[idx].location = e.target.value;
                                setEditForm({...editForm, upcomingEvents: newEvs});
                              }} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm" />
                              <input type="text" placeholder="Video Link (YouTube URL)" value={ev.videoLink || ''} onChange={e => {
                                const newEvs = [...(editForm.upcomingEvents || [])];
                                newEvs[idx].videoLink = e.target.value;
                                setEditForm({...editForm, upcomingEvents: newEvs});
                              }} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm" />
                            </div>
                            
                            <div className="flex items-center gap-2 mt-2">
                              <input type="text" placeholder="Event Cover Image URL (Optional)" value={ev.image || ''} onChange={e => {
                                const newEvs = [...(editForm.upcomingEvents || [])];
                                newEvs[idx].image = e.target.value;
                                setEditForm({...editForm, upcomingEvents: newEvs});
                              }} className="flex-1 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm" />
                              <label className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer px-3 py-2 rounded-lg flex items-center gap-1 text-xs font-semibold">
                                 <ImageIcon size={14} /> Upload
                                 <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={async (e) => {
                                   const file = e.target.files?.[0];
                                   if (!file) return;
                                   setIsUploading(true);
                                   try {
                                     const fileRef = ref(storage, `pillars/events_${Date.now()}_${file.name}`);
                                     await uploadBytes(fileRef, file);
                                     const url = await getDownloadURL(fileRef);
                                     const newEvs = [...(editForm.upcomingEvents || [])];
                                     newEvs[idx].image = url;
                                     setEditForm({...editForm, upcomingEvents: newEvs});
                                   } catch (err) { alert("Upload failed"); } 
                                   finally { setIsUploading(false); }
                                 }} />
                              </label>
                            </div>
                            {ev.image && <img src={ev.image} alt="Event Preview" className="h-20 w-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700 mt-2" />}
                            
                            {/* Gallery Photos */}
                            <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                              <h5 className="font-semibold text-sm mb-2 text-slate-700 dark:text-slate-300">Gallery Photos</h5>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {(ev.photos || []).map((p: any, pIdx: number) => (
                                  <div key={pIdx} className="relative group">
                                    <img src={p.url} className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                                    <button onClick={(e) => {
                                      e.preventDefault();
                                      const newEvs = [...(editForm.upcomingEvents || [])];
                                      newEvs[idx].photos!.splice(pIdx, 1);
                                      setEditForm({...editForm, upcomingEvents: newEvs});
                                    }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                  </div>
                                ))}
                              </div>
                              <label className="inline-flex bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer px-3 py-2 rounded-lg items-center gap-1 text-xs font-semibold">
                                 <Plus size={14} /> Add Photo
                                 <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={async (e) => {
                                   const file = e.target.files?.[0];
                                   if (!file) return;
                                   setIsUploading(true);
                                   try {
                                     const fileRef = ref(storage, `pillars/events/photos_${Date.now()}_${file.name}`);
                                     await uploadBytes(fileRef, file);
                                     const url = await getDownloadURL(fileRef);
                                     const newEvs = [...(editForm.upcomingEvents || [])];
                                     if (!newEvs[idx].photos) newEvs[idx].photos = [];
                                     newEvs[idx].photos!.push({url});
                                     setEditForm({...editForm, upcomingEvents: newEvs});
                                   } catch (err) { alert("Upload failed"); } 
                                   finally { setIsUploading(false); }
                                 }} />
                              </label>
                            </div>

                            {/* Documents */}
                            <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                              <h5 className="font-semibold text-sm mb-2 text-slate-700 dark:text-slate-300">Attached Documents</h5>
                              <div className="flex flex-col gap-2 mb-3">
                                {(ev.documents || []).map((d: any, dIdx: number) => (
                                  <div key={dIdx} className="flex items-center justify-between bg-slate-50 dark:bg-black p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <a href={d.url} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline">{d.title}</a>
                                    <button onClick={(e) => {
                                      e.preventDefault();
                                      const newEvs = [...(editForm.upcomingEvents || [])];
                                      newEvs[idx].documents!.splice(dIdx, 1);
                                      setEditForm({...editForm, upcomingEvents: newEvs});
                                    }} className="text-red-500 hover:bg-red-50 p-1 rounded-md"><Trash2 size={14}/></button>
                                  </div>
                                ))}
                              </div>
                              <label className="inline-flex bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer px-3 py-2 rounded-lg items-center gap-1 text-xs font-semibold">
                                 <Plus size={14} /> Add Document
                                 <input type="file" className="hidden" accept=".pdf,.doc,.docx" disabled={isUploading} onChange={async (e) => {
                                   const file = e.target.files?.[0];
                                   if (!file) return;
                                   setIsUploading(true);
                                   try {
                                     const fileRef = ref(storage, `pillars/events/docs_${Date.now()}_${file.name}`);
                                     await uploadBytes(fileRef, file);
                                     const url = await getDownloadURL(fileRef);
                                     const newEvs = [...(editForm.upcomingEvents || [])];
                                     if (!newEvs[idx].documents) newEvs[idx].documents = [];
                                     newEvs[idx].documents!.push({title: file.name, url});
                                     setEditForm({...editForm, upcomingEvents: newEvs});
                                   } catch (err) { alert("Upload failed"); } 
                                   finally { setIsUploading(false); }
                                 }} />
                              </label>
                            </div>
                          </>
                        ) : (
                          <div className="flex gap-4 items-center">
                            {ev.image ? (
                              <img src={ev.image} alt={ev.title} className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700 flex-shrink-0" />
                            ) : (
                              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0"><ImageIcon size={24} /></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-sm truncate">{ev.title || 'Untitled Event'}</h5>
                              <p className="text-xs text-slate-500 mt-1 truncate">
                                {ev.date || 'No date'} {ev.location && <span className="ml-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{ev.location}</span>}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1 flex gap-2">
                                <span>{ev.photos ? ev.photos.length : 0} photos</span>
                                <span>{ev.documents ? ev.documents.length : 0} docs</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                               <button onClick={(e) => { e.preventDefault(); setExpandedEventIdx(idx); }} className="text-slate-500 hover:text-blue-500 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 p-2 rounded-md transition-colors"><Edit2 size={16}/></button>
                               <button onClick={(e) => {
                                 e.preventDefault();
                                 if(false) return;
                                 const newEvs = [...(editForm.upcomingEvents || [])];
                                 newEvs.splice(idx, 1);
                                 setEditForm({...editForm, upcomingEvents: newEvs});
                               }} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 p-2 rounded-md transition-colors"><Trash2 size={16}/></button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {(!editForm.upcomingEvents || editForm.upcomingEvents.length === 0) && (
                      <p className="text-sm text-slate-500 py-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">No events added yet. Click "Add Event" to start.</p>
                    )}
                  </div>
                </div>
              )}
              {editTab === "projects" && (
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold">Projects</h4>
                    <button onClick={(e) => {
                      e.preventDefault();
                      const newProjs = [...(editForm.sampleProjects || []), { title: "" }];
                      setEditForm({...editForm, sampleProjects: newProjs});
                    }} className="text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition">
                      <Plus size={16} /> Add Project
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(editForm.sampleProjects || []).map((proj, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col gap-3 relative">
                        {expandedProjectIdx === idx ? (
                          <>
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="font-bold text-sm text-[var(--color-4h-green)]">Edit Project</h5>
                              <button onClick={(e) => { e.preventDefault(); setExpandedProjectIdx(null); }} className="text-slate-500 hover:text-slate-700 bg-slate-100 dark:bg-slate-800 p-1 rounded-md"><X size={16}/></button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input type="text" value={proj.title || ''} onChange={e => {
                                const newProjs = [...(editForm.sampleProjects || [])];
                                newProjs[idx] = { ...newProjs[idx], title: e.target.value };
                                setEditForm({...editForm, sampleProjects: newProjs});
                              }} placeholder="Project Title *" className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm" />

                              <input type="text" value={proj.tagline || ''} onChange={e => {
                                const newProjs = [...(editForm.sampleProjects || [])];
                                newProjs[idx] = { ...newProjs[idx], tagline: e.target.value };
                                setEditForm({...editForm, sampleProjects: newProjs});
                              }} placeholder="Tagline" className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm" />

                              <div className="md:col-span-2">
                                <textarea placeholder="About the Project / Description" value={proj.about || ''} onChange={e => {
                                  const newProjs = [...(editForm.sampleProjects || [])];
                                  newProjs[idx] = { ...newProjs[idx], about: e.target.value };
                                  setEditForm({...editForm, sampleProjects: newProjs});
                                }} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] h-20 resize-none text-sm" />
                              </div>

                              <div className="md:col-span-2">
                                <textarea placeholder="Objective" value={proj.objective || ''} onChange={e => {
                                  const newProjs = [...(editForm.sampleProjects || [])];
                                  newProjs[idx] = { ...newProjs[idx], objective: e.target.value };
                                  setEditForm({...editForm, sampleProjects: newProjs});
                                }} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] h-16 resize-none text-sm" />
                              </div>

                              <div className="md:col-span-2">
                                <textarea placeholder="Impact" value={proj.impact || ''} onChange={e => {
                                  const newProjs = [...(editForm.sampleProjects || [])];
                                  newProjs[idx] = { ...newProjs[idx], impact: e.target.value };
                                  setEditForm({...editForm, sampleProjects: newProjs});
                                }} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] h-16 resize-none text-sm" />
                              </div>

                              <select value={proj.status || 'Active'} onChange={e => {
                                const newProjs = [...(editForm.sampleProjects || [])];
                                newProjs[idx] = { ...newProjs[idx], status: e.target.value };
                                setEditForm({...editForm, sampleProjects: newProjs});
                              }} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm">
                                <option value="Planning">Planning</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="On Hold">On Hold</option>
                              </select>

                              <input type="text" placeholder="Year" value={proj.year || ''} onChange={e => {
                                const newProjs = [...(editForm.sampleProjects || [])];
                                newProjs[idx].year = e.target.value;
                                setEditForm({...editForm, sampleProjects: newProjs});
                              }} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm" />

                              <input type="text" placeholder="Downloadable PDF URL" value={proj.downloadUrl || ''} onChange={e => {
                                const newProjs = [...(editForm.sampleProjects || [])];
                                newProjs[idx] = { ...newProjs[idx], downloadUrl: e.target.value };
                                setEditForm({...editForm, sampleProjects: newProjs});
                              }} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm" />

                              <input type="text" placeholder="Sustainability Plan Summary" value={proj.sustainabilityPlan || ''} onChange={e => {
                                const newProjs = [...(editForm.sampleProjects || [])];
                                newProjs[idx] = { ...newProjs[idx], sustainabilityPlan: e.target.value };
                                setEditForm({...editForm, sampleProjects: newProjs});
                              }} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm" />

                              <div className="md:col-span-2">
                                <textarea placeholder="Acknowledgment Zone" value={proj.acknowledgment || ''} onChange={e => {
                                  const newProjs = [...(editForm.sampleProjects || [])];
                                  newProjs[idx] = { ...newProjs[idx], acknowledgment: e.target.value };
                                  setEditForm({...editForm, sampleProjects: newProjs});
                                }} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] h-16 resize-none text-sm" />
                              </div>

                              <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden md:col-span-2">
                                <input type="text" placeholder="Call To Action Text (e.g. Partner With Us)" value={proj.callToAction?.text || ''} onChange={e => {
                                  const newProjs = [...(editForm.sampleProjects || [])];
                                  newProjs[idx] = { ...newProjs[idx], callToAction: { ...newProjs[idx].callToAction, text: e.target.value, url: newProjs[idx].callToAction?.url || '' } };
                                  setEditForm({...editForm, sampleProjects: newProjs});
                                }} className="flex-1 bg-slate-50 dark:bg-black border-r border-slate-200 dark:border-slate-700 px-3 py-2 outline-none focus:border-[var(--color-4h-green)] text-sm" />
                                <input type="text" placeholder="CTA URL" value={proj.callToAction?.url || ''} onChange={e => {
                                  const newProjs = [...(editForm.sampleProjects || [])];
                                  newProjs[idx] = { ...newProjs[idx], callToAction: { ...newProjs[idx].callToAction, text: newProjs[idx].callToAction?.text || '', url: e.target.value } };
                                  setEditForm({...editForm, sampleProjects: newProjs});
                                }} className="flex-1 bg-slate-50 dark:bg-black px-3 py-2 outline-none focus:border-[var(--color-4h-green)] text-sm" />
                              </div>

                              <div className="md:col-span-2 flex items-center gap-2">
                                <input type="text" placeholder="Project Image URL (Optional)" value={proj.image || ''} onChange={e => {
                                  const newProjs = [...(editForm.sampleProjects || [])];
                                  newProjs[idx] = { ...newProjs[idx], image: e.target.value };
                                  setEditForm({...editForm, sampleProjects: newProjs});
                                }} className="flex-1 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm" />
                                <MediaLibraryPicker onSelect={(media) => {
                                  const url = Array.isArray(media) ? media[0].url : media.url;
                                  const newProjs = [...(editForm.sampleProjects || [])];
                                  newProjs[idx] = { ...newProjs[idx], image: url };
                                  setEditForm({...editForm, sampleProjects: newProjs});
                                }}>
                                  <div className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer px-3 py-2 rounded-lg flex items-center gap-1 text-xs font-semibold">
                                    <ImageIcon size={14} /> Choose Image
                                  </div>
                                </MediaLibraryPicker>
                              </div>

                              <label className="md:col-span-2 flex items-center gap-2 text-sm font-semibold cursor-pointer w-max">
                                <input type="checkbox" checked={proj.isArchived || false} onChange={e => {
                                  const newProjs = [...(editForm.sampleProjects || [])];
                                  newProjs[idx].isArchived = e.target.checked;
                                  setEditForm({...editForm, sampleProjects: newProjs});
                                }} className="w-4 h-4 rounded text-green-600 focus:ring-green-500" />
                                Mark as Archived
                              </label>

                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 w-full">
                              {proj.image ? (
                                <img src={proj.image} alt={proj.title} className="w-12 h-12 rounded bg-slate-100 object-cover" />
                              ) : (
                                <div className="w-12 h-12 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                  <ImageIcon size={20} />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{proj.title || "Untitled Project"}</p>
                                <p className="text-xs text-slate-500 truncate">{proj.tagline || proj.status || proj.year || "No summary"}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={(e) => { e.preventDefault(); setExpandedProjectIdx(idx); }} className="text-slate-500 hover:text-blue-500 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 p-2 rounded-md transition-colors"><Edit2 size={16}/></button>
                                <button onClick={(e) => {
                                  e.preventDefault();
                                  const newProjs = [...(editForm.sampleProjects || [])];
                                  newProjs.splice(idx, 1);
                                  setEditForm({...editForm, sampleProjects: newProjs});
                                }} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 p-2 rounded-md transition-colors"><Trash2 size={16}/></button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {(!editForm.sampleProjects || editForm.sampleProjects.length === 0) && (
                      <p className="text-sm text-slate-500 py-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">No projects added yet.</p>
                    )}
                  </div>
                </div>
              )}

              {editTab === "visuals" && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-1">Pillar Profile Picture (Paste URL or Upload)</label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <input type="text" value={editForm.profilePicture || ''} onChange={e => setEditForm({...editForm, profilePicture: e.target.value})} placeholder="Profile picture image URL for the pillar icon" className="flex-1 w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] text-sm" />
                      <span className="text-slate-400 text-sm font-medium">OR</span>
                      <MediaLibraryPicker onSelect={(media) => {
                          const url = Array.isArray(media) ? media[0].url : media.url;
                          setEditForm({...editForm, profilePicture: url});
                      }}>
                        <div className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-3 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition text-sm w-full sm:w-auto justify-center">
                          <ImageIcon size={16} /> Choose Image
                        </div>
                      </MediaLibraryPicker>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-1">Hero Cover Image (Paste URL or Upload)</label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <input type="text" value={editForm.image || ''} onChange={e => setEditForm({...editForm, image: e.target.value})} placeholder="Main cover image for the pillar (URL)" className="flex-1 w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] text-sm" />
                      <span className="text-slate-400 text-sm font-medium">OR</span>
                      <MediaLibraryPicker onSelect={(media) => {
                          const url = Array.isArray(media) ? media[0].url : media.url;
                          setEditForm({...editForm, image: url});
                      }}>
                        <div className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-3 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition text-sm w-full sm:w-auto justify-center">
                          <ImageIcon size={16} /> Choose Cover Image
                        </div>
                      </MediaLibraryPicker>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-1">Hero Video URL (Optional Landscape Video)</label>
                    <input type="text" value={editForm.heroVideo || ''} onChange={e => setEditForm({...editForm, heroVideo: e.target.value})} placeholder="e.g. YouTube URL or direct link for Landscape Video" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-1">Highlight Pictures (Featured visually)</label>
                    <div className="bg-slate-50 dark:bg-[#151515] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <MediaLibraryPicker allowMultiple onSelect={(media) => {
                         const medias = Array.isArray(media) ? media : [media];
                         const newHighlights = [...(editForm.highlightImages || [])];
                         medias.forEach(m => newHighlights.push({ url: m.url, name: m.name }));
                         setEditForm({...editForm, highlightImages: newHighlights});
                      }}>
                        <div className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold text-[var(--color-4h-green)] inline-flex items-center">
                          Choose Highlight Pictures
                        </div>
                      </MediaLibraryPicker>
                      
                      {editForm.highlightImages && editForm.highlightImages.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {editForm.highlightImages.map((img, idx) => (
                            <div key={idx} className="relative rounded-lg overflow-hidden group aspect-video shadow-sm border border-slate-200 dark:border-slate-700">
                              <img src={img.url} className="w-full h-full object-cover" />
                              <button onClick={(e) => {
                                e.preventDefault();
                                const newArr = [...editForm.highlightImages!];
                                newArr.splice(idx, 1);
                                setEditForm({...editForm, highlightImages: newArr});
                              }} className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition shadow-sm"><Trash2 size={14}/></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {editTab === "media" && (
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold">Media Albums</h4>
                    <button onClick={(e) => {
                      e.preventDefault();
                      const newAlbums = [...(editForm.albums || []), { id: Date.now().toString(), title: "", media: [] }];
                      setEditForm({...editForm, albums: newAlbums});
                    }} className="text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition">
                      <Plus size={16} /> Add Album
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {(editForm.albums || []).map((album, aIdx) => (
                      <div key={album.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl relative overflow-hidden">
                        {expandedAlbumIdx !== aIdx ? (
                          <div className="flex items-center gap-4 p-4">
                            {album.cover ? (
                               <img src={album.cover} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" alt="Cover" />
                            ) : (
                               <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                 <ImageIcon size={20} className="text-slate-400" />
                               </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-base truncate">{album.title || "Untitled Album"}</h5>
                              <p className="text-sm text-slate-500 truncate">{album.media?.length || 0} media items {album.date ? `• ${album.date}` : ''}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                               <button onClick={(e) => {
                                 e.preventDefault();
                                 setExpandedAlbumIdx(aIdx);
                               }} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg flex items-center gap-1 text-sm font-semibold border border-blue-100 dark:border-blue-900">
                                 <Edit2 size={16} /> Edit
                               </button>
                               <button onClick={(e) => {
                                 e.preventDefault();
                                 const newAlbums = [...(editForm.albums || [])];
                                 newAlbums.splice(aIdx, 1);
                                 setEditForm({...editForm, albums: newAlbums});
                               }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg flex items-center gap-1 text-sm font-semibold border border-red-100 dark:border-red-900">
                                 <Trash2 size={16} />
                               </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4">
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                               <h5 className="font-bold text-lg text-[var(--color-4h-green)]">Edit Album</h5>
                               <button onClick={(e) => {
                                 e.preventDefault();
                                 setExpandedAlbumIdx(null);
                               }} className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-bold border border-blue-100">
                                 Done
                               </button>
                            </div>
                            
                            <button onClick={(e) => {
                              e.preventDefault();
                              const newAlbums = [...(editForm.albums || [])];
                              newAlbums.splice(aIdx, 1);
                              setEditForm({...editForm, albums: newAlbums});
                              setExpandedAlbumIdx(null);
                            }} className="absolute top-4 right-20 text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-lg"><Trash2 size={16}/></button>
                            
                            <div className="grid md:grid-cols-2 gap-3 mb-4 pr-10">
                           <input type="text" placeholder="Album Title" value={album.title} onChange={e => {
                              const newAlbums = [...(editForm.albums || [])];
                              newAlbums[aIdx].title = e.target.value;
                              setEditForm({...editForm, albums: newAlbums});
                           }} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm font-semibold" />
                           <div className="flex gap-2">
                             <input type="date" placeholder="Date" value={album.date || ''} onChange={e => {
                                const newAlbums = [...(editForm.albums || [])];
                                newAlbums[aIdx].date = e.target.value;
                                setEditForm({...editForm, albums: newAlbums});
                             }} className="w-1/2 bg-white dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm" />
                             <input type="text" placeholder="Location" value={album.location || ''} onChange={e => {
                                const newAlbums = [...(editForm.albums || [])];
                                newAlbums[aIdx].location = e.target.value;
                                setEditForm({...editForm, albums: newAlbums});
                             }} className="w-1/2 bg-white dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm" />
                           </div>
                           
                           <div className="md:col-span-2">
                             <label className="block text-xs font-semibold mb-1 text-slate-500">Album Description</label>
                             <textarea placeholder="Write a short description..." value={album.description || ''} onChange={e => {
                                const newAlbums = [...(editForm.albums || [])];
                                newAlbums[aIdx].description = e.target.value;
                                setEditForm({...editForm, albums: newAlbums});
                             }} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm resize-none h-20" />
                           </div>

                           <div className="md:col-span-2">
                             <label className="block text-xs font-semibold mb-1 text-slate-500">Album Cover (Upload or URL)</label>
                             <div className="flex gap-2">
                               <input type="text" placeholder="Cover Image URL" value={album.cover || ''} onChange={e => {
                                  const newAlbums = [...(editForm.albums || [])];
                                  newAlbums[aIdx].cover = e.target.value;
                                  setEditForm({...editForm, albums: newAlbums});
                               }} className="flex-1 bg-white dark:bg-black border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg outline-none focus:border-[var(--color-4h-green)] text-sm" />
                               <MediaLibraryPicker onSelect={(media) => {
                                  const url = Array.isArray(media) ? media[0].url : media.url;
                                  const newAlbums = [...(editForm.albums || [])];
                                  newAlbums[aIdx].cover = url;
                                  setEditForm({...editForm, albums: newAlbums});
                               }}>
                                 <div className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer px-3 py-2 rounded-lg flex items-center gap-1 text-xs font-semibold whitespace-nowrap">
                                    <ImageIcon size={14} /> Choose Image
                                 </div>
                               </MediaLibraryPicker>
                             </div>
                           </div>
                        </div>

                        <div className="bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                            <span className="text-sm font-bold">Photos/Videos</span>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                               <div className="flex items-center gap-2 flex-1 sm:flex-auto">
                                 <input type="text" id={`video-link-${aIdx}`} placeholder="Paste Video URL" className="flex-1 sm:w-48 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded outline-none text-xs focus:border-[var(--color-4h-green)]" />
                                 <button onClick={(e) => {
                                    e.preventDefault();
                                    const inputNode = document.getElementById(`video-link-${aIdx}`) as HTMLInputElement;
                                    const url = inputNode?.value;
                                    if (url) {
                                       const newAlbums = [...(editForm.albums || [])];
                                       if (!newAlbums[aIdx].media) newAlbums[aIdx].media = [];
                                       newAlbums[aIdx].media.push({ url, type: 'video', description: '', date: new Date().toISOString().split('T')[0] });
                                       setEditForm({...editForm, albums: newAlbums});
                                       if (inputNode) inputNode.value = '';
                                    }
                                 }} className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded cursor-pointer hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 border-0 outline-none whitespace-nowrap">
                                    Add Link
                                 </button>
                               </div>
                               <MediaLibraryPicker allowMultiple onSelect={(media) => {
                                  const medias = Array.isArray(media) ? media : [media];
                                  const newAlbums = [...(editForm.albums || [])];
                                  if (!newAlbums[aIdx].media) newAlbums[aIdx].media = [];
                                  medias.forEach(m => newAlbums[aIdx].media.push({ 
                                    url: m.url, 
                                    type: m.type as "image" | "video", 
                                    description: '', 
                                    date: new Date().toISOString().split('T')[0] 
                                  }));
                                  setEditForm({...editForm, albums: newAlbums});
                               }}>
                                 <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded cursor-pointer hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 whitespace-nowrap inline-flex items-center gap-1">
                                    Upload Media
                                 </div>
                               </MediaLibraryPicker>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                             {(album.media || []).map((m, mIdx) => (
                               <div key={mIdx} className="flex flex-col sm:flex-row gap-3 border border-slate-100 dark:border-slate-800 rounded p-2 relative">
                                  {m.type === 'image' ? (
                                     <img src={m.url} className="w-16 h-16 object-cover rounded" />
                                  ) : (
                                     <video src={m.url} className="w-16 h-16 object-cover rounded" />
                                  )}
                                  <div className="flex-1 flex flex-col gap-1">
                                     <input type="text" placeholder="Title (e.g. Day 1)" value={m.title || ''} onChange={e => {
                                        const newAlbums = [...(editForm.albums || [])];
                                        if (!newAlbums[aIdx].media[mIdx]) return;
                                        newAlbums[aIdx].media[mIdx].title = e.target.value;
                                        setEditForm({...editForm, albums: newAlbums});
                                     }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded outline-none text-xs font-bold text-[var(--color-4h-green)] focus:border-[var(--color-4h-green)]" />
                                     <input type="text" placeholder="Short Description..." value={m.description || ''} onChange={e => {
                                        const newAlbums = [...(editForm.albums || [])];
                                        newAlbums[aIdx].media[mIdx].description = e.target.value;
                                        setEditForm({...editForm, albums: newAlbums});
                                     }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded outline-none text-xs" />
                                     <input type="date" value={m.date || ''} onChange={e => {
                                        const newAlbums = [...(editForm.albums || [])];
                                        newAlbums[aIdx].media[mIdx].date = e.target.value;
                                        setEditForm({...editForm, albums: newAlbums});
                                     }} className="w-32 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded outline-none text-xs" />
                                  </div>
                                  <button onClick={(e) => {
                                     e.preventDefault();
                                     const newAlbums = [...(editForm.albums || [])];
                                     newAlbums[aIdx].media.splice(mIdx, 1);
                                     setEditForm({...editForm, albums: newAlbums});
                                  }} className="text-red-500 hover:bg-red-50 p-1.5 rounded self-start"><X size={14}/></button>
                               </div>
                             ))}
                             {(!album.media || album.media.length === 0) && (
                               <div className="text-xs text-center py-2 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded">No media in this album.</div>
                             )}
                           </div>
                         </div>
                       </div>
                     )}
                   </div>
                 ))}
                    {(!editForm.albums || editForm.albums.length === 0) && (
                      <p className="text-sm text-slate-500 py-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl mt-4">No albums created yet.</p>
                    )}
                  </div>
                </div>
              )}

              {editTab === "archive" && (
                <div className="md:col-span-2">
                  <div className="mb-6">
                    <h4 className="font-bold mb-4">Archived Activities & Events</h4>
                    <div className="space-y-4">
                      {Array.from(new Set((editForm.upcomingEvents || []).filter(ev => ev.isArchived).map(ev => ev.year || 'Unknown Year'))).sort((a: any,b: any) => b.localeCompare(a)).map(year => (
                        <div key={year} className="bg-slate-50 dark:bg-[#111] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                           <h5 className="font-bold text-lg mb-3 text-[var(--color-4h-green)]">{year}</h5>
                           <div className="space-y-2">
                             {(editForm.upcomingEvents || []).filter(ev => ev.isArchived && (ev.year || 'Unknown Year') === year).map((ev, idx) => (
                               <div key={idx} className="flex justify-between items-center bg-white dark:bg-black p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                 <div>
                                   <div className="font-semibold text-sm">{ev.title} <span className="text-xs text-slate-500 ml-2">{ev.date}</span></div>
                                   <div className="text-xs text-slate-500 mt-1 line-clamp-1">{ev.description}</div>
                                 </div>
                               </div>
                             ))}
                           </div>
                        </div>
                      ))}
                      {(editForm.upcomingEvents || []).filter(ev => ev.isArchived).length === 0 && (
                        <p className="text-sm text-slate-500 italic">No archived events.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold mb-4">Archived Projects</h4>
                    <div className="space-y-4">
                      {Array.from(new Set((editForm.sampleProjects || []).filter(proj => proj.isArchived).map(proj => proj.year || 'Unknown Year'))).sort((a: any,b: any) => b.localeCompare(a)).map(year => (
                        <div key={year} className="bg-slate-50 dark:bg-[#111] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                           <h5 className="font-bold text-lg mb-3 text-[var(--color-4h-green)]">{year}</h5>
                           <div className="space-y-2">
                             {(editForm.sampleProjects || []).filter(proj => proj.isArchived && (proj.year || 'Unknown Year') === year).map((proj, idx) => (
                               <div key={idx} className="flex justify-between items-center bg-white dark:bg-black p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                 <div className="font-semibold text-sm">{proj.title}</div>
                               </div>
                             ))}
                           </div>
                        </div>
                      ))}
                      {(editForm.sampleProjects || []).filter(proj => proj.isArchived).length === 0 && (
                        <p className="text-sm text-slate-500 italic">No archived projects.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="px-6 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={isUploading} className="bg-[var(--color-4h-green)] text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 text-sm"><Save size={16} /> Save</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'list' ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {items.map((item, index) => (
            <div key={item.id} className="py-4 flex gap-4 items-center justify-between group">
              <div className="flex gap-4 items-center flex-1 min-w-0">
                <div className="w-10 h-10 bg-[var(--color-4h-green)]/10 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[var(--color-4h-green)] shrink-0 overflow-hidden">
                  {item.profilePicture ? (
                     <img src={item.profilePicture} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                     (() => {
                       const Icon = (lucideIcons as any)[item.icon] || LayoutDashboard;
                       return <Icon size={18} />;
                     })()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate text-slate-900 dark:text-white">{item.title}</h4>
                  <p className="text-sm text-slate-500 truncate">{item.icon} • {(item.sampleProjects?.length || 0)} projects • {(item.upcomingEvents?.length || 0)} events • {(item.media?.length || 0)} media</p>
                </div>
              </div>
              <div className="flex gap-2">
                {index > 0 && (
                   <button 
                     onClick={() => handleMovePillar(index, 'up')}
                     className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                     title="Move Up"
                   >
                     <ChevronUp size={16} />
                   </button>
                )}
                {index < items.length - 1 && (
                   <button 
                     onClick={() => handleMovePillar(index, 'down')}
                     className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                     title="Move Down"
                   >
                     <ChevronDown size={16} />
                   </button>
                )}
                <button 
                  onClick={() => { 
                    setIsEditing(item.id); 
                    setIsAdding(false); 
                    const normalizedItem = {...item};
                    if (normalizedItem.sampleProjects) {
                      normalizedItem.sampleProjects = normalizedItem.sampleProjects.map((p: any) => typeof p === 'string' ? { title: p } : p);
                    }
                    if (normalizedItem.upcomingEvents) {
                      normalizedItem.upcomingEvents = normalizedItem.upcomingEvents.map((e: any) => typeof e === 'string' ? { title: e, date: '', description: '' } : e);
                    }
                    setEditForm(normalizedItem); 
                    setEditTab("general"); 
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                  title="Edit"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-100 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && !isAdding && <p className="text-slate-500 py-8 text-center text-sm">No pillars found.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <div key={item.id} className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group">
              {item.image ? (
                <div className="h-32 w-full relative">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent"></div>
                  <div className="absolute top-2 right-2 flex gap-1 bg-black/30 backdrop-blur-sm rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {index > 0 && (
                         <button onClick={() => handleMovePillar(index, 'up')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 text-white" title="Move Up"><ChevronUp size={14} /></button>
                      )}
                      {index < items.length - 1 && (
                         <button onClick={() => handleMovePillar(index, 'down')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 text-white" title="Move Down"><ChevronDown size={14} /></button>
                      )}
                  </div>
                  <div className="absolute -bottom-6 left-5 w-12 h-12 bg-white dark:bg-[#111] rounded-xl flex items-center justify-center text-[var(--color-4h-green)] border border-slate-200 dark:border-slate-800 shadow-sm z-10 overflow-hidden">
                      {item.profilePicture ? (
                         <img src={item.profilePicture} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                         (() => {
                           const Icon = (lucideIcons as any)[item.icon] || LayoutDashboard;
                           return <Icon size={20} />;
                         })()
                      )}
                  </div>
                </div>
              ) : (
                <div className="h-32 w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                   <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {index > 0 && (
                         <button onClick={() => handleMovePillar(index, 'up')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500" title="Move Up"><ChevronUp size={14} /></button>
                      )}
                      {index < items.length - 1 && (
                         <button onClick={() => handleMovePillar(index, 'down')} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500" title="Move Down"><ChevronDown size={14} /></button>
                      )}
                  </div>
                  <div className="absolute -bottom-6 left-5 w-12 h-12 bg-white dark:bg-[#111] rounded-xl flex items-center justify-center text-[var(--color-4h-green)] border border-slate-200 dark:border-slate-800 shadow-sm z-10 overflow-hidden">
                      {item.profilePicture ? (
                         <img src={item.profilePicture} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                         (() => {
                           const Icon = (lucideIcons as any)[item.icon] || LayoutDashboard;
                           return <Icon size={20} />;
                         })()
                      )}
                  </div>
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col pt-8">
                <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{item.title}</h4>
                <p className="text-sm text-slate-500 line-clamp-2">{item.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{(item.sampleProjects?.length || 0)} projects</span>
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{(item.upcomingEvents?.length || 0)} events</span>
                </div>
              </div>
              <div className="flex gap-2 p-5 pt-0 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => { 
                    setIsEditing(item.id); 
                    setIsAdding(false); 
                    const normalizedItem = {...item};
                    if (normalizedItem.sampleProjects) {
                      normalizedItem.sampleProjects = normalizedItem.sampleProjects.map((p: any) => typeof p === 'string' ? { title: p } : p);
                    }
                    if (normalizedItem.upcomingEvents) {
                      normalizedItem.upcomingEvents = normalizedItem.upcomingEvents.map((e: any) => typeof e === 'string' ? { title: e, date: '', description: '' } : e);
                    }
                    setEditForm(normalizedItem); 
                    setEditTab("general"); 
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 hover:text-blue-600 transition-colors py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 mt-4"
                >
                  <Edit3 size={16} /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="w-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-red-100 hover:text-red-500 transition-colors py-2 rounded-xl text-slate-600 dark:text-slate-400 mt-4"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && !isAdding && <p className="text-slate-500 py-8 text-center text-sm col-span-full">No pillars found.</p>}
        </div>
      )}
    </div>
  );
}

export function StaffTab() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("secretary");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [passwordResets, setPasswordResets] = useState<any[]>([]);

  useEffect(() => {
    const unsubStaff = onSnapshot(collection(db, "staff"), snap => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setStaffMembers(arr);
    }, err => handleFirestoreError(err, OperationType.GET, "staff"));

    const unsubResets = onSnapshot(collection(db, "passwordResets"), snap => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      arr.sort((a,b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      setPasswordResets(arr);
    }, err => handleFirestoreError(err, OperationType.GET, "passwordResets"));

    return () => {
      unsubStaff();
      unsubResets();
    };
  }, []);

  const handleAssign = async () => {
    if (!email || password.length < 6) {
      setErrorMsg("Please provide a valid email and a password (min 6 characters).");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const { initializeApp } = await import("firebase/app");
      const { getAuth, createUserWithEmailAndPassword } = await import("firebase/auth");
      const { setDoc, doc } = await import("firebase/firestore");
      const { config, db } = await import("../lib/firebase");
      
      let tempUid = "";
      try {
        const tempApp = initializeApp(config, "TempApp" + Date.now());
        const tempAuth = getAuth(tempApp);
        const userCred = await createUserWithEmailAndPassword(tempAuth, email, password);
        tempUid = userCred.user.uid;
        await tempAuth.signOut();
      } catch (err: any) {
        if (err.code === "auth/email-already-in-use") {
          // If already in use, we still might want to update the role.
          // But we don't have the UID easily if we don't have a backend. 
          // So we should just save the role keyed by email or something.
        } else {
          throw err;
        }
      }
      
      // We will save staff role keyed by email since we might not have UID if they use Google Sign In
      await setDoc(doc(db, "staff", email.replace(/[@.]/g, "_")), {
        email: email,
        role: role,
        uid: tempUid || null,
        createdAt: new Date().toISOString(),
        requiresPasswordChange: true
      });
      
      setSuccessMsg(`Staff account (${role}) assigned successfully!`);
      setEmail("");
      setPassword("");
    } catch(err: any) {
      setErrorMsg(err.message || "Failed to create account. Make sure Email/Password sign-in is enabled in Firebase Console.");
    }
    setLoading(false);
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display">Staff Management</h2>
        <p className="text-sm text-slate-500">Create login credentials for other admins/staff members to access this dashboard.</p>
        <p className="text-sm text-[var(--color-4h-green)] mt-1 font-medium">Note: You must enable "Email/Password" sign-in provider in your Firebase Console for this to work.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Assign New Staff</h3>
          <div className="grid gap-4">
            {errorMsg && <div className="p-3 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl text-sm">{errorMsg}</div>}
            {successMsg && <div className="p-3 bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-xl text-sm">{successMsg}</div>}
            <div>
              <label className="block text-sm font-semibold mb-2">Staff Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" placeholder="staff@example.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Password (Min 6 chars)</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Role</label>
              <select value={role} onChange={e=>setRole(e.target.value)} className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]">
                <option value="admin">Admin</option>
                <option value="secretary">Secretary</option>
                <option value="treasurer">Treasurer</option>
                <option value="business">Business Manager</option>
              </select>
            </div>
            <button onClick={handleAssign} disabled={loading} className="bg-[var(--color-4h-green)] text-white px-6 py-3 rounded-xl font-bold mt-2 disabled:opacity-50 flex items-center justify-center gap-2">
              <UsersRound size={18} />
              {loading ? "Assigning..." : "Assign Staff Account"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
               <h3 className="font-bold">Current Staff Members</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {staffMembers.length === 0 && <div className="p-4 text-sm text-slate-500">No staff members assigned yet.</div>}
              {staffMembers.map(staff => (
                <div key={staff.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                   <div>
                      <div className="font-bold text-lg text-[var(--color-4h-green)] capitalize">{staff.role} Dashboard</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{staff.email}</div>
                   </div>
                   <div className="flex gap-2">
                     <Link to={staff.role === "admin" ? "/dashboard" : `/${staff.role}`} className="p-2 text-slate-400 hover:text-blue-500 bg-slate-100 dark:bg-slate-800 rounded-lg"><Eye size={16} /></Link>
                     <button onClick={async () => {
                       const { deleteDoc, doc } = await import("firebase/firestore");
                       try{ await deleteDoc(doc(db, "staff", staff.id)); }catch(e){console.error(e);}
                     }} className="p-2 text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-slate-800 rounded-lg"><Trash2 size={16} /></button>
                   </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
               <h3 className="font-bold">Password Reset Notifications</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {passwordResets.length === 0 && <div className="p-4 text-sm text-slate-500">No password reset requests.</div>}
              {passwordResets.map(reset => (
                <div key={reset.id} className="p-4 flex justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{reset.email}</div>
                    <div className="text-xs text-slate-500">{new Date(reset.requestedAt).toLocaleString()}</div>
                    <div className="text-[10px] text-green-600 font-bold uppercase mt-1">Firebase recovery email sent automatically</div>
                  </div>
                  <button onClick={async () => {
                    const { deleteDoc, doc } = await import("firebase/firestore");
                    try{ await deleteDoc(doc(db, "passwordResets", reset.id)); }catch(e){console.error(e);}
                  }} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessagesTab() {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "messages"), snap => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      // Sort by newest first
      arr.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toMillis() - a.createdAt.toMillis();
        }
        return 0;
      });
      setMessages(arr);
    }, err => handleFirestoreError(err, OperationType.GET, "messages"));
    return () => unsub();
  }, []);

  const markAsRead = async (id: string, currentStatus: string) => {
    if (currentStatus === "read") return;
    try {
      await updateDoc(doc(db, "messages", id), { status: "read" });
    } catch(err) {
      console.error(err);
    }
  };

  const deleteMessage = async (id: string) => {
    if(!confirm("Are you sure you want to delete this message?")) return;
    try {
      await deleteDoc(doc(db, "messages", id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between mb-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-[var(--color-ink)] dark:text-white flex items-center gap-2">
            <MessageSquare className="text-[var(--color-4h-green)]" /> Contact Messages
          </h2>
          <p className="text-slate-500 text-sm mt-1">Review and reply to messages sent from the Contact page.</p>
        </div>
      </div>

      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500">
            No messages found.
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={cn("p-6 rounded-2xl border transition-all", msg.status === "unread" ? "bg-white dark:bg-[#111] border-[var(--color-4h-green)]/30 shadow-md" : "bg-slate-50 dark:bg-[#0a0a0a] border-slate-200 dark:border-slate-800 opacity-80")}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1" onClick={() => markAsRead(msg.id, msg.status)}>
                  <div className="flex items-center gap-3 mb-2">
                    {msg.status === "unread" && <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-4h-green)] shrink-0 animate-pulse"></span>}
                    <h3 className="font-bold text-lg text-[var(--color-ink)] dark:text-white">{msg.subject || "No Subject"}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 mb-4">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{msg.name}</span>
                    <a href={`mailto:${msg.email}`} className="flex items-center gap-1 hover:text-[var(--color-4h-green)] transition-colors"><Mail size={14} /> {msg.email}</a>
                    <span className="flex items-center gap-1"><Calendar size={14} /> {msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleString() : "Unknown date"}</span>
                  </div>
                  <div className="bg-white dark:bg-black p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
                    {msg.message}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 md:flex-col shrink-0 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-4">
                  <a href={`mailto:${msg.email}?subject=Re: ${msg.subject || 'Your Message to 4-H'}`} onClick={() => markAsRead(msg.id, msg.status)} className="flex items-center justify-center gap-2 bg-[var(--color-4h-green)] hover:bg-[#1a5b3c] text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors w-full">
                    <Reply size={16} /> Reply
                  </a>
                  <button onClick={() => deleteMessage(msg.id)} className="flex items-center justify-center bg-slate-200 hover:bg-red-500 hover:text-white dark:bg-slate-800 dark:hover:bg-red-600 text-slate-600 dark:text-slate-400 px-4 py-2 rounded-xl text-sm font-bold transition-colors w-full">
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
