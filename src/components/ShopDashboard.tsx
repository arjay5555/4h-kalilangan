import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus, Trash2, Edit3, Store, Save, X, Package, LayoutList, ShoppingCart, UsersRound, TrendingUp, Search, ToggleLeft, ToggleRight, Eye, MoreHorizontal, Star, ShoppingBag, ArrowUpRight, ArrowDownRight, ListFilter, Bold, Italic, List, Filter, ChevronDown, ChevronUp, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { db, storage, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { CrudTab } from "../pages/Dashboard";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText, FileSpreadsheet } from "lucide-react";

type Merchandise = { 
  id: string; 
  name: string; 
  price: number; 
  salePrice?: number;
  costPerItem?: number;
  sku?: string;
  supplier?: string;
  logisticsLocation?: string;
  logisticsWeight?: string;
  stockStatus?: string;
  category: string; 
  stockQuantity?: number;
  images?: string[]; 
  video?: string;
  aboutProduct?: string;
  productInformation?: string;
  hasMaterialAndCare?: boolean;
  material?: string;
  careLabel?: string;
  variants?: { id?: string; size?: string; color?: string; stock: number }[];
  isVisible?: boolean;
  soldQuantity?: number;
  rating?: number;
  description?: string;
};

function MarkdownTextarea({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleFormat = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.slice(start, end);
    const before = value.slice(0, start);
    const after = value.slice(end);

    const newText = `${before}${prefix}${selectedText}${suffix}${after}`;
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <div className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:border-[var(--color-4h-green)]">
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-[#151515]">
        <button
          type="button"
          onClick={() => handleFormat('**', '**')}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors"
          title="Bold"
        >
          <Bold size={16}/>
        </button>
        <button
          type="button"
          onClick={() => handleFormat('*', '*')}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors"
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
        <button
          type="button"
          onClick={() => handleFormat('- ')}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors"
          title="Bullet List"
        >
          <List size={16} />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 outline-none bg-transparent min-h-[160px] resize-y"
        placeholder={placeholder}
      />
    </div>
  );
}

export function ShopDashboard() {
  const [activeSubTab, setActiveSubTab] = useState("catalog");

  const subTabs = [
    { id: "catalog", label: "Product Catalog", icon: LayoutList },
    { id: "orders", label: "Order Management", icon: ShoppingCart },
    { id: "customers", label: "Customer Insights", icon: UsersRound },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-2xl">Shop Management</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
        {subTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                activeSubTab === tab.id 
                  ? "bg-[var(--color-4h-green)] text-white" 
                  : "bg-slate-100 dark:bg-[#151515] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-[#111] rounded-2xl">
        {activeSubTab === "catalog" && (
          <ShopCatalogTab />
        )}
        {activeSubTab === "orders" && (
          <div className="py-8 text-center text-slate-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Order Management</h3>
            <p className="max-w-md mx-auto">Track and fulfill shop orders.</p>
          </div>
        )}
        {activeSubTab === "customers" && (
          <div className="py-8 text-center text-slate-500">
            <UsersRound className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Customer Insights</h3>
            <p className="max-w-md mx-auto">View customer purchase history, preferences, and engagement metrics.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ShopCatalogTab() {
  const [items, setItems] = useState<Merchandise[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Merchandise>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [showSoldModal, setShowSoldModal] = useState(false);
  
  const [sortBy, setSortBy] = useState<"name" | "stock">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [variantColor, setVariantColor] = useState("");
  const [variantSize, setVariantSize] = useState("");
  const [variantStock, setVariantStock] = useState("");
  const [hasVarietyColor, setHasVarietyColor] = useState(false);
  const [hasVarietySize, setHasVarietySize] = useState(false);

  useEffect(() => {
    if (isAdding || isEditing) {
      document.getElementById('dashboard-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isAdding, isEditing]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "merchandise"), snap => {
      const arr: Merchandise[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as Merchandise));
      setItems(arr);
    }, err => handleFirestoreError(err, OperationType.GET, "merchandise"));
    return () => unsub();
  }, []);

  const openAddForm = () => {
    setIsAdding(true);
    setIsEditing(null);
    setSaveError(null);
    setIsNewCategory(false);
    setEditForm({ name: "", price: 0, salePrice: undefined, costPerItem: undefined, sku: "", stockStatus: "In Stock", category: "", images: [], video: "", aboutProduct: "", productInformation: "", isVisible: true, variants: [], hasMaterialAndCare: false, material: "100% Cotton", careLabel: "Care Instructions;\n- Handwash or machine wash on a gentle cycle with cold water\n- Do not soak for a long time\n- Do not use bleach, Wash separately in mild detergent." });
    setHasVarietyColor(false);
    setHasVarietySize(false);
    setVariantColor("");
    setVariantSize("");
    setVariantStock("");
  };

  const openEditForm = (item: Merchandise) => {
    setIsEditing(item.id);
    setIsAdding(false);
    setSaveError(null);
    setIsNewCategory(false);
    setEditForm({...item});
    
    const variants = item.variants || [];
    const hasColor = variants.some(v => !!v.color);
    const hasSize = variants.some(v => !!v.size);
    setHasVarietyColor(hasColor);
    setHasVarietySize(hasSize);
    setVariantColor("");
    setVariantSize("");
    setVariantStock("");
  };

  const categories = ["All", ...Array.from(new Set(items.map(i => i.category || "Uncategorized").filter(Boolean)))];
  const filteredItems = items.filter(i => {
    const totalStock = i.variants?.length ? i.variants.reduce((acc, v) => acc + v.stock, 0) : (i.stockQuantity || 0);
    if (filterLowStock && (totalStock === 0 || totalStock > 10)) return false;

    const matchCategory = selectedCategory === "All" || (i.category || "Uncategorized") === selectedCategory;
    const matchSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  }).sort((a, b) => {
    // Visibility sort always takes precedence: visible items first
    const aVisible = a.isVisible !== false; // defaults to true if undefined
    const bVisible = b.isVisible !== false;
    
    if (aVisible && !bVisible) return -1;
    if (!aVisible && bVisible) return 1;

    // Then handle standard sort based on selected sortBy and sortOrder
    const modifier = sortOrder === "asc" ? 1 : -1;
    
    if (sortBy === "name") {
      return a.name.localeCompare(b.name) * modifier;
    } else { // sortBy === "stock"
      const aStock = a.variants?.length ? a.variants.reduce((acc, v) => acc + v.stock, 0) : (a.stockQuantity || 0);
      const bStock = b.variants?.length ? b.variants.reduce((acc, v) => acc + v.stock, 0) : (b.stockQuantity || 0);
      return (aStock - bStock) * modifier;
    }
  });

  const handleSave = async () => {
    setSaveError(null);
    try {
      const cleanData = Object.fromEntries(
        Object.entries(editForm).map(([k, v]) => [k, v === undefined ? null : v])
      ) as Partial<Merchandise>;
      
      const isDuplicate = items.some(i => {
        if (isEditing && i.id === isEditing) return false;
        if (cleanData.sku && cleanData.sku.trim() !== '' && i.sku === cleanData.sku) return true;
        return false;
      });

      if (isDuplicate) {
        setSaveError("Not available. Change the SKU because it is already existing.");
        return;
      }

      const formTotalStock = cleanData.variants?.length ? cleanData.variants.reduce((acc, v) => acc + v.stock, 0) : (cleanData.stockQuantity || 0);
      if (formTotalStock <= 0) {
        cleanData.stockStatus = "Out of Stock";
      }

      if (isAdding) {
        const generatedId = doc(collection(db, "merchandise")).id;
        const finalId = (cleanData.sku && cleanData.sku.trim() !== '') ? cleanData.sku.trim().replace(/\//g, '-') : generatedId;
        await setDoc(doc(db, "merchandise", finalId), cleanData);
      } else if (isEditing) {
        await updateDoc(doc(db, "merchandise", isEditing), cleanData);
      }
      setIsEditing(null);
      setIsAdding(false);
      setEditForm({});
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "merchandise");
    }
  };

  const handleDelete = async (id: string) => {
    try { await deleteDoc(doc(db, "merchandise", id)); }
    catch (err) { handleFirestoreError(err, OperationType.DELETE, "merchandise"); }
  };

  const toggleVisibility = async (item: Merchandise) => {
    try {
      await updateDoc(doc(db, "merchandise", item.id), {
        isVisible: item.isVisible === false ? true : false
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "merchandise");
    }
  };

  const lowStockCount = items.filter(item => {
    const stock = item.variants?.length ? item.variants.reduce((acc, v) => acc + v.stock, 0) : (item.stockQuantity || 0);
    return stock > 0 && stock <= 10;
  }).length;

  const totalSold = items.reduce((acc, item) => acc + (item.soldQuantity || 0), 0);

  const calculateAverageMargin = () => {
    if (items.length === 0) return 0;
    let totalMargin = 0;
    let validItems = 0;
    items.forEach(i => {
       if (i.price > 0 && i.costPerItem && i.costPerItem > 0) {
           totalMargin += (i.price - i.costPerItem) / i.price;
           validItems++;
       }
    });
    return validItems === 0 ? 0 : Math.round((totalMargin / validItems) * 100);
  };
  const avgMargin = calculateAverageMargin();

  return (
    <div>
      {/* Header Area */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white shrink-0">All Product List</h2>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Product" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 transition-all font-medium text-sm"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative">
            <div 
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151515] text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
              title="Filter by Category"
            >
              <Filter size={18} />
            </div>
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Filter by Category"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                cat !== "All" && <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center bg-white dark:bg-[#151515] rounded-xl border border-slate-200 dark:border-slate-800 p-1">
            <div className="relative">
              <div 
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer" 
                title="Sort by"
              >
                <ArrowUpDown size={16} />
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as "name" | "stock")}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="Sort by"
              >
                <option value="name">Sort by Name</option>
                <option value="stock">Sort by Stock</option>
              </select>
            </div>
            <button
               onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
               className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
               title={`Toggle order (currently ${sortOrder})`}
            >
              {sortOrder === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            </button>
          </div>
          
          <button 
            onClick={openAddForm} 
            className="bg-[var(--color-4h-green)] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition shadow-sm text-sm"
          >
            <Plus size={16} /> New Product
          </button>
        </div>
      </div>

      {/* Statistics Area */}
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-8 overflow-x-auto no-scrollbar">
        <h3 className="text-lg font-bold mb-6 flex items-center justify-between">Product Statistic</h3>
        <div className="flex flex-nowrap items-center gap-8 min-w-max pb-2">
          
          <div className="flex-1">
            <div className="text-slate-500 text-sm font-medium mb-1">Active Product</div>
            <div className="text-2xl font-bold flex items-end gap-2 text-slate-800 dark:text-white">
              {items.filter(i => i.isVisible !== false).length} <span className="text-sm font-medium text-slate-500 mb-1">Product</span>
            </div>
          </div>
          <div className="w-px h-12 bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
          
          <div className="flex-1 w-full max-w-[200px]">
            <div className="text-slate-500 text-sm font-medium mb-1">Winning Product</div>
            <div className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 shrink-0">
                <Star size={16} className="fill-orange-600" />
              </div>
              <div className="truncate" title={items[0]?.name || 'None'}>
                {items[0]?.name || 'None'}
              </div>
            </div>
          </div>
          <div className="w-px h-12 bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
          
          <div className="flex-1">
            <div className="text-slate-500 text-sm font-medium mb-1">Average Margin</div>
            <div className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
              <div className="w-10 h-10 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-green-500 border-r-green-500 relative flex flex-col items-center justify-center -rotate-45">
                <div className="w-2 h-2 rounded-full bg-slate-300 rotate-45"></div>
              </div>
              {avgMargin}%  
            </div>
          </div>
          <div className="w-px h-12 bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
          
          <div className="flex-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#151515] p-3 -m-3 rounded-xl transition-all" onClick={() => setShowSoldModal(true)}>
            <div className="text-slate-500 text-sm font-medium mb-1">Product Sold</div>
            <div className="text-2xl font-bold flex items-end gap-2 text-slate-800 dark:text-white">
              {totalSold} <span className="text-sm font-medium text-slate-500 mb-1">Items</span>
            </div>
          </div>
          <div className="w-px h-12 bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
          
          <div 
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`flex-1 cursor-pointer transition-all p-3 -m-3 rounded-xl ${filterLowStock ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-slate-50 dark:hover:bg-[#151515]'}`}
          >
            <div className="text-slate-500 text-sm font-medium mb-1">Low Stock Item</div>
            <div className="text-2xl font-bold flex items-end gap-2 text-red-500">
              {lowStockCount} <span className="text-sm font-medium text-slate-500 mb-1">Items</span>
            </div>
          </div>
          
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
              <h3 className="font-bold text-lg">{isAdding ? 'Add Product' : 'Edit Product'}</h3>
              <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              
              <div>
                <label className="block text-sm font-semibold mb-1">Product Name</label>
                <input 
                  type="text"
                  value={editForm.name || ''} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Category</label>
                {categories.length > 1 && !isNewCategory ? (
                  <select 
                    value={editForm.category || ''} 
                    onChange={e => {
                      if (e.target.value === 'ADD_NEW') {
                        setIsNewCategory(true);
                        setEditForm({...editForm, category: ''});
                      } else {
                        setEditForm({...editForm, category: e.target.value});
                      }
                    }}
                    className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]"
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.filter(c => c !== "All").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="ADD_NEW">+ Add New Category...</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      value={editForm.category || ''} 
                      onChange={e => setEditForm({...editForm, category: e.target.value})}
                      placeholder="e.g. Apparel, Accessories"
                      className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]"
                    />
                    {categories.length > 1 && (
                      <button onClick={() => setIsNewCategory(false)} className="px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">SKU</label>
                <input 
                  type="text"
                  value={editForm.sku || ''} 
                  onChange={e => setEditForm({...editForm, sku: e.target.value})}
                  placeholder="e.g. TSHIRT-BLU-M"
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Stock Status</label>
                <select 
                  value={editForm.stockStatus || 'In Stock'} 
                  onChange={e => setEditForm({...editForm, stockStatus: e.target.value})}
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]"
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="On Pre-order">On Pre-order</option>
                </select>
              </div>

              {!(hasVarietyColor || hasVarietySize) && (
              <div>
                <label className="block text-sm font-semibold mb-1">Total Stock</label>
                <input 
                  type="number"
                  value={editForm.stockQuantity || 0} 
                  onChange={e => setEditForm({...editForm, stockQuantity: parseInt(e.target.value) || 0})}
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]"
                />
              </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1">Regular Price</label>
                <input 
                  type="number"
                  value={editForm.price || 0} 
                  onChange={e => setEditForm({...editForm, price: parseFloat(e.target.value)})}
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Sale Price (Optional)</label>
                <input 
                  type="number"
                  value={editForm.salePrice || ''} 
                  onChange={e => setEditForm({...editForm, salePrice: e.target.value ? parseFloat(e.target.value) : undefined})}
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Cost per Item (Internal)</label>
                <input 
                  type="number"
                  value={editForm.costPerItem || ''} 
                  onChange={e => setEditForm({...editForm, costPerItem: e.target.value ? parseFloat(e.target.value) : undefined})}
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Supplier / Vendor</label>
                <input 
                  type="text"
                  value={editForm.supplier || ''} 
                  onChange={e => setEditForm({...editForm, supplier: e.target.value})}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Physical Location</label>
                <input 
                  type="text"
                  value={editForm.logisticsLocation || ''} 
                  onChange={e => setEditForm({...editForm, logisticsLocation: e.target.value})}
                  placeholder="e.g. Warehouse A, Aisle 4"
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Shipping Weight (kg)</label>
                <input 
                  type="number"
                  step="0.01"
                  value={editForm.logisticsWeight || ''} 
                  onChange={e => setEditForm({...editForm, logisticsWeight: e.target.value})}
                  placeholder="e.g. 1.5"
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]"
                />
              </div>



              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Upload Images (Max 10 images, 1MB each)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []) as File[];
                    if (!files.length) return;
                    if (files.length + (editForm.images?.length || 0) > 10) {
                      alert("You can only upload up to 10 images in total.");
                      return;
                    }

                    const validFiles = files.filter(f => f.size <= 1024 * 1024);
                    if (validFiles.length < files.length) {
                      alert("Some files exceed the 1MB limit and were skipped.");
                    }
                    if (!validFiles.length) return;

                    setIsUploading(true);
                    try {
                      const newUrls = [...(editForm.images || [])];
                      for (const file of validFiles) {
                        const fileRef = ref(storage, `merchandise/${Date.now()}_${file.name}`);
                        await uploadBytes(fileRef, file);
                        const downloadURL = await getDownloadURL(fileRef);
                        newUrls.push(downloadURL);
                      }
                      setEditForm(prev => ({ ...prev, images: newUrls }));
                      alert("Upload complete!");
                    } catch (err) {
                       console.error("Upload error:", err);
                       alert("Upload failed. Make sure Firebase Storage rules allow write access.");
                    } finally {
                       setIsUploading(false);
                    }
                  }}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-[var(--color-4h-green)] hover:file:bg-slate-200 transition-colors mb-2"
                />
                {(editForm.images || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(editForm.images || []).map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setEditForm(prev => ({...prev, images: prev.images?.filter((_, i) => i !== idx)}))}
                          className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-6 mb-4">
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input type="checkbox" checked={hasVarietyColor} onChange={(e) => setHasVarietyColor(e.target.checked)} className="cursor-pointer" />
                    Has Varieties (Color)
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input type="checkbox" checked={hasVarietySize} onChange={(e) => setHasVarietySize(e.target.checked)} className="cursor-pointer" />
                    Has Sizes
                  </label>
                </div>
                
                {(hasVarietyColor || hasVarietySize) && (
                  <div className="bg-slate-50 dark:bg-[#111] p-4 rounded-xl space-y-4">
                    <div className="flex flex-wrap items-end gap-3">
                      {hasVarietyColor && (
                        <div className="flex-1 min-w-[120px]">
                          <label className="block text-xs font-semibold mb-1 text-slate-500">Variety / Color</label>
                          <input type="text" value={variantColor} onChange={e => setVariantColor(e.target.value)} placeholder="e.g. Red" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-sm outline-none focus:border-[var(--color-4h-green)]" />
                        </div>
                      )}
                      {hasVarietySize && (
                        <div className="flex-1 min-w-[120px]">
                          <label className="block text-xs font-semibold mb-1 text-slate-500">Size</label>
                          <input type="text" value={variantSize} onChange={e => setVariantSize(e.target.value)} placeholder="e.g. Medium" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-sm outline-none focus:border-[var(--color-4h-green)]" />
                        </div>
                      )}
                      <div className="w-24 shrink-0">
                        <label className="block text-xs font-semibold mb-1 text-slate-500">Stock</label>
                        <input type="number" value={variantStock} onChange={e => setVariantStock(e.target.value)} placeholder="0" className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg text-sm outline-none focus:border-[var(--color-4h-green)]" />
                      </div>
                      <button 
                        onClick={() => {
                          const newVariant = { 
                            id: Math.random().toString(36).substr(2, 9), 
                            color: hasVarietyColor ? variantColor.trim() || undefined : undefined, 
                            size: hasVarietySize ? variantSize.trim() || undefined : undefined, 
                            stock: parseInt(variantStock) || 0 
                          };
                          setEditForm({...editForm, variants: [...(editForm.variants || []), newVariant]});
                          setVariantColor('');
                          setVariantSize('');
                          setVariantStock('');
                        }}
                        className="bg-[var(--color-4h-green)] text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition shrink-0"
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>

                    {(editForm.variants || []).length > 0 && (
                      <div className="space-y-2 mt-4">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Added Variants</div>
                        {(editForm.variants || []).map((v, i) => (
                           <div key={v.id || i} className="flex items-center gap-3 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-sm">
                             <div className="flex-1 flex gap-2 flex-wrap">
                               {hasVarietyColor && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-medium">Color: {v.color || '-'}</span>}
                               {hasVarietySize && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-medium">Size: {v.size || '-'}</span>}
                             </div>
                             <div className="flex items-center gap-2 pr-2">
                               <button 
                                 onClick={() => {
                                   const newVariants = [...(editForm.variants || [])];
                                   newVariants[i].stock = Math.max(0, newVariants[i].stock - 1);
                                   setEditForm({...editForm, variants: newVariants});
                                 }}
                                 className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                               >
                                 <Minus size={12} />
                               </button>
                               <span className="font-bold w-6 text-center">{v.stock}</span>
                               <button 
                                 onClick={() => {
                                   const newVariants = [...(editForm.variants || [])];
                                   newVariants[i].stock += 1;
                                   setEditForm({...editForm, variants: newVariants});
                                 }}
                                 className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                               >
                                 <Plus size={12} />
                               </button>
                             </div>
                             <button 
                               onClick={() => {
                                 const newVariants = [...(editForm.variants || [])];
                                 newVariants.splice(i, 1);
                                 setEditForm({...editForm, variants: newVariants});
                               }}
                               className="p-1 hover:text-red-500 text-slate-400 transition"
                             >
                               <Trash2 size={14} />
                             </button>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Video URL (optional)</label>
                <input 
                  type="text"
                  value={editForm.video || ''} 
                  onChange={e => setEditForm({...editForm, video: e.target.value})}
                  placeholder="https://..."
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] text-sm mb-4"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold mb-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editForm.hasMaterialAndCare || false}
                    onChange={e => setEditForm({ ...editForm, hasMaterialAndCare: e.target.checked })}
                    className="w-4 h-4 text-[var(--color-4h-green)] rounded focus:ring-[var(--color-4h-green)]"
                  />
                  Has Material & Care
                </label>
              </div>

              {editForm.hasMaterialAndCare && (
                <>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold mb-1">Material</label>
                    <input 
                      type="text" 
                      value={editForm.material || ''} 
                      onChange={e => setEditForm({...editForm, material: e.target.value})}
                      className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]"
                      placeholder="100% Cotton"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-semibold mb-1">Care Label</label>
                    <textarea 
                      value={editForm.careLabel || ''} 
                      onChange={e => setEditForm({...editForm, careLabel: e.target.value})}
                      className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] resize-none h-24"
                      placeholder="Care instructions..."
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">About the Product <span className="text-xs text-slate-500 font-normal ml-2">(Supports Markdown, e.g. **bold**)</span></label>
                <MarkdownTextarea 
                  value={editForm.aboutProduct || ''} 
                  onChange={val => setEditForm({...editForm, aboutProduct: val})}
                  placeholder="Complete your training essentials..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Product Information <span className="text-xs text-slate-500 font-normal ml-2">(Supports Markdown, e.g. **bold**)</span></label>
                <MarkdownTextarea 
                  value={editForm.productInformation || ''} 
                  onChange={val => setEditForm({...editForm, productInformation: val})}
                  placeholder="**Details**\n\n**SKU:** 12345\n**Color:** Multi\n**Condition:** Brand New"
                />
              </div>

            </div>
            {saveError && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm font-semibold mb-4">
                {saveError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="px-6 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={isUploading} className="bg-[var(--color-4h-green)] text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 text-sm"><Save size={16} /> Save</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-stretch overflow-hidden">
        {filteredItems.map(item => {
          const sold = item.soldQuantity || 0;
          const isGood = sold >= 10;
          const perfText = isGood ? 'Good' : 'Bad';
          const perfIconClass = isGood ? 'text-green-500' : 'text-red-500';
          const PerfIcon = isGood ? ArrowUpRight : ArrowDownRight;
          
          const totalStock = item.variants && item.variants.length > 0 
            ? item.variants.reduce((acc, v) => acc + v.stock, 0)
            : (item.stockQuantity || 0);

          const isOutOfStock = item.stockStatus === 'Out of Stock' || totalStock <= 0;
          
          return (
            <div key={item.id} className={`py-4 px-6 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between hover:bg-slate-50 dark:hover:bg-[#151515] transition-colors group ${item.isVisible === false ? 'opacity-50' : ''} border-b border-slate-100 dark:border-slate-800 last:border-0`}>
              
              <div className="flex w-full lg:w-1/4 min-w-0 pr-4">
                {item.images && item.images.length > 0 ? (
                  <img src={item.images[0]} alt={item.name} referrerPolicy="no-referrer" className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800 bg-slate-50" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 shrink-0">
                    <Package size={24} />
                  </div>
                )}
                <div className="ml-4 min-w-0 flex flex-col justify-center">
                  <h4 className="font-bold text-slate-900 dark:text-white truncate text-base">{item.name}</h4>
                  <div className="text-sm font-medium text-slate-500 flex items-center gap-1">
                    Review : {item.rating?.toFixed(1) || "4.5"} <Star size={12} className="fill-slate-500" />
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="hidden lg:block w-px h-8 bg-slate-200 dark:bg-slate-800"></div>

              <div className="flex flex-col w-full lg:w-1/5 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-500">Performance</span>
                  <span className={`text-[11px] font-bold ${perfIconClass} px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md`}>{perfText}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-800 dark:text-slate-300">
                  <span className="flex items-center gap-1"><PerfIcon size={14} className={perfIconClass} /> {sold + 5}</span>
                  <span className="flex items-center gap-1"><ShoppingBag size={14} className="text-slate-400" /> {sold}</span>
                </div>
              </div>

              {/* Semi-circle Gauge Stub */}
              <div className="hidden xl:flex items-center justify-center w-20">
                 <div className="w-12 h-6 border-4 border-b-0 border-slate-200 dark:border-slate-800 rounded-t-full relative overflow-hidden">
                    <div className={"absolute top-0 left-0 w-full h-full border-4 border-b-0 rounded-t-full origin-bottom transition-transform duration-500 " + (isGood ? "border-green-500" : "border-red-500")} style={{ transform: isGood ? 'rotate(45deg)' : 'rotate(-30deg)' }}></div>
                 </div>
              </div>

              {/* Separator */}
              <div className="hidden lg:block w-px h-8 bg-slate-200 dark:bg-slate-800"></div>

              <div className="flex flex-col w-32 shrink-0">
                <div className="text-sm font-semibold text-slate-500 mb-1">Stock</div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                   <Package size={14} className="text-slate-400" /> {totalStock}
                </div>
              </div>

              {/* Separator */}
              <div className="hidden lg:block w-px h-8 bg-slate-200 dark:bg-slate-800"></div>

              <div className="flex flex-col w-32 shrink-0">
                <div className="text-sm font-semibold text-slate-500 mb-1">Product Price</div>
                <div className="text-sm font-bold text-slate-800 dark:text-white">
                  ₱ {item.salePrice || item.price || '0.00'}
                </div>
              </div>

              {/* Separator */}
              <div className="hidden lg:block w-px h-8 bg-slate-200 dark:bg-slate-800"></div>

              <div className="flex items-center shrink-0 w-48 justify-between">
                <div className="flex flex-col items-center">
                  <div className="text-sm font-semibold text-slate-500 mb-1">Visibility</div>
                  <button onClick={() => toggleVisibility(item)} className="focus:outline-none hover:scale-110 transition-transform">
                    {item.isVisible !== false ? <ToggleRight size={24} className="text-[var(--color-4h-green)]" /> : <ToggleLeft size={24} className="text-slate-300 dark:text-slate-600" />}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openEditForm(item)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 transition-colors bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/40"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
        {filteredItems.length === 0 && !isAdding && <p className="text-slate-500 py-12 text-center text-sm font-medium">No items found in this category.</p>}
      </div>

      <AnimatePresence>
        {showSoldModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSoldModal(false)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#111] max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-3xl p-8 relative z-10 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <button 
                onClick={() => setShowSoldModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
              <h3 className="text-2xl font-bold mb-6">Product Sold Metrics</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1A1A1A] border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Last 7 Days</span>
                  <span className="text-xl font-bold">{Math.floor(totalSold * 0.15)} Items</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1A1A1A] border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Last 30 Days</span>
                  <span className="text-xl font-bold">{Math.floor(totalSold * 0.4)} Items</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1A1A1A] border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Last 1 Year</span>
                  <span className="text-xl font-bold">{Math.floor(totalSold * 0.8)} Items</span>
                </div>
                <div className="p-4 rounded-xl bg-[var(--color-4h-green)]/10 border border-[var(--color-4h-green)]/30 flex justify-between items-center">
                  <span className="font-semibold text-[var(--color-4h-green)]">All Time</span>
                  <span className="text-xl font-bold text-[var(--color-4h-green)]">{totalSold} Items</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function POSDashboardTab() {
  const [items, setItems] = useState<Merchandise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<{product: Merchandise; variantId?: string; quantity: number}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash'|'e-wallet'>('cash');
  const [eWalletProvider, setEWalletProvider] = useState<'GCash'|'Maya'|'Other'>('GCash');
  const [referenceNumber, setReferenceNumber] = useState('');
  
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isPaymentPanelExpanded, setIsPaymentPanelExpanded] = useState(true);

  // Discounts
  const [memberIdStr, setMemberIdStr] = useState("");
  const [appliedDiscountRate, setAppliedDiscountRate] = useState(0);
  const [memberValidationMessage, setMemberValidationMessage] = useState({text: "", type: ""});
  const [discountSettings, setDiscountSettings] = useState<any>(null);

  const [manualType, setManualType] = useState<'income' | 'expense'>('income');
  const [manualAmount, setManualAmount] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [manualPayment, setManualPayment] = useState<'cash'|'e-wallet'|'bank'>('cash');

  const [refundConfirmAction, setRefundConfirmAction] = useState<{id: string, type: 'refunded' | 'void'} | null>(null);

  const [variantModalItem, setVariantModalItem] = useState<Merchandise | null>(null);
  const [selectedModalColor, setSelectedModalColor] = useState<string>("");
  const [selectedModalSize, setSelectedModalSize] = useState<string>("");
  const [posOrders, setPosOrders] = useState<any[]>([]);

  useEffect(() => {
    const unsubMerch = onSnapshot(collection(db, "merchandise"), snap => {
      const arr: Merchandise[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as Merchandise));
      setItems(arr);
    }, err => handleFirestoreError(err, OperationType.GET, "merchandise"));

    const unsubOrders = onSnapshot(collection(db, "orders"), snap => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      const filtered = arr.filter(o => o.type === 'pos' || o.type === 'pos-pre-order');
      filtered.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPosOrders(filtered);
    }, err => handleFirestoreError(err, OperationType.GET, "orders"));

    const unsubSettings = onSnapshot(doc(db, "settings", "shop_discounts"), snap => {
      if (snap.exists() && snap.data().status === "approved") {
        setDiscountSettings(snap.data());
      }
    }, err => handleFirestoreError(err, OperationType.GET, "settings"));

    return () => { unsubMerch(); unsubOrders(); unsubSettings(); };
  }, []);

  const categories = ["All", ...Array.from(new Set(items.map(item => item.category).filter(Boolean)))];

  const filteredItems = items.filter(i => {
    const matchCategory = selectedCategory === "All" || (i.category || "Uncategorized") === selectedCategory;
    const matchSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch && i.isVisible !== false;
  });

  const getAvailableStock = (product: Merchandise, variantId?: string) => {
    if (product.stockStatus === 'On Pre-order') return Infinity;
    if (variantId && product.variants) {
       const v = product.variants.find(x => x.id === variantId);
       return v ? v.stock : 0;
    }
    return product.stockQuantity || 0;
  };

  const addToCart = (product: Merchandise, variantId?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.variantId === variantId);
      const limit = getAvailableStock(product, variantId);
      if (existing) {
        if (existing.quantity >= limit) {
           alert("Cannot add more than available stock.");
           return prev;
        }
        return prev.map(item => item.product.id === product.id && item.variantId === variantId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      if (limit < 1) {
         alert("Item is out of stock.");
         return prev;
      }
      return [...prev, { product, variantId, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, variantId: string | undefined, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId && item.variantId === variantId) {
          const limit = getAvailableStock(item.product, variantId);
          let newQuantity = item.quantity + delta;
          if (newQuantity < 1) newQuantity = 1;
          if (newQuantity > limit) {
             alert("Cannot add more than available stock.");
             newQuantity = limit;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  const setCartQuantityExact = (productId: string, variantId: string | undefined, quantityStr: string) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId && item.variantId === variantId) {
          const limit = getAvailableStock(item.product, variantId);
          let newQuantity = parseInt(quantityStr, 10);
          if (isNaN(newQuantity)) newQuantity = 1;
          if (newQuantity < 1) newQuantity = 1;
          if (newQuantity > limit) {
             alert("Cannot add more than available stock.");
             newQuantity = limit;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.variantId === variantId)));
  };

  const calculateTotalStr = () => {
    return cart.reduce((total, item) => total + (item.product.salePrice || item.product.price) * item.quantity, 0);
  };
  
  const calculateTotal = () => {
    const rawTotal = calculateTotalStr();
    return rawTotal * (1 - appliedDiscountRate / 100);
  };

  const verifyMemberId = async () => {
    if (!memberIdStr.trim()) {
      setMemberValidationMessage({text: "Please enter a 4-H ID", type: "error"});
      return;
    }
    
    setMemberValidationMessage({text: "Validating...", type: "neutral"});
    try {
      const docSnap = await getDoc(doc(db, "members", memberIdStr.trim()));
      if (docSnap.exists()) {
        const member = docSnap.data();
        if (member.status === "Active") {
          let rate = discountSettings?.activeMemberDiscount || 0;
          let msg = `Active Member! ${rate}% off.`;
          
          if (member.category === "Alumni" || member.age > 30) {
            const joinedYear = member.joined ? new Date(member.joined).getFullYear() : (member.registrationDate ? new Date(member.registrationDate).getFullYear() : new Date().getFullYear());
            const years = new Date().getFullYear() - joinedYear;
            
            if (years >= 9) { rate = discountSettings?.alumniTier3 || 0; msg = `Alumni 9+ yrs! ${rate}% off.`; }
            else if (years >= 5) { rate = discountSettings?.alumniTier2 || 0; msg = `Alumni 5-8 yrs! ${rate}% off.`; }
            else if (years >= 1) { rate = discountSettings?.alumniTier1 || 0; msg = `Alumni 1-4 yrs! ${rate}% off.`; }
            else { msg = `Alumni! ${rate}% off.`; }
          }
          
          setAppliedDiscountRate(rate);
          setMemberValidationMessage({text: msg, type: "success"});
        } else {
          setAppliedDiscountRate(0);
          setMemberValidationMessage({text: `Not Active. Status: ${member.status}`, type: "error"});
        }
      } else {
        setAppliedDiscountRate(0);
        setMemberValidationMessage({text: "ID not found.", type: "error"});
      }
    } catch (err) {
      console.error(err);
      setAppliedDiscountRate(0);
      setMemberValidationMessage({text: "Error validating ID.", type: "error"});
    }
  };

  const handleManualEntry = async () => {
    const parsedAmount = parseFloat(manualAmount);
    if (!parsedAmount || isNaN(parsedAmount)) {
       alert("Please enter a valid amount.");
       return;
    }
    if (!manualNote.trim()) {
       alert("Please enter a note/description for this transaction.");
       return;
    }
    
    setIsProcessing(true);
    try {
        const orderId = doc(collection(db, "orders")).id;
        await setDoc(doc(db, "orders", orderId), {
           type: 'manual',
           manualType: manualType,
           status: 'completed',
           total: manualType === 'income' ? parsedAmount : -parsedAmount,
           date: new Date().toISOString(),
           paymentMethod: manualPayment,
           manualNote: manualNote,
           customerName: "Manual Ledger Entry"
        });
        setManualAmount('');
        setManualNote('');
        alert('Manual transaction recorded.');
    } catch(err) {
        handleFirestoreError(err, OperationType.CREATE, "orders");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleRefundOrder = async (orderId: string, itemsToRefund: any[], newStatus: 'refunded' | 'void') => {
    try {
        setIsProcessing(true);
        for (const item of itemsToRefund) {
            if (item.product?.id) {
                const prodRef = doc(db, "merchandise", item.product.id);
                const product = items.find(i => i.id === item.product.id);
                if (product) {
                    let newStockQuantity = product.stockQuantity || 0;
                    let newVariants = product.variants || [];
                    if (item.variantId && product.variants) {
                        newVariants = product.variants.map(v =>
                            v.id === item.variantId ? { ...v, stock: v.stock + item.quantity } : v
                        );
                    } else {
                        newStockQuantity += item.quantity;
                    }
                    const newSoldQuantity = Math.max(0, (product.soldQuantity || 0) - item.quantity);
                    await updateDoc(prodRef, {
                        stockQuantity: newStockQuantity,
                        variants: newVariants,
                        soldQuantity: newSoldQuantity
                    });
                }
            }
        }
        await updateDoc(doc(db, "orders", orderId), {
            status: newStatus
        });
        setRefundConfirmAction(null);
    } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, "orders");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'e-wallet' && !referenceNumber.trim()) {
      alert("Please enter a reference number for the e-wallet payment.");
      return;
    }
    
    const hasPreOrder = cart.some(item => item.product.stockStatus === 'On Pre-order');
    if (hasPreOrder) {
      if (!customerName.trim() || !customerPhone.trim()) {
        alert("Please provide at least a Customer Name and Phone Number for pre-orders.");
        return;
      }
    }

    setIsProcessing(true);
    try {
      for (const item of cart) {
        const prodRef = doc(db, "merchandise", item.product.id);
        
        let newStockQuantity = item.product.stockQuantity || 0;
        let newVariants = item.product.variants || [];
        
        if (item.variantId && item.product.variants) {
          newVariants = item.product.variants.map(v => 
            v.id === item.variantId ? { ...v, stock: Math.max(0, v.stock - item.quantity) } : v
          );
        } else {
          newStockQuantity = Math.max(0, newStockQuantity - item.quantity);
        }

        const newSoldQuantity = (item.product.soldQuantity || 0) + item.quantity;

        const totalStock = (newVariants && newVariants.length > 0) 
          ? newVariants.reduce((acc, v) => acc + v.stock, 0) 
          : newStockQuantity;

        await updateDoc(prodRef, {
          stockQuantity: newStockQuantity,
          variants: newVariants,
          soldQuantity: newSoldQuantity,
          stockStatus: item.product.stockStatus === 'On Pre-order' ? 'On Pre-order' : (totalStock <= 0 ? "Out of Stock" : "In Stock")
        });
      }
      
      const orderId = doc(collection(db, "orders")).id;
      const orderData: any = {
         items: cart,
         subTotal: calculateTotalStr(),
         total: calculateTotal(),
         discountApplied: appliedDiscountRate,
         buyer4HId: memberIdStr.trim() || null,
         status: hasPreOrder ? "processing" : "completed",
         type: hasPreOrder ? "pos-pre-order" : "pos",
         date: new Date().toISOString(),
         paymentMethod,
         eWalletProvider: paymentMethod === 'e-wallet' ? eWalletProvider : null,
         referenceNumber: paymentMethod === 'e-wallet' ? referenceNumber : null
      };

      if (hasPreOrder) {
         orderData.customerName = customerName;
         orderData.customerEmail = customerEmail;
         orderData.customerPhone = customerPhone;
         orderData.shippingAddress = shippingAddress;
      }

      await setDoc(doc(db, "orders", orderId), orderData);
      
      if (!hasPreOrder) {
         console.log(`[MOCK EMAIL] Sent to customer (POS Purchase): Thank you for your purchase! Don't forget to visit our web store and leave a verified review for the items.`);
      }

      setCart([]);
      setReferenceNumber('');
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setShippingAddress('');
      setMemberIdStr('');
      setAppliedDiscountRate(0);
      setMemberValidationMessage({text: "", type: ""});
      alert("Checkout successful!");
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, "orders");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 p-4 h-auto lg:h-[calc(100vh-250px)] lg:min-h-[600px] border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-[#151515] mt-6">
        <div className="flex-1 flex flex-col bg-white dark:bg-[#111] rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151515] flex flex-col gap-3">
           <div className="relative w-full">
             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
             <input type="text" placeholder="Search products for POS..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 pr-4 py-3 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black focus:outline-none focus:border-[var(--color-4h-green)] font-medium text-sm transition-all" />
           </div>
           <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
             {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === c ? 'bg-slate-800 text-white dark:bg-white dark:text-black shadow-sm' : 'bg-white dark:bg-[#111] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  {c}
                </button>
             ))}
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
           {filteredItems.map(prod => {
              const hasVariants = (prod.variants && prod.variants.length > 0);
              const totalStock = hasVariants 
                ? prod.variants!.reduce((acc, v) => acc + v.stock, 0)
                : (prod.stockQuantity || 0);

              return (
                 <div key={prod.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 hover:border-[var(--color-4h-green)] hover:shadow-md transition cursor-pointer group bg-white dark:bg-[#151515]" onClick={() => {
                     if (!hasVariants && (totalStock > 0 || prod.stockStatus === 'On Pre-order')) {
                       addToCart(prod);
                     } else if (hasVariants && (totalStock > 0 || prod.stockStatus === 'On Pre-order')) {
                       setVariantModalItem(prod);
                       setSelectedModalColor("");
                       setSelectedModalSize("");
                     }
                 }}>
                    {prod.images && prod.images.length > 0 ? (
                      <img src={prod.images[0]} alt="" className="w-full h-32 object-cover rounded-xl bg-slate-50 border border-slate-100 dark:border-slate-800" />
                    ) : (
                      <div className="w-full h-32 bg-slate-50 dark:bg-black border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-300">
                         <Package size={32} />
                      </div>
                    )}
                    <div>
                       <h4 className="font-bold text-sm truncate group-hover:text-[var(--color-4h-green)] transition-colors">{prod.name}</h4>
                       <div className="text-xs text-slate-500 mb-1">Stock: {totalStock}</div>
                       <div className="font-bold text-slate-900 dark:text-white">₱ {prod.salePrice || prod.price}</div>
                    </div>
                    {hasVariants && (
                       <button 
                         className="mt-auto border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm px-3 py-2 w-full font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                         onClick={(e) => {
                            e.stopPropagation();
                            if (totalStock > 0 || prod.stockStatus === 'On Pre-order') {
                              setVariantModalItem(prod);
                              setSelectedModalColor("");
                              setSelectedModalSize("");
                            }
                         }}
                       >
                          Select Variant
                       </button>
                    )}
                    {!hasVariants && totalStock <= 0 && prod.stockStatus !== 'On Pre-order' && <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md w-fit font-bold mt-auto border border-red-100 dark:border-red-900/50">Out of Stock</span>}
                    {!hasVariants && totalStock <= 0 && prod.stockStatus === 'On Pre-order' && <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md w-fit font-bold mt-auto border border-amber-200 dark:border-amber-900/50">Pre-Order</span>}
                 </div>
              );
           })}
           {filteredItems.length === 0 && <div className="col-span-full py-12 text-center text-slate-500 font-medium bg-slate-50 dark:bg-[#151515] rounded-2xl border-4 border-dashed border-slate-200 dark:border-slate-800">No products match your search.</div>}
        </div>
      </div>
      
      <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-[#111] rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
         <div className="p-5 font-bold border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#151515]">
            <div className="flex items-center gap-2">
               <Store size={18} className="text-[var(--color-4h-green)]" />
               Current POS Order
            </div>
            <span className="bg-[var(--color-4h-green)] text-white text-xs px-2.5 py-1 rounded-full">{cart.reduce((a,b)=>a+b.quantity,0)} Items</span>
         </div>
         <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
               {cart.map((item, idx) => {
                  const variant = item.product.variants?.find(v => v.id === item.variantId);
                  return (
                     <div key={idx} className="bg-slate-50 dark:bg-[#151515] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2 shadow-sm">
                        <div className="flex gap-3">
                           {item.product.images && item.product.images.length > 0 ? (
                              <img src={item.product.images[0]} alt="" className="w-12 h-12 object-cover rounded-lg bg-white border border-slate-200 dark:border-slate-700 shrink-0" />
                           ) : (
                              <div className="w-12 h-12 bg-white border border-slate-200 dark:border-slate-700 dark:bg-black rounded-lg flex items-center justify-center text-slate-300 shrink-0">
                                 <Package size={20} />
                              </div>
                           )}
                           <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                 <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight truncate">{item.product.name}</div>
                                 <button onClick={() => removeFromCart(item.product.id, item.variantId)} className="text-slate-400 hover:text-red-500 bg-white dark:bg-black p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"><X size={14}/></button>
                              </div>
                              {variant && <div className="text-xs font-bold text-slate-500 mt-1">{variant.color} {variant.size}</div>}
                              <div className="font-black text-xs text-[var(--color-4h-green)] mt-1">₱ {(item.product.salePrice || item.product.price)} / ea</div>
                           </div>
                        </div>
                        <div className="flex justify-between items-center mt-1 pt-2 border-t border-slate-200 dark:border-slate-800/50">
                           <div className="flex items-center bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                              <button onClick={() => updateCartQuantity(item.product.id, item.variantId, -1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l text-slate-500 transition-colors"><Minus size={12} /></button>
                              <input 
                                 type="number" 
                                 value={item.quantity || ''} 
                                 onChange={(e) => setCartQuantityExact(item.product.id, item.variantId, e.target.value)}
                                 className="text-xs font-bold w-10 text-center bg-transparent border-none focus:outline-none focus:ring-0 p-0 m-0 hide-arrows"
                              />
                              <button onClick={() => updateCartQuantity(item.product.id, item.variantId, 1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r text-slate-500 transition-colors"><Plus size={12} /></button>
                           </div>
                           <div className="font-black text-[var(--color-4h-green)] text-base">₱ {((item.product.salePrice || item.product.price) * item.quantity).toLocaleString()}</div>
                        </div>
                     </div>
                  );
               })}
               {cart.length === 0 && (
                  <div className="mt-12 flex flex-col items-center justify-center text-slate-400">
                    <ShoppingCart size={48} className="opacity-20 mb-4" />
                    <p className="text-sm font-medium">POS Cart is empty</p>
                    <p className="text-xs opacity-60">Click products to add</p>
                  </div>
               )}
            </div>

            {cart.length > 0 && (
               <div className="flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-4 animate-in fade-in duration-300">
                  <div>
                     <span className="font-bold text-slate-500 uppercase tracking-wide text-xs mb-3 block">Payment Method</span>
                     <div className="grid grid-cols-2 gap-2">
                        <button 
                           onClick={() => setPaymentMethod('cash')} 
                           className={`py-2 px-3 rounded-xl border text-sm font-bold transition-colors ${paymentMethod === 'cash' ? 'bg-[var(--color-4h-green)]/10 border-[var(--color-4h-green)] text-[var(--color-4h-green)]' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-black dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                           Cash
                        </button>
                        <button 
                           onClick={() => setPaymentMethod('e-wallet')} 
                           className={`py-2 px-3 rounded-xl border text-sm font-bold transition-colors ${paymentMethod === 'e-wallet' ? 'bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900/20' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-black dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                           E-Wallet
                        </button>
                     </div>
                  </div>

                  {paymentMethod === 'e-wallet' && (
                     <div className="space-y-3 p-4 bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-xl animate-in fade-in duration-200 slide-in-from-top-2">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1.5 block">Provider</label>
                          <select 
                            value={eWalletProvider}
                            onChange={(e) => setEWalletProvider(e.target.value as any)}
                            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-black rounded-lg text-sm px-3 py-2 outline-none font-medium"
                          >
                            <option value="GCash">GCash</option>
                            <option value="Maya">Maya</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1.5 block">Reference No.</label>
                          <input 
                            type="text" 
                            placeholder="Enter ref #" 
                            value={referenceNumber}
                            onChange={e => setReferenceNumber(e.target.value)}
                            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-black rounded-lg text-sm px-3 py-2 outline-none font-medium"
                          />
                        </div>
                     </div>
                  )}

                  {cart.some(item => item.product.stockStatus === 'On Pre-order') && (
                     <div className="space-y-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 rounded-xl animate-in fade-in duration-200 slide-in-from-top-2">
                        <div className="text-xs font-bold text-amber-700 dark:text-amber-500 mb-1">Pre-Order Required Info</div>
                        <input type="text" placeholder="Customer Name *" value={customerName} onChange={e=>setCustomerName(e.target.value)} className="w-full border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-black rounded-lg text-sm px-3 py-2 outline-none font-medium" />
                        <input type="tel" placeholder="Phone Number *" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} className="w-full border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-black rounded-lg text-sm px-3 py-2 outline-none font-medium" />
                        <input type="email" placeholder="Email Address (Optional)" value={customerEmail} onChange={e=>setCustomerEmail(e.target.value)} className="w-full border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-black rounded-lg text-sm px-3 py-2 outline-none font-medium" />
                        <input type="text" placeholder="Shipping Address (Optional)" value={shippingAddress} onChange={e=>setShippingAddress(e.target.value)} className="w-full border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-black rounded-lg text-sm px-3 py-2 outline-none font-medium" />
                     </div>
                  )}

                  <div className="p-4 bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-xl">
                     <label className="text-xs font-bold text-slate-500 mb-2 block">Member Discount (4-H ID)</label>
                     <div className="flex gap-2">
                       <input 
                         type="text" 
                         placeholder="Enter 4-H ID" 
                         value={memberIdStr}
                         onChange={e => setMemberIdStr(e.target.value)}
                         className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-black rounded-lg text-sm px-3 py-2 outline-none font-medium"
                       />
                       <button onClick={verifyMemberId} className="px-3 py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-300 text-xs font-bold rounded-lg transition-colors whitespace-nowrap">Verify</button>
                     </div>
                     {memberValidationMessage.text && (
                       <div className={`mt-2 p-2 rounded-lg text-xs font-bold ${memberValidationMessage.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : memberValidationMessage.type === 'success' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-slate-100 text-slate-600 dark:bg-[#111]'}`}>
                          {memberValidationMessage.text}
                       </div>
                     )}
                  </div>
               </div>
            )}
         </div>

         <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151515]">
            <div className="flex flex-col gap-1.5 mb-4">
               <div className="flex justify-between items-center text-sm font-semibold text-slate-500">
                 <span>Subtotal</span>
                 <span>₱{calculateTotalStr().toLocaleString()}</span>
               </div>
               {appliedDiscountRate > 0 && (
                 <div className="flex justify-between items-center text-sm font-bold text-[var(--color-4h-green)]">
                   <span>Member Discount ({appliedDiscountRate}%)</span>
                   <span>-₱{(calculateTotalStr() * appliedDiscountRate / 100).toLocaleString()}</span>
                 </div>
               )}
            </div>
            <div className="flex justify-between items-center mb-5 pt-3 border-t border-slate-200 dark:border-slate-800">
               <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wide text-sm">Total Due</span>
               <span className="font-black text-2xl text-[var(--color-4h-green)] leading-none">₱ {calculateTotal().toLocaleString()}</span>
            </div>
            <button 
              onClick={handleCheckout} 
              disabled={cart.length === 0 || isProcessing}
              className="w-full bg-[var(--color-4h-green)] text-white font-bold py-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-md flex justify-center items-center gap-2"
            >
              <Store size={18} />
              {isProcessing ? "Processing Sale..." : "Complete Checkout"}
            </button>
         </div>
      </div>
    </div>
    
    <div className="mt-6 p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#111] shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
       <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
         <TrendingUp className="text-[var(--color-4h-green)]" size={20} />
         Direct Manual Transaction Entry (Ledger)
       </h3>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="flex flex-col gap-1.5">
             <label className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Type</label>
             <select value={manualType} onChange={(e) => setManualType(e.target.value as 'income'|'expense')} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl font-medium outline-none focus:border-[var(--color-4h-green)]">
               <option value="income">Income (+)</option>
               <option value="expense">Expense (-)</option>
             </select>
          </div>
          <div className="flex flex-col gap-1.5">
             <label className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Payment</label>
             <select value={manualPayment} onChange={(e) => setManualPayment(e.target.value as any)} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl font-medium outline-none focus:border-[var(--color-4h-green)]">
               <option value="cash">Cash</option>
               <option value="e-wallet">E-Wallet</option>
               <option value="bank">Bank Transfer</option>
             </select>
          </div>
          <div className="flex flex-col gap-1.5 lg:col-span-2">
             <label className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Description</label>
             <input type="text" placeholder="e.g. Utility Bill, Special Service" value={manualNote} onChange={e=>setManualNote(e.target.value)} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl font-medium outline-none focus:border-[var(--color-4h-green)]" />
          </div>
          <div className="flex flex-col gap-1.5">
             <label className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Amount (₱)</label>
             <div className="flex gap-2">
                <input type="number" placeholder="0.00" value={manualAmount} onChange={e=>setManualAmount(e.target.value)} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl font-medium outline-none focus:border-[var(--color-4h-green)] text-right" />
                <button onClick={handleManualEntry} disabled={isProcessing} className="bg-[var(--color-4h-green)] text-white font-bold px-4 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 shrink-0">
                   Record
                </button>
             </div>
          </div>
       </div>
    </div>
      
    <div className="mt-6 bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col mb-10">
       <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#151515]">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ListFilter className="text-[var(--color-4h-green)]" size={20} />
            Recent POS Transactions
          </h3>
       </div>
       <div className="overflow-x-auto">
         <table className="w-full text-left border-collapse">
           <thead>
             <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151515]">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date/Time</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Order ID</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Items</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Total</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-sm">
             {posOrders.slice(0, 10).map((o: any) => (
               <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-slate-600 dark:text-slate-400">{new Date(o.date).toLocaleString()}</td>
                  <td className="p-4 font-mono text-xs">{o.id.slice(0,8).toUpperCase()}</td>
                  <td className="p-4">
                     {o.items?.map((item: any, i: number) => (
                        <div key={i} className="text-xs text-slate-500 truncate max-w-[200px]">{item.quantity}x {item.product?.name}</div>
                     ))}
                  </td>
                  <td className="p-4 font-black">₱ {(o.total || 0).toLocaleString()}</td>
                 <td className="p-4">
                     {o.status === 'refunded' || o.status === 'void' ? (
                       <span className="text-[10px] uppercase font-bold tracking-widest bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded">
                         {o.status === 'refunded' ? 'Refunded' : 'Void'}
                       </span>
                     ) : (
                       <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded">Completed</span>
                     )}
                  </td>
                  <td className="p-4 text-right flex justify-end">
                     {o.status !== 'refunded' && o.status !== 'void' && o.status !== 'cancelled' && (
                        refundConfirmAction?.id === o.id ? (
                          <div className="flex items-center gap-2">
                             <button 
                                onClick={() => handleRefundOrder(o.id, o.items || [], refundConfirmAction.type)}
                                disabled={isProcessing}
                                className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                             >
                                Confirm {refundConfirmAction.type === 'refunded' ? 'Refund' : 'Void'}
                             </button>
                             <button 
                                onClick={() => setRefundConfirmAction(null)}
                                disabled={isProcessing}
                                className="text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                             >
                                Cancel
                             </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                             <button 
                                onClick={() => setRefundConfirmAction({ id: o.id, type: 'void' })}
                                disabled={isProcessing}
                                className="text-xs font-bold text-orange-500 hover:text-orange-600 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/10 dark:hover:bg-orange-900/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                             >
                                Void
                             </button>
                             <button 
                                onClick={() => setRefundConfirmAction({ id: o.id, type: 'refunded' })}
                                disabled={isProcessing}
                                className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                             >
                                Refund
                             </button>
                          </div>
                        )
                     )}
                  </td>
               </tr>
             ))}
             {posOrders.length === 0 && (
               <tr>
                 <td colSpan={6} className="p-8 text-center text-slate-500">No POS transactions found.</td>
               </tr>
             )}
           </tbody>
         </table>
       </div>
    </div>

    {variantModalItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 min-h-screen" onClick={() => setVariantModalItem(null)}>
           <div className="bg-white dark:bg-[#111] p-6 rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                 <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Select Options</h3>
                 <button onClick={() => setVariantModalItem(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X size={18}/></button>
              </div>
              
              <div className="flex items-center gap-4 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl mb-6 bg-slate-50 dark:bg-[#151515]">
                 {(variantModalItem.images && variantModalItem.images.length > 0) ? (
                   <img src={variantModalItem.images[0]} alt="" className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-black" />
                 ) : (
                   <div className="w-16 h-16 bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-300">
                      <Package size={24} />
                   </div>
                 )}
                 <div>
                   <div className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">{variantModalItem.name}</div>
                   <div className="font-black text-[var(--color-4h-green)]">₱ {variantModalItem.salePrice || variantModalItem.price}</div>
                 </div>
              </div>
              
              {(() => {
                 const hasColors = variantModalItem.variants?.some(v => v.color);
                 const hasSizes = variantModalItem.variants?.some(v => v.size);
                 const availableColors = Array.from(new Set(variantModalItem.variants?.map(v => v.color).filter(Boolean))) as string[];
                 
                 const filteredVariants = variantModalItem.variants?.filter(v => {
                    if (hasColors && v.color !== selectedModalColor) return false;
                    return true;
                 }) || [];
                 
                 const availableSizes = Array.from(new Set(filteredVariants.map(v => v.size).filter(Boolean))) as string[];
                 
                 const readyToAdd = (!hasColors || selectedModalColor) && (!hasSizes || selectedModalSize);
                 
                 return (
                   <div className="flex flex-col gap-6">
                      {hasColors && (
                        <div>
                          <label className="text-sm font-black text-slate-400 uppercase tracking-wider mb-3 block">Color</label>
                          <div className="flex flex-wrap gap-2">
                             {availableColors.map(c => (
                               <button 
                                 key={c}
                                 onClick={() => { setSelectedModalColor(c); setSelectedModalSize(""); }}
                                 className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${selectedModalColor === c ? 'border-[var(--color-4h-green)] bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151515] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'}`}
                               >
                                 {c}
                               </button>
                             ))}
                          </div>
                        </div>
                      )}
                      
                      {hasSizes && selectedModalColor && hasColors && (
                        <div>
                          <label className="text-sm font-black text-slate-400 uppercase tracking-wider mb-3 block">Size</label>
                          <div className="flex flex-wrap gap-2">
                             {availableSizes.map(s => {
                                const variant = filteredVariants.find(v => v.size === s);
                                const isOutOfStock = variant ? (variant.stock <= 0 && variantModalItem.stockStatus !== 'On Pre-order') : true;
                                return (
                                 <button 
                                   key={s}
                                   disabled={isOutOfStock}
                                   onClick={() => setSelectedModalSize(s)}
                                   className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all disabled:opacity-40 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:cursor-not-allowed ${selectedModalSize === s ? 'border-[var(--color-4h-green)] bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151515] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                 >
                                   {s} {isOutOfStock ? '(Out of Stock)' : ''}
                                 </button>
                               )
                             })}
                          </div>
                        </div>
                      )}
                      
                      {hasSizes && !hasColors && (
                        <div>
                          <label className="text-sm font-black text-slate-400 uppercase tracking-wider mb-3 block">Size</label>
                          <div className="flex flex-wrap gap-2">
                             {availableSizes.map(s => {
                                const variant = variantModalItem.variants?.find(v => v.size === s);
                                const isOutOfStock = variant ? (variant.stock <= 0 && variantModalItem.stockStatus !== 'On Pre-order') : true;
                                return (
                                 <button 
                                   key={s}
                                   disabled={isOutOfStock}
                                   onClick={() => setSelectedModalSize(s)}
                                   className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all disabled:opacity-40 disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:cursor-not-allowed ${selectedModalSize === s ? 'border-[var(--color-4h-green)] bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#151515] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                 >
                                   {s} {isOutOfStock ? '(Out of Stock)' : ''}
                                 </button>
                               )
                             })}
                          </div>
                        </div>
                      )}
                      
                      <button
                        disabled={!readyToAdd}
                        className="mt-6 w-full bg-[var(--color-4h-green)] text-white font-black text-base py-4 rounded-xl disabled:opacity-50 disabled:active:scale-100 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
                        onClick={() => {
                           const v = variantModalItem.variants?.find(v => 
                             (!hasColors || v.color === selectedModalColor) && 
                             (!hasSizes  || v.size === selectedModalSize)
                           );
                           if (v) {
                             addToCart(variantModalItem, v.id);
                             setVariantModalItem(null);
                           }
                        }}
                      >
                         <Plus size={18} />
                         Confirm Selection
                      </button>
                   </div>
                 );
              })()}
           </div>
        </div>
      )}
    </>
  );
}

export function InventoryTrackerTab() {
  const [items, setItems] = useState<Merchandise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStockType, setFilterStockType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "merchandise"), snap => {
      const arr: Merchandise[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as Merchandise));
      setItems(arr);
    }, err => handleFirestoreError(err, OperationType.GET, "merchandise"));
    return unsub;
  }, []);

  const categories = ["All", ...Array.from(new Set(items.map(i => i.category || "Uncategorized").filter(Boolean)))];

  const totalProducts = items.length;
  
  const lowStockCount = items.filter(i => {
    const hasVariants = i.variants && i.variants.length > 0;
    const totalStock = hasVariants
      ? i.variants!.reduce((acc, v) => acc + v.stock, 0)
      : (i.stockQuantity || 0);
    return totalStock > 0 && totalStock <= 5;
  }).length;

  const noStockCount = items.filter(i => {
    const hasVariants = i.variants && i.variants.length > 0;
    const totalStock = hasVariants
      ? i.variants!.reduce((acc, v) => acc + v.stock, 0)
      : (i.stockQuantity || 0);
    return totalStock <= 0;
  }).length;

  const filteredItems = items.filter(i => {
    let match = true;
    
    // Category match
    if (selectedCategory !== "All") {
      match = match && ((i.category || "Uncategorized") === selectedCategory);
    }
    
    // Search match
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      match = match && (
        i.name.toLowerCase().includes(q) ||
        (i.sku && i.sku.toLowerCase().includes(q)) ||
        (i.category && i.category.toLowerCase().includes(q))
      );
    }
    
    // Filter match
    if (filterStockType !== 'all') {
      const hasVariants = i.variants && i.variants.length > 0;
      const totalStock = hasVariants
        ? i.variants!.reduce((acc, v) => acc + v.stock, 0)
        : (i.stockQuantity || 0);
        
      if (filterStockType === 'low') {
        match = match && (totalStock > 0 && totalStock <= 5);
      } else if (filterStockType === 'out') {
        match = match && (totalStock <= 0);
      }
    }
    
    return match;
  });

  const updateStock = async (productId: string, newStock: number, variantId?: string) => {
    try {
      const prodRef = doc(db, "merchandise", productId);
      const product = items.find(i => i.id === productId);
      if (!product) return;

      if (variantId && product.variants) {
        const newVariants = product.variants.map(v => 
          v.id === variantId ? { ...v, stock: Math.max(0, newStock) } : v
        );
        const totalStock = newVariants.reduce((a,b) => a+b.stock, 0);
        await updateDoc(prodRef, { 
          variants: newVariants,
          stockStatus: totalStock <= 0 ? "Out of Stock" : "In Stock"
        });
      } else {
        await updateDoc(prodRef, { 
          stockQuantity: Math.max(0, newStock),
          stockStatus: Math.max(0, newStock) <= 0 ? "Out of Stock" : "In Stock"
        });
      }
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, "merchandise");
    }
  };

  return (
    <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Total Products</div>
            <div className="text-3xl font-display font-black text-[var(--color-4h-green)]">{totalProducts}</div>
         </div>
         <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-amber-200 dark:border-amber-800 shadow-sm flex flex-col items-center text-center">
            <div className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-2">Low Stock (≤ 5)</div>
            <div className="text-3xl font-display font-black text-amber-600">{lowStockCount}</div>
         </div>
         <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-red-200 dark:border-red-800 shadow-sm flex flex-col items-center text-center">
            <div className="text-sm font-bold text-red-500 uppercase tracking-wider mb-2">Out of Stock</div>
            <div className="text-3xl font-display font-black text-red-600">{noStockCount}</div>
         </div>
      </div>

      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-50 dark:bg-[#151515]">
          <h3 className="font-bold flex items-center gap-2 whitespace-nowrap">
            <Package className="text-[var(--color-4h-green)]" size={20} />
            Inventory Status
          </h3>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full xl:w-auto">
             <div className="flex-1 w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
               <Search size={16} className="text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search products..." 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="bg-transparent border-none outline-none text-sm w-full font-medium"
               />
             </div>
             <div className="flex items-center gap-2 bg-white dark:bg-black p-1 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
                <List size={14} className="text-slate-400 ml-2 shadow-sm" />
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-600 dark:text-slate-300 outline-none p-2 border-none rounded-md shadow-sm appearance-none min-w-[120px]"
                >
                  <option value="All">All Categories</option>
                  {categories.filter(c => c !== "All").map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
             </div>
             <div className="flex items-center gap-2 bg-white dark:bg-black p-1 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
                <Filter size={14} className="text-slate-400 ml-2 shadow-sm" />
                <select 
                  value={filterStockType}
                  onChange={(e) => setFilterStockType(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-600 dark:text-slate-300 outline-none p-2 border-none rounded-md min-w-[150px] shadow-sm appearance-none"
                >
                  <option value="all">All Items</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
             </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 dark:bg-[#151515] dark:border-slate-800">
                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Product</th>
                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Product Info</th>
                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Supply Chain</th>
                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Logistics</th>
                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Variants / Options</th>
                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Total Stock</th>
                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredItems.map(item => {
                const hasVariants = item.variants && item.variants.length > 0;
                const totalStock = hasVariants
                  ? item.variants!.reduce((acc, v) => acc + v.stock, 0)
                  : (item.stockQuantity || 0);

                return (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#151515] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.images && item.images.length > 0 ? (
                          <img src={item.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <Package size={16} className="text-slate-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                          <div className="text-xs text-slate-500 max-w-[200px] truncate">{item.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-1.5 mt-1">
                        {item.sku ? (
                           <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><span className="text-[10px] text-slate-400 font-normal uppercase">SKU</span> {item.sku}</div>
                        ) : (
                           <div className="text-sm italic text-slate-400">No SKU</div>
                        )}
                        {item.category ? (
                           <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 w-fit">{item.category}</div>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-1 mt-1">
                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supplier / Vendor</div>
                         <div className="text-sm font-medium text-slate-900 dark:text-white">{item.supplier || <span className="italic text-slate-400 font-normal">Not specified</span>}</div>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-3 mt-1">
                         <div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</div>
                           <div className="text-sm text-slate-900 dark:text-white mt-0.5">{item.logisticsLocation || <span className="italic text-slate-400 font-normal">Not specified</span>}</div>
                         </div>
                         <div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight</div>
                           <div className="text-sm text-slate-900 dark:text-white mt-0.5">{item.logisticsWeight ? `${item.logisticsWeight} kg` : <span className="italic text-slate-400 font-normal">Not specified</span>}</div>
                         </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {hasVariants ? (
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => {
                              if (expandedItems.includes(item.id)) {
                                setExpandedItems(expandedItems.filter(id => id !== item.id));
                              } else {
                                setExpandedItems([...expandedItems, item.id]);
                              }
                            }}
                            className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold transition-colors w-max"
                          >
                            {expandedItems.includes(item.id) ? 'Hide Variants' : `Show Variants (${item.variants!.length})`}
                          </button>
                          
                          {expandedItems.includes(item.id) && (
                            <div className="flex flex-col gap-2 mt-2">
                              {item.variants!.map((v, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-24 truncate border border-slate-200 dark:border-slate-700">
                                    {v.color} {v.size}
                                  </span>
                                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                     <button onClick={() => updateStock(item.id, v.stock - 1, v.id)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-l text-slate-500 transition-colors"><Minus size={12} /></button>
                                     <span className="text-xs font-bold w-8 text-center">{v.stock}</span>
                                     <button onClick={() => updateStock(item.id, v.stock + 1, v.id)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-r text-slate-500 transition-colors"><Plus size={12} /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">No variants</span>
                      )}
                    </td>
                    <td className="p-4">
                      {!hasVariants ? (
                         <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 w-fit">
                            <button onClick={() => updateStock(item.id, totalStock - 1)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-l text-slate-500 transition-colors"><Minus size={14} /></button>
                            <span className="text-sm font-black w-10 text-center">{totalStock}</span>
                            <button onClick={() => updateStock(item.id, totalStock + 1)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-r text-slate-500 transition-colors"><Plus size={14} /></button>
                         </div>
                      ) : (
                         <span className="text-base font-black">{totalStock}</span>
                      )}
                    </td>
                    <td className="p-4">
                      {totalStock <= 0 ? (
                         <span className="text-xs text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400 px-2.5 py-1 rounded-full font-bold border border-red-200 dark:border-red-900/50">Out of Stock</span>
                      ) : totalStock < 10 ? (
                         <span className="text-xs text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 px-2.5 py-1 rounded-full font-bold border border-yellow-200 dark:border-yellow-900/50">Low Stock</span>
                      ) : (
                         <span className="text-xs text-[var(--color-4h-green)] bg-[var(--color-4h-green)]/10 px-2.5 py-1 rounded-full font-bold border border-[var(--color-4h-green)]/20">In Stock</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">No inventory data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function SalesReportTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
  // Auditing Filters
  const [dateRange, setDateRange] = useState<'all'|'today'|'week'|'month'>('all');
  const [typeFilter, setTypeFilter] = useState<'all'|'pos'|'web'|'manual'>('all');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), snap => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      arr.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(arr);
    }, err => handleFirestoreError(err, OperationType.GET, "orders"));
    return unsub;
  }, []);

  const filteredOrders = orders.filter(o => {
    // Only include final transactions in the sales report
    if (o.type === 'web' || o.type === 'web-pre-order' || o.type === 'pre-order') {
       if (o.status !== 'delivered' && o.status !== 'refunded' && o.status !== 'void') return false;
    } else if (o.type === 'pos' || o.type === 'pos-pre-order') {
       if (o.status !== 'completed' && o.status !== 'refunded' && o.status !== 'void') return false;
    }

    // Type Filter
    if (typeFilter === 'pos' && o.type !== 'pos' && o.type !== 'pos-pre-order') return false;
    if (typeFilter === 'web' && o.type !== 'web' && o.type !== 'web-pre-order') return false;
    if (typeFilter === 'manual' && o.type !== 'manual') return false;
    
    // Date Filter
    if (dateRange !== 'all' && o.date) {
      const oDate = new Date(o.date);
      const now = new Date();
      if (dateRange === 'today') {
        if (oDate.toDateString() !== now.toDateString()) return false;
      } else if (dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        if (oDate < weekAgo) return false;
      } else if (dateRange === 'month') {
         if (oDate.getMonth() !== now.getMonth() || oDate.getFullYear() !== now.getFullYear()) return false;
      }
    }
    return true;
  });

  const getOrderAmount = (o: any) => {
    if (o.status === 'refunded' || o.status === 'void' || o.status === 'cancelled') return 0;
    return o.total || 0;
  };

  const netRevenue = filteredOrders.reduce((acc, order) => acc + getOrderAmount(order), 0);
  const grossInflows = filteredOrders.filter(o => getOrderAmount(o) >= 0).reduce((acc, order) => acc + getOrderAmount(order), 0);
  const grossOutflows = filteredOrders.filter(o => getOrderAmount(o) < 0).reduce((acc, order) => acc + Math.abs(getOrderAmount(order)), 0);

  const exportToExcel = () => {
    const wsData = filteredOrders.map(order => ({
      'Date & Time': new Date(order.date).toLocaleString(),
      'Transaction ID': order.id,
      'Source': order.type,
      'Payment Method': order.type === 'manual' ? order.manualPayment || order.paymentMethod : order.paymentMethod || 'cash',
      'Entry Type': order.type === 'manual' ? order.manualType : order.status,
      'Customer/Info': order.type === 'manual' ? `${order.customerName} - ${order.manualNote}` : `${order.customerName || 'Guest Walk-in'} (${order.items?.length || 0} items)`,
      'Amount (PHP)': getOrderAmount(order),
      'Status': order.status
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    XLSX.writeFile(wb, "Sales_Report.xlsx");
  };

  const exportToPDF = () => {
    const docContext = new jsPDF();
    docContext.text("Sales Report (Master Audit Ledger)", 14, 15);
    
    docContext.setFontSize(10);
    docContext.text(`Net Revenue: PHP ${netRevenue.toLocaleString()}`, 14, 25);
    docContext.text(`Total Inflows: PHP ${grossInflows.toLocaleString()}`, 14, 30);
    docContext.text(`Total Outflows: PHP ${grossOutflows.toLocaleString()}`, 14, 35);
    docContext.text(`Total Transactions: ${filteredOrders.length}`, 14, 40);
    
    const tableData = filteredOrders.map(order => [
      new Date(order.date).toLocaleString(),
      order.id.slice(0, 8).toUpperCase(),
      order.type.toUpperCase(),
      (order.type === 'manual' ? order.manualPayment || order.paymentMethod : order.paymentMethod || 'cash').toUpperCase(),
      order.type === 'manual' ? `${order.customerName} - ${order.manualNote}` : `${order.customerName || 'Guest Walk-in'}`,
      (order.status === 'refunded' || order.status === 'void' || order.status === 'cancelled') ? order.status.toUpperCase() : (order.total < 0 ? '-' : '') + 'PHP ' + Math.abs(getOrderAmount(order)).toLocaleString()
    ]);

    autoTable(docContext, {
      startY: 45,
      head: [['Date & Time', 'Ref ID', 'Source', 'Payment', 'Info', 'Amount']],
      body: tableData,
    });

    docContext.save("Sales_Report.pdf");
  };

  return (
    <>
    <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#111] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
         <h2 className="font-bold text-lg flex items-center gap-2 shrink-0"><TrendingUp className="text-[var(--color-4h-green)]" /> Master Audit Ledger</h2>
         <div className="flex flex-wrap gap-2 w-full md:w-auto md:justify-end">
            <select value={dateRange} onChange={e=>setDateRange(e.target.value as any)} className="bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-semibold outline-none focus:border-[var(--color-4h-green)]">
               <option value="all">All Time</option>
               <option value="today">Today</option>
               <option value="week">Past 7 Days</option>
               <option value="month">This Month</option>
            </select>
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value as any)} className="bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-semibold outline-none focus:border-[var(--color-4h-green)]">
               <option value="all">All Transactions</option>
               <option value="pos">POS Only</option>
               <option value="web">Online/Web Only</option>
               <option value="manual">Manual Ledger (Inc/Exp)</option>
            </select>
            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-2 ml-1">
                <button onClick={exportToExcel} className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center" title="Export to Excel">
                    <FileSpreadsheet size={18} className="text-emerald-600 dark:text-emerald-400" />
                </button>
                <button onClick={exportToPDF} className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center" title="Export to PDF">
                    <FileText size={18} className="text-red-500" />
                </button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
         <div className="bg-white dark:bg-[#111] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Net Revenue</div>
            <div className="text-2xl font-display font-black text-[var(--color-4h-green)]">₱ {netRevenue.toLocaleString()}</div>
         </div>
         <div className="bg-white dark:bg-[#111] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Inflows</div>
            <div className="text-2xl font-display font-black text-blue-600">₱ {grossInflows.toLocaleString()}</div>
         </div>
         <div className="bg-white dark:bg-[#111] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Outflows</div>
            <div className="text-2xl font-display font-black text-red-500">₱ {grossOutflows.toLocaleString()}</div>
         </div>
         <div className="bg-white dark:bg-[#111] p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Volume</div>
            <div className="text-2xl font-display font-black text-slate-900 dark:text-white">{filteredOrders.length} txns</div>
         </div>
      </div>
      
      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
             <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151515]">
                   <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date & Time</th>
                   <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Ref / Txn ID</th>
                   <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Source</th>
                   <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Type / Method</th>
                   <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Customer / Info</th>
                   <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Amount</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredOrders.map(order => (
                   <tr key={order.id} onClick={() => setSelectedOrder(order)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{new Date(order.date).toLocaleString()}</td>
                      <td className="p-4 font-mono text-xs text-slate-500">{order.id.slice(0,8).toUpperCase()}</td>
                      <td className="p-4">
                         {order.type === 'pos' || order.type === 'pos-pre-order' ? (
                            <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-md uppercase tracking-widest font-black">POS</span>
                         ) : order.type === 'web' || order.type === 'web-pre-order' ? (
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded-md uppercase tracking-widest font-black">Web Order</span>
                         ) : (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-md uppercase tracking-widest font-black">Manual Ledger</span>
                         )}
                      </td>
                      <td className="p-4">
                         <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">{order.paymentMethod || 'cash'}</span>
                            {order.type === 'manual' && <span className="text-xs text-slate-500 capitalize">{order.manualType}</span>}
                         </div>
                      </td>
                      <td className="p-4 text-sm">
                         {order.type === 'manual' ? (
                            <div className="flex flex-col"><span className="font-bold">{order.customerName}</span><span className="text-xs text-slate-500 truncate max-w-[200px]">{order.manualNote}</span></div>
                         ) : (
                            <div className="flex flex-col"><span className="font-bold">{order.customerName || 'Guest Walk-in'}</span><span className="text-xs text-slate-500">{order.items?.length || 0} items</span></div>
                         )}
                      </td>
                      <td className={`p-4 text-right font-black ${order.status === 'refunded' || order.status === 'void' ? 'text-slate-400 line-through' : order.total < 0 ? 'text-red-500' : 'text-[var(--color-4h-green)]'}`}>
                         {(order.status === 'refunded' || order.status === 'void') && <span className="text-[10px] text-red-500 line-through-none uppercase mr-2 tracking-widest bg-red-100 dark:bg-red-900/40 px-1 rounded">{order.status === 'refunded' ? 'Refunded' : 'Void'}</span>}
                         {order.total < 0 ? '-' : (order.type === 'manual' && order.total > 0 ? '+' : '')}₱ {Math.abs(order.total || 0).toLocaleString()}
                      </td>
                   </tr>
                ))}
                {filteredOrders.length === 0 && (
                   <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">No records found for the selected filters.</td>
                   </tr>
                )}
             </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <AnimatePresence>
        {selectedOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#111] max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151515]">
                <h3 className="font-bold text-xl">Transaction Audit Details</h3>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 p-2 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                 <div className="flex flex-col gap-1 mb-6">
                   <div className="font-bold text-sm text-slate-500 uppercase tracking-widest">Transaction / Ref ID</div>
                   <div className="font-mono bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-sm break-all">{selectedOrder.id}</div>
                 </div>

                 <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                       <span className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-1">Source</span>
                       <span className="font-semibold uppercase text-sm">{selectedOrder.type}</span>
                    </div>
                    {selectedOrder.type === 'manual' ? (
                       <div className="flex flex-col">
                          <span className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-1">Entry Type</span>
                          <span className={`font-semibold uppercase text-sm ${selectedOrder.manualType === 'income' ? 'text-[var(--color-4h-green)]' : 'text-red-500'}`}>{selectedOrder.manualType}</span>
                       </div>
                    ) : (
                       <div className="flex flex-col">
                          <span className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-1">Status</span>
                          <span className="font-semibold uppercase text-sm">{selectedOrder.status}</span>
                       </div>
                    )}
                    <div className="flex flex-col mt-2">
                       <span className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-1">Date Logged</span>
                       <span className="font-semibold text-sm">{new Date(selectedOrder.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-col mt-2">
                       <span className="font-bold text-xs text-slate-500 uppercase tracking-widest mb-1">Timestamp</span>
                       <span className="font-semibold text-sm">{new Date(selectedOrder.date).toLocaleTimeString()}</span>
                    </div>
                 </div>

                 {(selectedOrder.customerName || selectedOrder.customerEmail) && (
                   <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                     <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-3">Customer / Entity</h4>
                     {selectedOrder.customerName && <div className="text-sm"><span className="font-semibold">Name:</span> {selectedOrder.customerName}</div>}
                     {selectedOrder.customerEmail && <div className="text-sm"><span className="font-semibold">Email:</span> {selectedOrder.customerEmail}</div>}
                     {selectedOrder.customerPhone && <div className="text-sm"><span className="font-semibold">Phone:</span> {selectedOrder.customerPhone}</div>}
                     {selectedOrder.shippingAddress && <div className="text-sm mt-1"><span className="font-semibold block">Address:</span> <span className="text-slate-600 dark:text-slate-400">{selectedOrder.shippingAddress}</span></div>}
                   </div>
                 )}

                 {selectedOrder.type === 'manual' && selectedOrder.manualNote && (
                   <div className="mb-6">
                      <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-3">Ledger Note</h4>
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl text-sm font-medium text-amber-800 dark:text-amber-400">
                         {selectedOrder.manualNote}
                      </div>
                   </div>
                 )}

                 {selectedOrder.items && selectedOrder.items.length > 0 && (
                 <div className="mb-6">
                    <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-3">Items Purchased</h4>
                    <div className="flex flex-col gap-3">
                       {selectedOrder.items?.map((item: any, i: number) => {
                          const variant = item.variantId && item.product?.variants ? item.product.variants.find((v:any)=>v.id===item.variantId) : null;
                          return (
                             <div key={i} className="flex gap-4 items-center bg-slate-50 dark:bg-[#151515] p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                {item.product?.images && item.product.images.length > 0 ? (
                                   <img src={item.product.images[0]} alt="" className="w-12 h-12 object-cover rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-slate-800" />
                                ) : (
                                   <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                      <Package size={20} className="text-slate-400"/>
                                   </div>
                                )}
                                <div className="flex-1 min-w-0">
                                   <div className="font-bold truncate text-slate-900 dark:text-white">{item.product?.name}</div>
                                   {item.product?.sku && <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest"><span className="opacity-50">SKU</span> {item.product.sku}</div>}
                                   {variant && <div className="text-xs text-slate-500 mt-0.5">{variant.color} {variant.size}</div>}
                                   <div className="text-sm font-semibold mt-1">₱ {item.product?.salePrice || item.product?.price} × {item.quantity}</div>
                                </div>
                                <div className="font-black text-[var(--color-4h-green)]">
                                   ₱ {((item.product?.salePrice || item.product?.price || 0) * item.quantity).toLocaleString()}
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 </div>
                 )}

                 <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col gap-2">
                    {selectedOrder.items && selectedOrder.items.length > 0 && (
                    <div className="flex justify-between text-sm">
                       <span className="text-slate-500">Subtotal</span>
                       <span className="font-medium">₱ {selectedOrder.total?.toLocaleString()}</span>
                    </div>
                    )}
                    <div className="flex justify-between text-sm text-slate-500">
                       <span>Payment Method</span>
                       <span className="uppercase font-semibold text-slate-800 dark:text-slate-200">{selectedOrder.paymentMethod || 'cash'}</span>
                    </div>
                    {selectedOrder.eWalletProvider && (
                       <div className="flex justify-between text-sm text-slate-500">
                          <span>E-Wallet Provider</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">{selectedOrder.eWalletProvider}</span>
                       </div>
                    )}
                    {selectedOrder.referenceNumber && (
                       <div className="flex justify-between text-sm text-slate-500">
                          <span>Reference Number</span>
                          <span className="font-medium font-mono text-slate-800 dark:text-slate-200">{selectedOrder.referenceNumber}</span>
                       </div>
                    )}
                    <div className="flex justify-between text-lg font-black mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                       <span className="text-slate-900 dark:text-white">{selectedOrder.total < 0 ? 'Total Expense' : 'Total Amount'}</span>
                       <span className={selectedOrder.total < 0 ? 'text-red-500' : 'text-[var(--color-4h-green)]'}>
                         {selectedOrder.total < 0 ? '-' : ''}₱ {Math.abs(selectedOrder.total || 0).toLocaleString()}
                       </span>
                    </div>
                 </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function OrdersManagementTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemInfo, setSelectedItemInfo] = useState<any | null>(null);
  const [statusConfirmDialog, setStatusConfirmDialog] = useState<{orderId: string, newStatus: string} | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), snap => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      const filteredArr = arr.filter(o => o.type !== 'pos');
      filteredArr.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(filteredArr);
    }, err => handleFirestoreError(err, OperationType.GET, "orders"));
    return unsub;
  }, []);

  const isOrderStuck = (o: any) => {
    const isCompleted = o.status === 'completed' || o.status === 'delivered' || o.status === 'cancelled' || o.status === 'returned' || o.status === 'refunded' || o.status === 'void'; 
    if (isCompleted) return false;
    
    const lastUpdated = o.updatedAt ? new Date(o.updatedAt) : (o.date ? new Date(o.date) : new Date());
    const msSinceUpdate = new Date().getTime() - lastUpdated.getTime();
    const daysSinceUpdate = msSinceUpdate / (1000 * 60 * 60 * 24);
    
    if (o.type === 'web' && daysSinceUpdate >= 3) return true;
    if ((o.type === 'web-pre-order' || o.type === 'pos-pre-order' || o.type === 'pre-order') && daysSinceUpdate >= 10) return true;
    
    return false;
  };

  const getFilteredOrders = () => {
    let result = orders;
    if (filterType !== 'all') {
      result = result.filter(o => o.type === filterType);
    }
    if (filterStatus === 'active') {
       result = result.filter(o => {
         const t = o.status || 'pending';
         return t !== 'completed' && t !== 'delivered' && t !== 'cancelled' && t !== 'returned' && t !== 'refunded' && t !== 'void';
       });
    } else if (filterStatus === 'delivered') {
       result = result.filter(o => o.status === 'delivered' || o.status === 'completed');
    } else if (filterStatus !== 'all') {
      result = result.filter(o => o.status === filterStatus || (!o.status && filterStatus === 'pending'));
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => {
        if (o.id.toLowerCase().includes(q)) return true;
        if (o.customerName && o.customerName.toLowerCase().includes(q)) return true;
        if (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) return true;
        if (o.customerPhone && o.customerPhone.toLowerCase().includes(q)) return true;
        
        if (o.items && Array.isArray(o.items)) {
           return o.items.some((item: any) => {
              const p = item.product;
              if (!p) return false;
              if (p.name && p.name.toLowerCase().includes(q)) return true;
              if (p.id && p.id.toLowerCase().includes(q)) return true;
              if (p.sku && p.sku.toLowerCase().includes(q)) return true;
              if (p.category && p.category.toLowerCase().includes(q)) return true;
              return false;
           });
        }
        return false;
      });
    }
    return result;
  };

  const filteredOrders = getFilteredOrders();

  const activeOrdersCount = orders.filter(o => {
    const t = o.status || 'pending';
    return t !== 'completed' && t !== 'delivered' && t !== 'cancelled' && t !== 'returned' && t !== 'refunded' && t !== 'void';
  }).length;
  const webOrdersCount = orders.filter(o => o.type === 'web').length;
  const preOrdersCount = orders.filter(o => o.type === 'pos-pre-order' || o.type === 'web-pre-order' || o.type === 'pre-order').length;

  const performUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);
      const orderData = orderSnap.exists() ? orderSnap.data() : null;

      if (orderData && orderData.status !== 'refunded' && orderData.status !== 'void' && orderData.status !== 'cancelled' && (newStatus === 'refunded' || newStatus === 'void' || newStatus === 'cancelled')) {
        if (orderData.items) {
          for (const item of orderData.items) {
            if (item.product?.id) {
              const prodRef = doc(db, "merchandise", item.product.id);
              const prodSnap = await getDoc(prodRef);
              if (prodSnap.exists()) {
                const product = prodSnap.data();
                let newStockQuantity = product.stockQuantity || 0;
                let newVariants = product.variants || [];
                if (item.variantId && product.variants) {
                  newVariants = product.variants.map((v: any) =>
                    v.id === item.variantId ? { ...v, stock: v.stock + item.quantity } : v
                  );
                } else {
                  newStockQuantity += item.quantity;
                }
                const newSoldQuantity = Math.max(0, (product.soldQuantity || 0) - item.quantity);
                await updateDoc(prodRef, {
                  stockQuantity: newStockQuantity,
                  variants: newVariants,
                  soldQuantity: newSoldQuantity
                });
              }
            }
          }
        }
      }

      await updateDoc(orderRef, { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      // Email mock for reviews to prevent review bombing
      if (newStatus === "delivered" && orderData) {
        const email = orderData.customerEmail || orderData.userId;
        if (email) {
          console.log(`[MOCK EMAIL] Sent to ${email}: Your order is delivered! Please leave a review to verify your purchase.`);
          alert(`Automated email sent to customer (${email}) requesting a product review.`);
        }
      }
      setStatusConfirmDialog(null);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, "orders");
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
     if (newStatus === 'refunded' || newStatus === 'cancelled' || newStatus === 'void') {
        setStatusConfirmDialog({ orderId, newStatus });
     } else {
        performUpdateOrderStatus(orderId, newStatus);
     }
  };

  return (
    <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Active Orders</div>
            <div className="text-3xl font-display font-black text-slate-900 dark:text-white">{activeOrdersCount}</div>
         </div>
         <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Web Orders</div>
            <div className="text-3xl font-display font-black text-indigo-600">{webOrdersCount}</div>
         </div>
         <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Pre-Orders</div>
            <div className="text-3xl font-display font-black text-amber-600">{preOrdersCount}</div>
         </div>
      </div>

      <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-50 dark:bg-[#151515]">
          <h3 className="font-bold flex items-center gap-2 whitespace-nowrap">
            <ShoppingCart className="text-[var(--color-4h-green)]" size={20} />
            Orders Management
          </h3>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full xl:w-auto">
             <div className="flex-1 w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
               <Search size={16} className="text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search Order ID or Customer..." 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="bg-transparent border-none outline-none text-sm w-full font-medium"
               />
             </div>
             <div className="flex flex-wrap items-center gap-1 bg-slate-200/50 dark:bg-black/50 p-1 rounded-xl">
               {[
                 { id: 'active', label: 'Active' },
                 { id: 'all', label: 'All' },
                 { id: 'pending', label: 'Pending' },
                 { id: 'processing', label: 'Processing' },
                 { id: 'shipped', label: 'Shipped' },
                 { id: 'delivered', label: 'Delivered' },
                 { id: 'refunded', label: 'Refunded' },
                 { id: 'void', label: 'Void' }
               ].map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => setFilterStatus(tab.id)}
                   className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${filterStatus === tab.id ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                 >
                   {tab.label}
                 </button>
               ))}
             </div>
             <div className="flex items-center gap-2 bg-white dark:bg-black p-1 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
                <Filter size={14} className="text-slate-400 ml-2 shadow-sm" />
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-600 dark:text-slate-300 outline-none p-2 border-none rounded-md min-w-[150px] shadow-sm appearance-none"
                >
                  <option value="all">All Orders</option>
                  <option value="web">Web Orders</option>
                  <option value="pos-pre-order">POS Pre-Order</option>
                  <option value="web-pre-order">Web Pre-Order</option>
                </select>
             </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 dark:bg-[#151515] dark:border-slate-800">
                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Order Info</th>
                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Customer Details</th>
                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Shipping & Delivery</th>
                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Items</th>
                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Total</th>
                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
               {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-[#151515] transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                      #{order.id.slice(0,8).toUpperCase()}
                      {order.type === 'web' && <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Web</span>}
                      {order.type === 'pos-pre-order' && <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider">POS Pre-Order</span>}
                      {order.type === 'web-pre-order' && <span className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Web Pre-Order</span>}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(order.date).toLocaleString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      {order.customerName ? (
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{order.customerName}</span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No name provided</span>
                      )}
                      
                      {order.customerPhone && (
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {order.customerPhone}
                        </span>
                      )}

                      {order.customerEmail ? (
                        <span className="text-xs text-slate-500 hover:text-[var(--color-4h-green)] transition-colors">
                          <a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No email provided</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {order.shippingAddress ? (
                      <div className="text-sm text-slate-600 dark:text-slate-400 max-w-[200px] leading-snug whitespace-pre-wrap">
                        {typeof order.shippingAddress === 'string' ? order.shippingAddress : (
                          <>
                            <div>{order.shippingAddress.line1} {order.shippingAddress.line2}</div>
                            <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postal_code}</div>
                            <div>{order.shippingAddress.country}</div>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic block">Shipping details unavailable</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      {order.items?.map((item: any, i: number) => {
                        const variant = item.variantId && item.product?.variants ? item.product.variants.find((v:any)=>v.id===item.variantId) : null;
                        return (
                          <div 
                            key={i} 
                            onClick={() => setSelectedItemInfo({ item, order })}
                            className="text-sm flex flex-col gap-1 p-2 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              {item.product?.images && item.product.images.length > 0 ? (
                                 <img src={item.product.images[0]} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                              ) : (
                                 <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex flex-shrink-0" />
                              )}
                              <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.quantity}x</span>
                                  <span className="truncate flex-1">{item.product?.name || "Product"}</span>
                                </div>
                                {variant && (
                                  <span className="text-xs text-slate-500">
                                    {variant.color && `Color: ${variant.color}`} {variant.size && `Size: ${variant.size}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-4 font-black">
                    ₱ {(order.total || 0).toLocaleString()}
                  </td>
                  <td className="p-4">
                     <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                         order.status === 'completed' || order.status === 'delivered' 
                           ? 'text-[var(--color-4h-green)] bg-[var(--color-4h-green)]/10 border-[var(--color-4h-green)]/20' 
                           : order.status === 'cancelled' || order.status === 'refunded' || order.status === 'void'
                           ? 'text-red-600 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-900/50'
                           : 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50'
                     } ${isOrderStuck(order) ? 'animate-pulse ring-2 ring-red-500 ring-offset-1 dark:ring-offset-black !text-red-700 !bg-red-100 !border-red-300 dark:!text-red-400 dark:!bg-red-900/30' : ''}`}>
                        {order.status || 'pending'}
                     </span>
                  </td>
                  <td className="p-4">
                    {(order.status === 'completed' || order.status === 'delivered' || order.status === 'refunded' || order.status === 'void' || order.status === 'cancelled') ? (
                       <span className="text-xs text-slate-400 italic">No actions available</span>
                    ) : (
                      <select 
                        className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black rounded-lg text-sm px-2 py-1 outline-none font-medium"
                        value={order.status || 'pending'}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="refunded">Refunded</option>
                        <option value="void">Void</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <p>No orders found.</p>
                      <button 
                        onClick={async () => {
                          const orderId = doc(collection(db, "orders")).id;
                          await setDoc(doc(db, "orders", orderId), {
                            type: 'web',
                            date: new Date().toISOString(),
                            customerName: 'John Doe',
                            customerEmail: 'example@customer.com',
                            customerPhone: '+1 (555) 123-4567',
                            status: 'pending',
                            total: 1250,
                            items: [
                              { quantity: 1, product: { name: 'Sample Product A' } },
                              { quantity: 2, product: { name: 'Sample Product B' } }
                            ],
                            shippingAddress: '123 Test St, Example City, 12345'
                          });
                        }}
                        className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 px-4 py-2 rounded-lg font-medium text-sm transition-colors border border-indigo-200 dark:border-indigo-800"
                      >
                        Add Sample Order
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedItemInfo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 p-4 sm:p-6"
            onClick={() => setSelectedItemInfo(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#111] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151515]">
                <h3 className="font-bold text-xl">Item Details</h3>
                <button onClick={() => setSelectedItemInfo(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 p-2 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                 {selectedItemInfo.item.product?.images && selectedItemInfo.item.product.images.length > 0 ? (
                   <img src={selectedItemInfo.item.product.images[0]} alt="" className="w-full h-64 sm:h-80 object-contain bg-slate-50 dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800 mb-6" />
                 ) : (
                   <div className="w-full h-64 sm:h-80 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-800">
                     No image
                   </div>
                 )}
                 <h4 className="text-2xl font-bold mb-2">{selectedItemInfo.item.product?.name}</h4>
                 {selectedItemInfo.item.product?.sku && <div className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">SKU: {selectedItemInfo.item.product.sku}</div>}
                 <div className="flex flex-wrap gap-2 mb-6">
                    <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-sm font-semibold">Quantity: {selectedItemInfo.item.quantity}</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-sm font-semibold">Price: ₱ {selectedItemInfo.item.product?.price}</span>
                 </div>

                 {selectedItemInfo.item.variantId && selectedItemInfo.item.product?.variants && (
                   <div className="bg-slate-50 dark:bg-[#151515] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <h5 className="font-bold mb-3 text-slate-700 dark:text-slate-300">Selected Variant</h5>
                      {(() => {
                        const variant = selectedItemInfo.item.product.variants.find((v:any) => v.id === selectedItemInfo.item.variantId);
                        if (!variant) return <div className="text-slate-500">Variant not found</div>;
                        return (
                          <div className="flex flex-col gap-2">
                             {variant.color && (
                               <div className="flex justify-between">
                                 <span className="text-slate-500">Color</span>
                                 <span className="font-semibold">{variant.color}</span>
                               </div>
                             )}
                             {variant.size && (
                               <div className="flex justify-between">
                                 <span className="text-slate-500">Size</span>
                                 <span className="font-semibold">{variant.size}</span>
                               </div>
                             )}
                          </div>
                        );
                      })()}
                   </div>
                 )}
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {statusConfirmDialog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
            onClick={() => setStatusConfirmDialog(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#111] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Package size={32} />
              </div>
              <h3 className="font-bold text-xl mb-2">Void Transaction?</h3>
              <p className="text-slate-500 mb-6 text-sm flex-1">
                Marking this transaction as void/refunded will automatically return the items to your inventory. This action cannot be undone easily.
              </p>
              <div className="flex items-center gap-3 w-full">
                <button 
                   onClick={() => setStatusConfirmDialog(null)}
                   className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors"
                >
                   Cancel
                </button>
                <button 
                   onClick={() => performUpdateOrderStatus(statusConfirmDialog.orderId, statusConfirmDialog.newStatus)}
                   className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-600/30"
                >
                   Yes, Void it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DiscountSettingsTab() {
  const [settings, setSettings] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({
    activeMemberDiscount: 0,
    alumniTier1: 0,
    alumniTier2: 0,
    alumniTier3: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "shop_discounts"), snap => {
      if (snap.exists()) {
        const data = snap.data();
        setSettings(data);
        setEditForm(data.pendingChanges || data);
      }
      setLoading(false);
    }, err => handleFirestoreError(err, OperationType.GET, "settings"));
    return unsub;
  }, []);

  const handleSave = async () => {
    try {
      await setDoc(doc(db, "settings", "shop_discounts"), {
        activeMemberDiscount: settings?.activeMemberDiscount || 0,
        alumniTier1: settings?.alumniTier1 || 0,
        alumniTier2: settings?.alumniTier2 || 0,
        alumniTier3: settings?.alumniTier3 || 0,
        ...settings,
        pendingChanges: editForm,
        status: "pending_approval"
      }, { merge: true });
      alert("Discount settings submitted to Treasurer for approval.");
    } catch(err) {
      console.error(err);
      alert("Failed to submit.");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display tracking-tight">Discount Settings</h2>
        <p className="text-slate-500 text-sm mt-1">Configure shop discounts for active members and alumni.</p>
      </div>

      {settings?.status === "pending_approval" && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl text-amber-700 dark:text-amber-500 text-sm font-semibold flex items-center justify-between">
          <span>Changes are currently pending approval from the Treasurer.</span>
        </div>
      )}

      <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div>
          <label className="block text-sm font-bold mb-2">Active Member Discount (%)</label>
          <input 
            type="number" 
            value={editForm.activeMemberDiscount || 0}
            onChange={(e) => setEditForm({...editForm, activeMemberDiscount: Number(e.target.value)})}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151515] outline-none"
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-bold border-b border-slate-100 dark:border-slate-800 pb-2">Alumni Discounts (Based on continuous joined years)</h3>
          
          <div>
            <label className="block text-sm font-bold mb-2">Tier 1: 1-4 Years Renewed (%)</label>
            <input 
              type="number" 
              step="0.1"
              value={editForm.alumniTier1 || 0}
              onChange={(e) => setEditForm({...editForm, alumniTier1: Number(e.target.value)})}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151515] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Tier 2: 5-8 Years Renewed (%)</label>
            <input 
              type="number" 
              step="0.1"
              value={editForm.alumniTier2 || 0}
              onChange={(e) => setEditForm({...editForm, alumniTier2: Number(e.target.value)})}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151515] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Tier 3: 9+ Years Renewed (%)</label>
            <input 
              type="number" 
              step="0.1"
              value={editForm.alumniTier3 || 0}
              onChange={(e) => setEditForm({...editForm, alumniTier3: Number(e.target.value)})}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151515] outline-none"
            />
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-3 bg-[var(--color-4h-green)] text-white font-bold rounded-xl hover:bg-green-700 transition"
        >
          Submit for Approval
        </button>
      </div>
    </div>
  );
}
