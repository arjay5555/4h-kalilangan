import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogIn, LogOut, Package, Menu, ChevronLeft, LayoutDashboard, PackageCheck, Store, TrendingUp, ListOrdered, ShoppingCart, DollarSign, MonitorSmartphone, Filter, PieChart, Clock, ArrowUpRight, BarChart3, Receipt, Tag, Percent, Bell } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { signOut, User } from "firebase/auth";
import { collection, onSnapshot, getDoc, doc } from "firebase/firestore";
import { ShopDashboard, POSDashboardTab, ShopCatalogTab, InventoryTrackerTab, SalesReportTab, OrdersManagementTab, DiscountSettingsTab } from "../components/ShopDashboard";
import { Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Cell, Pie, PieChart as RePieChart } from 'recharts';
import { subDays, subMonths, isAfter, subYears, parseISO } from "date-fns";

function BusinessOverview() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [timeFrame, setTimeFrame] = useState<"all" | "7d" | "30d" | "90d" | "1y">("30d");

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, "orders"), snap => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setOrders(arr);
    }, err => handleFirestoreError(err, OperationType.GET, "orders"));

    const unsubProducts = onSnapshot(collection(db, "merchandise"), snap => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setProducts(arr);
    }, err => handleFirestoreError(err, OperationType.GET, "merchandise"));

    return () => {
      unsubOrders();
      unsubProducts();
    };
  }, []);

  const getFilteredOrders = () => {
    if (timeFrame === "all") return orders;
    const now = new Date();
    let cutoffDate = now;
    if (timeFrame === "7d") cutoffDate = subDays(now, 7);
    if (timeFrame === "30d") cutoffDate = subDays(now, 30);
    if (timeFrame === "90d") cutoffDate = subDays(now, 90);
    if (timeFrame === "1y") cutoffDate = subYears(now, 1);
    
    return orders.filter(o => o.date && isAfter(new Date(o.date), cutoffDate));
  };

  const filteredOrders = getFilteredOrders();
  
  const totalRevenue = filteredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const posSales = filteredOrders.filter(o => o.type === 'pos').reduce((acc, o) => acc + (o.total || 0), 0);
  const onlineSales = filteredOrders.filter(o => o.type !== 'pos').reduce((acc, o) => acc + (o.total || 0), 0);
  
  const inventoryValue = products.reduce((acc, prod) => {
    const price = prod.salePrice || prod.price || 0;
    let stock = 0;
    if (prod.variants && prod.variants.length > 0) {
      stock = prod.variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
    } else {
      stock = prod.stockQuantity || 0;
    }
    return acc + (stock * price);
  }, 0);

  const lowStockItems = products
    .map(prod => {
      let stock = 0;
      if (prod.variants && prod.variants.length > 0) {
        stock = prod.variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
      } else {
         stock = prod.stockQuantity || 0;
      }
      return { ...prod, totalStock: stock };
    })
    .filter(p => p.totalStock < 10)
    .sort((a,b) => a.totalStock - b.totalStock)
    .slice(0, 5);

  const recentTransactions = [...filteredOrders]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const pieData = [
    { name: 'POS/Physical', value: posSales, color: '#3b82f6' }, // blue-500
    { name: 'Online Sales', value: onlineSales, color: '#6366f1' }, // indigo-500
  ].filter(d => d.value > 0);

  const stuckOrdersList = orders.filter((o: any) => {
    const isCompleted = o.status === 'completed' || o.status === 'delivered' || o.status === 'canceled' || o.status === 'cancelled' || o.status === 'returned'; 
    if (isCompleted) return false;
    
    const lastUpdated = o.updatedAt ? new Date(o.updatedAt) : new Date(o.date);
    const msSinceUpdate = new Date().getTime() - lastUpdated.getTime();
    const daysSinceUpdate = msSinceUpdate / (1000 * 60 * 60 * 24);
    
    if (o.type === 'web' && daysSinceUpdate >= 3) return true;
    if ((o.type === 'web-pre-order' || o.type === 'pos-pre-order' || o.type === 'pre-order') && daysSinceUpdate >= 10) return true;
    
    return false;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Business Overview</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Key metrics and performance indicators</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {stuckOrdersList.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 max-w-sm truncate" title={stuckOrdersList.map(o => `Order #${o.id.slice(0,8)}`).join(', ')}>
               <Clock size={16} className="shrink-0" />
               <span className="truncate">Alert: {stuckOrdersList.length} delayed order(s) ({stuckOrdersList.map(o => `#${o.id.slice(0,8)}`).join(', ')})</span>
            </div>
          )}
          <div className="flex items-center bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
            <Filter size={14} className="text-slate-400 ml-2 mr-1" />
            {[
              { id: "7d", label: "7d" },
              { id: "30d", label: "30d" },
              { id: "90d", label: "90d" },
              { id: "1y", label: "1y" },
              { id: "all", label: "All" },
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => setTimeFrame(tf.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${timeFrame === tf.id ? 'bg-[var(--color-4h-green)] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] rounded-2xl">
                  <DollarSign size={24} />
               </div>
            </div>
            <div>
               <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Revenue</div>
               <div className="text-3xl font-display font-black text-slate-900 dark:text-white">₱ {totalRevenue.toLocaleString()}</div>
            </div>
         </div>
         
         <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                  <MonitorSmartphone size={24} />
               </div>
            </div>
            <div>
               <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Online Sales</div>
               <div className="text-3xl font-display font-black text-slate-900 dark:text-white">₱ {onlineSales.toLocaleString()}</div>
            </div>
         </div>

         <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                  <Store size={24} />
               </div>
            </div>
            <div>
               <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">POS / Physical</div>
               <div className="text-3xl font-display font-black text-slate-900 dark:text-white">₱ {posSales.toLocaleString()}</div>
            </div>
         </div>

         <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                  <Package size={24} />
               </div>
            </div>
            <div>
               <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Inventory Value</div>
               <div className="text-3xl font-display font-black text-slate-900 dark:text-white">₱ {inventoryValue.toLocaleString()}</div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Channel */}
        <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm lg:col-span-1 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <PieChart size={20} className="text-slate-400" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Revenue by Channel</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center">
            {pieData.length > 0 ? (
              <div className="w-full h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
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
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: number) => `₱ ${val.toLocaleString()}`} 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 font-medium">No revenue data available</div>
            )}
            
            <div className="w-full mt-4 space-y-3">
               {pieData.map(d => (
                 <div key={d.name} className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                     <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{d.name}</span>
                   </div>
                   <span className="text-sm font-black text-slate-900 dark:text-white">₱ {d.value.toLocaleString()}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2">
                <Receipt size={20} className="text-slate-400" />
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Recent Transactions</h3>
             </div>
          </div>
          <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-y-auto">
             {recentTransactions.map(t => (
               <div key={t.id} className="py-4 flex justify-between items-center group">
                 <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.type === 'pos' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500'}`}>
                      {t.type === 'pos' ? <Store size={18} /> : <MonitorSmartphone size={18} />}
                   </div>
                   <div>
                     <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                       Order #{t.id.slice(0,8).toUpperCase()}
                       <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-black ${
                         t.status === 'completed' || t.status === 'delivered' ? 'bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)]' 
                         : t.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                         : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                       }`}>
                         {t.status || 'pending'}
                       </span>
                     </div>
                     <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Clock size={12}/> {new Date(t.date).toLocaleString()} • {t.items?.length || 0} items</div>
                   </div>
                 </div>
                 <div className="font-black text-slate-900 dark:text-white text-right">
                   ₱ {(t.total || 0).toLocaleString()}
                 </div>
               </div>
             ))}
             {recentTransactions.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                 <Receipt size={32} className="opacity-20 mb-3" />
                 <p className="text-sm font-medium">No transactions found</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Inventory Snapshot */}
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <Tag size={20} className="text-slate-400" />
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Inventory Snapshot (Low Stock)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Stock</th>
                <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {lowStockItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#151515] transition-colors">
                  <td className="py-3 px-1">
                    <div className="flex items-center gap-3">
                      {item.images && item.images.length > 0 ? (
                        <img src={item.images[0]} alt="" className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><Package size={14} className="text-slate-400" /></div>
                      )}
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[200px]">{item.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-1 text-right font-black text-sm">
                    {item.totalStock}
                  </td>
                  <td className="py-3 px-1 text-right">
                    {item.totalStock <= 0 ? (
                      <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-md font-bold border border-red-200 dark:border-red-900/50">Out of Stock</span>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-md font-bold border border-yellow-200 dark:border-yellow-900/50">Low Stock</span>
                    )}
                  </td>
                </tr>
              ))}
              {lowStockItems.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500 font-medium">All products are well stocked.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}

type TabType = "overview" | "shop" | "pos" | "inventory" | "sales" | "orders" | "discounts";

export default function BusinessManagerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, "orders"), snap => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setOrders(arr);
    });

    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u && u.email) {
        const staffRef = doc(db, "staff", u.email.replace(/[@.]/g, "_"));
        const staffSnap = await getDoc(staffRef);
        if (staffSnap.exists()) {
          setUserRole(staffSnap.data().role);
        }
      }
      setLoading(false);
    });
    return () => {
       unsub();
       unsubOrders();
    };
  }, []);

  const stuckOrdersCount = orders.filter((o: any) => {
    const isCompleted = o.status === 'completed' || o.status === 'delivered' || o.status === 'canceled' || o.status === 'cancelled' || o.status === 'returned'; 
    if (isCompleted) return false;
    
    const lastUpdated = o.updatedAt ? new Date(o.updatedAt) : new Date(o.date);
    const msSinceUpdate = new Date().getTime() - lastUpdated.getTime();
    const daysSinceUpdate = msSinceUpdate / (1000 * 60 * 60 * 24);
    
    if (o.type === 'web' && daysSinceUpdate >= 3) return true;
    if ((o.type === 'web-pre-order' || o.type === 'pos-pre-order' || o.type === 'pre-order') && daysSinceUpdate >= 10) return true;
    
    return false;
  }).length;


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-black"></div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

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
              <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">Business Portal</span>
            </div>
          </Link>
          <button className="md:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded transition" onClick={() => setMenuOpen(false)}>
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 mt-4">
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 mt-4 px-2">Management</div>
          {([
            { id: "overview", icon: LayoutDashboard, label: "Overview" },
            { id: "pos", icon: Store, label: "POS Terminal" },
            { id: "shop", icon: Package, label: "Product Catalog" },
            { id: "orders", icon: ShoppingCart, label: "Orders" },
            { id: "inventory", icon: ListOrdered, label: "Inventory Tracker" },
            { id: "sales", icon: TrendingUp, label: "Sales Report" },
            { id: "discounts", icon: Percent, label: "Discount Settings" },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as TabType); setMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all text-sm ${activeTab === tab.id ? 'bg-[var(--color-4h-green)] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <div className="flex items-center gap-3">
                <tab.icon size={18} />
                {tab.label}
              </div>
              {tab.id === 'orders' && stuckOrdersCount > 0 && (
                 <div className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                   {stuckOrdersCount}
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
                className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" 
                title="Notifications"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {stuckOrdersCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#111]"></span>}
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
                        {stuckOrdersCount > 0 && <span className="text-xs font-bold bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] px-2 py-1 rounded-md">{stuckOrdersCount} New</span>}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {stuckOrdersCount > 0 && (
                          <div 
                            onClick={() => { setActiveTab("orders"); setShowNotifications(false); }}
                            className="p-4 border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-[#222] transition-colors cursor-pointer"
                          >
                            <p className="text-sm font-semibold truncate"><span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-2"></span>Stuck Orders ({stuckOrdersCount})</p>
                            <p className="text-xs text-slate-500 mt-1">There are delayed orders that need action.</p>
                          </div>
                        )}
                        {stuckOrdersCount === 0 && (
                           <div className="p-6 text-center text-sm text-slate-500">No new notifications.</div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-bold leading-none">{user.displayName || "Manager"}</span>
              <span className="text-xs text-slate-500">{user.email}</span>
            </div>
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=3b82f6&color=fff`} alt="User" className="w-9 h-9 rounded-full border-2 border-blue-500" />
          </div>
        </header>

        <div id="dashboard-scroll-area" className="flex-1 p-3 md:p-5 overflow-y-auto w-full">
          <div className="w-full max-w-none mx-auto pb-20 md:pb-0">
            <div className="bg-white dark:bg-[#111] rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[50vh]">
              {activeTab === "overview" && <BusinessOverview />}
              {activeTab === "shop" && <ShopCatalogTab />}
              {activeTab === "pos" && <POSDashboardTab />}
              {activeTab === "inventory" && <InventoryTrackerTab />}
              {activeTab === "sales" && <SalesReportTab />}
              {activeTab === "orders" && <OrdersManagementTab />}
              {activeTab === "discounts" && <DiscountSettingsTab />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
