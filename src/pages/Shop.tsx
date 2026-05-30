import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, Tag, Share2, Heart, Search, X, Star, ShoppingCart, Plus, Minus, ArrowRight, LogIn, LogOut, ChevronLeft, ChevronRight, Scissors, Eye, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, onSnapshot, query, doc, setDoc, updateDoc, deleteDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";
import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";

type Merchandise = {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  costPerItem?: number;
  sku?: string;
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
  reviews?: { id?: string; userId?: string; user: string; rating?: number; comment: string; hideIdentity?: boolean; createdAt?: string }[];
  details?: string;
};

type CartItem = {
  id: string; // Firestore document ID
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
  addedAt: string;
  item?: Merchandise; // Populated client-side
};

export default function Shop() {
  const [merchandise, setMerchandise] = useState<Merchandise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Recommended");
  
  const [user, setUser] = useState<User | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Merchandise | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [hideIdentity, setHideIdentity] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [checkoutPhase, setCheckoutPhase] = useState<"cart" | "address" | "discount">("cart");
  const [checkoutDetails, setCheckoutDetails] = useState({ 
    fullName: "", 
    contactNumber: "",
    region: "",
    city: "",
    barangay: "",
    street: "",
    landmark: "",
    memberIdStr: ""
  });
  const [appliedDiscountRate, setAppliedDiscountRate] = useState(0);
  const [memberValidationMessage, setMemberValidationMessage] = useState({text: "", type: ""});
  const [discountSettings, setDiscountSettings] = useState<any>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [description, setDescription] = useState("Support our initiatives. All proceeds fund community projects.");

  useEffect(() => {
    const unsubSite = onSnapshot(doc(db, "settings", "site"), snap => {
      if (snap.exists() && snap.data().shopDescription) {
        setDescription(snap.data().shopDescription);
      }
    });

    // Listen to discount settings
    const unsubSettings = onSnapshot(doc(db, "settings", "shop_discounts"), snap => {
      if (snap.exists() && snap.data().status === "approved") {
        setDiscountSettings(snap.data());
      }
    });

    // Listen to auth state
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      
      if (u) {
        // Ensure user profile exists
        const userRef = doc(db, 'users', u.uid);
        getDoc(userRef).then(snap => {
          if (!snap.exists()) {
            setDoc(userRef, { createdAt: serverTimestamp(), wishlist: [] }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'users'));
          } else {
            setWishlist(snap.data().wishlist || []);
          }
        });

        // Listen to User Profile changes (wishlist)
        const unsubProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setWishlist(docSnap.data().wishlist || []);
          }
        }, (err) => {
          if (auth.currentUser) handleFirestoreError(err, OperationType.GET, 'users');
        });
        
        // Listen to Cart
        const unsubCart = onSnapshot(collection(db, 'users', u.uid, 'cart'), (snap) => {
          const items: CartItem[] = [];
          snap.forEach(d => {
            items.push({ id: d.id, ...d.data() } as CartItem);
          });
          setCart(items);
        }, (err) => {
          if (auth.currentUser) handleFirestoreError(err, OperationType.GET, 'users/cart');
        });

        return () => { unsubProfile(); unsubCart(); };
      } else {
        setWishlist([]);
        setCart([]);
      }
    });

    // Listen to Merchandise
    const unsubMerch = onSnapshot(collection(db, 'merchandise'), (snap) => {
      const items: Merchandise[] = [];
      snap.forEach(d => {
        items.push({ id: d.id, ...d.data() } as Merchandise);
      });
      setMerchandise(items);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'merchandise'));

    return () => {
      unsubscribeAuth();
      unsubMerch();
      unsubSettings();
      unsubSite();
    };
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const categories = ["All", ...Array.from(new Set(merchandise.map(item => item.category)))];

  const filteredItems = useMemo(() => {
    let items = merchandise.filter(m => m.isVisible !== false);
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q)
      );
    }
    
    if (selectedCategory !== "All") {
      items = items.filter(item => item.category === selectedCategory);
    }
    
    items = [...items].sort((a, b) => {
      const aPrice = a.salePrice || a.price;
      const bPrice = b.salePrice || b.price;
      if (sortBy === "Price: Low to High") return aPrice - bPrice;
      if (sortBy === "Price: High to Low") return bPrice - aPrice;
      if (sortBy === "Top Rated") return (b.rating || 0) - (a.rating || 0);
      return 0;
    });
    
    return items;
  }, [searchQuery, selectedCategory, sortBy, merchandise]);

  const toggleWishlist = async (e: any, id: string) => {
    e.stopPropagation();
    if (!user) {
      alert("Please login to save to wishlist.");
      return;
    }
    const userRef = doc(db, 'users', user.uid);
    let newWishlist = [...wishlist];
    if (newWishlist.includes(id)) {
      newWishlist = newWishlist.filter(wId => wId !== id);
    } else {
      newWishlist.push(id);
    }
    try {
      await updateDoc(userRef, { wishlist: newWishlist });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  const [isVerifiedBuyer, setIsVerifiedBuyer] = useState(false);

  useEffect(() => {
    if (!user || !selectedProduct) {
      setIsVerifiedBuyer(false);
      return;
    }
    const checkVerified = async () => {
      try {
        const { query, collection, where, getDocs } = await import("firebase/firestore");
        
        let verified = false;
        const checkOrder = (order: any) => {
          if (["completed", "delivered"].includes(order.status)) {
             if (order.items && order.items.some((i: any) => i.productId === selectedProduct.id || i.product?.id === selectedProduct.id)) {
                verified = true;
             }
          }
        };

        const q1 = query(collection(db, "orders"), where("userId", "==", user.uid));
        const snap1 = await getDocs(q1);
        snap1.forEach(docSnap => checkOrder(docSnap.data()));

        if (!verified && user.email) {
           const q2 = query(collection(db, "orders"), where("customerEmail", "==", user.email));
           const snap2 = await getDocs(q2);
           snap2.forEach(docSnap => checkOrder(docSnap.data()));
        }

        setIsVerifiedBuyer(verified);
      } catch (err) {
        console.error("Error verifying buyer", err);
      }
    };
    checkVerified();
  }, [user, selectedProduct]);

  const handleSubmitReview = async () => {
    if (!selectedProduct || !user) return;
    if (!isVerifiedBuyer) {
      alert("Only verified buyers can leave a review. You must have received or purchased this product.");
      return;
    }
    try {
      const reviewObj = { 
        id: Math.random().toString(36).substr(2, 9),
        userId: user.uid,
        user: hideIdentity ? 'Anonymous' : (user.displayName || 'Anonymous'), 
        rating: newRating,
        comment: newReview.trim(),
        hideIdentity: hideIdentity,
        createdAt: new Date().toISOString()
      };
      
      const newReviews = [...(selectedProduct.reviews || []), reviewObj];
      const validRatings = newReviews.filter(r => r.rating !== undefined).map(r => r.rating as number);
      const computedRating = validRatings.length > 0 
        ? validRatings.reduce((a, b) => a + b, 0) / validRatings.length 
        : 0;

      await updateDoc(doc(db, "merchandise", selectedProduct.id), {
        reviews: newReviews,
        rating: computedRating
      });
      
      setSelectedProduct({ ...selectedProduct, reviews: newReviews, rating: computedRating });
      setNewReview("");
      setNewRating(5);
      setHideIdentity(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "merchandise");
    }
  };

  const addToCart = async (product: Merchandise, size?: string, color?: string) => {
    if (!user) {
      alert("Please login to add to cart.");
      return;
    }
    
    const hasVariants = product.variants && product.variants.length > 0;
    const currentVariant = hasVariants ? product.variants!.find(v => v.color === color && v.size === size) : null;
    const stockLimit = currentVariant ? currentVariant.stock : (product.stockQuantity || 0);

    const existing = cart.find(c => c.productId === product.id && c.size === size && c.color === color);
    const existingQty = existing ? existing.quantity : 0;

    if (product.stockStatus === 'Out of Stock' || stockLimit <= 0 || existingQty >= stockLimit) {
      alert("This item is out of stock or you have reached the maximum stock limit.");
      return;
    }

    try {
      if (existing) {
        await updateDoc(doc(db, 'users', user.uid, 'cart', existing.id), {
          quantity: existing.quantity + 1
        });
      } else {
        const newCartRef = doc(collection(db, 'users', user.uid, 'cart'));
        const payload: any = {
          productId: product.id,
          quantity: 1,
          addedAt: serverTimestamp()
        };
        if (size) payload.size = size;
        if (color) payload.color = color;
        await setDoc(newCartRef, payload);
      }
      setIsCartOpen(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'users/cart');
    }
  };

  const updateCartQuantity = async (cartItem: CartItem, delta: number) => {
    if (!user) return;
    const newQuantity = cartItem.quantity + delta;
    
    if (delta > 0) {
      const product = merchandise.find(m => m.id === cartItem.productId);
      if (product) {
        const hasVariants = product.variants && product.variants.length > 0;
        const currentVariant = hasVariants ? product.variants!.find(v => v.color === cartItem.color && v.size === cartItem.size) : null;
        const stockLimit = currentVariant ? currentVariant.stock : (product.stockQuantity || 0);

        if (product.stockStatus === 'Out of Stock' || stockLimit <= 0 || newQuantity > stockLimit) {
          alert("This item is out of stock or you have reached the maximum stock limit.");
          return;
        }
      }
    }

    try {
      if (newQuantity <= 0) {
        await deleteDoc(doc(db, 'users', user.uid, 'cart', cartItem.id));
      } else {
        await updateDoc(doc(db, 'users', user.uid, 'cart', cartItem.id), { quantity: newQuantity });
      }
    } catch(err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users/cart');
    }
  };

  const updateCartQuantityAbsolute = async (cartItem: CartItem, newQuantity: number) => {
    if (!user) return;
    if (isNaN(newQuantity)) return;
    
    const product = merchandise.find(m => m.id === cartItem.productId);
    if (product) {
      const hasVariants = product.variants && product.variants.length > 0;
      const currentVariant = hasVariants ? product.variants!.find(v => v.color === cartItem.color && v.size === cartItem.size) : null;
      const stockLimit = currentVariant ? currentVariant.stock : (product.stockQuantity || 0);

      if (newQuantity > stockLimit) {
        newQuantity = stockLimit;
      }
    }

    try {
      if (newQuantity <= 0) {
        await deleteDoc(doc(db, 'users', user.uid, 'cart', cartItem.id));
      } else {
        await updateDoc(doc(db, 'users', user.uid, 'cart', cartItem.id), { quantity: newQuantity });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users/cart');
    }
  };

  const deleteCartItem = async (cartItemId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'cart', cartItemId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'users/cart');
    }
  };

  const openProductModal = (product: Merchandise) => {
    setSelectedProduct(product);
    setMediaIndex(0);
    
    // Determine unique colors and sizes from variants if they exist
    const variants = product.variants || [];
    const hasVariants = variants.length > 0;
    
    let defaultColor = "";
    if (hasVariants) {
      const distinctColors = Array.from(new Set(variants.map(v => v.color)));
      if (distinctColors.length > 0) defaultColor = distinctColors[0] || "";
    }
    setSelectedColor(defaultColor);

    let defaultSize = "";
    if (hasVariants) {
      // Find sizes for the default color
      const matchingVariants = variants.filter(v => v.color === defaultColor);
      if (matchingVariants.length > 0) defaultSize = matchingVariants[0].size || "";
    }
    setSelectedSize(defaultSize);
  };

  // Populate cart with merchandise details
  const populatedCart = cart.map(c => ({
    ...c,
    item: merchandise.find(m => m.id === c.productId)
  })).filter(c => c.item); // Ignore items whose product is deleted or not loaded yet

  const cartTotal = populatedCart.reduce((acc, curr) => acc + (((curr.item?.salePrice || curr.item?.price) || 0) * curr.quantity), 0);
  const discountedTotal = cartTotal * (1 - appliedDiscountRate / 100);

  const verifyMemberId = async () => {
    if (!checkoutDetails.memberIdStr.trim()) {
      setMemberValidationMessage({text: "Please enter a 4-H ID", type: "error"});
      return;
    }
    
    setMemberValidationMessage({text: "Validating...", type: "neutral"});
    try {
      const docSnap = await getDoc(doc(db, "members", checkoutDetails.memberIdStr.trim()));
      if (docSnap.exists()) {
        const member = docSnap.data();
        if (member.status === "Active") {
          let rate = discountSettings?.activeMemberDiscount || 0;
          let msg = `Active Member confirmed! ${rate}% discount applied.`;
          
          if (member.category === "Alumni" || member.age > 30) {
            // Check joined years
            const joinedYear = member.joined ? new Date(member.joined).getFullYear() : (member.registrationDate ? new Date(member.registrationDate).getFullYear() : new Date().getFullYear());
            const currentYear = new Date().getFullYear();
            const years = currentYear - joinedYear;
            
            if (years >= 9) {
              rate = discountSettings?.alumniTier3 || 0;
              msg = `Alumni (9+ years) confirmed! ${rate}% discount applied.`;
            } else if (years >= 5) {
              rate = discountSettings?.alumniTier2 || 0;
              msg = `Alumni (5-8 years) confirmed! ${rate}% discount applied.`;
            } else if (years >= 1) {
              rate = discountSettings?.alumniTier1 || 0;
              msg = `Alumni (1-4 years) confirmed! ${rate}% discount applied.`;
            } else {
               msg = `Alumni confirmed! ${rate}% discount applied.`;
            }
          }
          
          setAppliedDiscountRate(rate);
          setMemberValidationMessage({text: msg, type: "success"});
          setTimeout(() => setCheckoutPhase("address"), 1500);
        } else {
          setAppliedDiscountRate(0);
          setMemberValidationMessage({text: `ID is registered but status is ${member.status || "Not Renewed/Inactive"}. Please renew to get discount.`, type: "error"});
        }
      } else {
        setAppliedDiscountRate(0);
        setMemberValidationMessage({text: "4-H ID not found.", type: "error"});
      }
    } catch (err) {
      console.error(err);
      setAppliedDiscountRate(0);
      setMemberValidationMessage({text: "Error validating ID.", type: "error"});
    }
  };

  const handleCheckoutSubmit = async () => {
    if (!user) return alert("Please login to checkout.");
    if (populatedCart.length === 0) return alert("Cart is empty.");
    
    try {
      setIsProcessingCheckout(true);
      const orderRef = doc(collection(db, 'orders'));
      const orderItems = populatedCart.map(c => ({
        product: c.item,
        variantId: c.item?.variants?.find(v => v.color === c.color && v.size === c.size)?.id || null,
        quantity: c.quantity
      }));
      
      const totalAmount = discountedTotal;
      
      await setDoc(orderRef, {
        type: 'web',
        date: new Date().toISOString(),
        status: 'active',
        customerName: checkoutDetails.fullName,
        customerEmail: user.email,
        contactNumber: checkoutDetails.contactNumber,
        address: `${checkoutDetails.street}, ${checkoutDetails.barangay}, ${checkoutDetails.city}, ${checkoutDetails.region}`,
        landmark: checkoutDetails.landmark,
        items: orderItems,
        total: totalAmount,
        subTotal: cartTotal,
        discountApplied: appliedDiscountRate,
        buyer4HId: checkoutDetails.memberIdStr.trim() || null,
        paymentMethod: 'cash on delivery',
        userId: user.uid
      });

      for (const cartItem of populatedCart) {
        await deleteDoc(doc(db, 'users', user.uid, 'cart', cartItem.id));
      }
      
      alert("Order successfully placed!");
      setIsCartOpen(false);
      setCheckoutPhase("cart");
      setCheckoutDetails({ 
        fullName: "", contactNumber: "", region: "", city: "", barangay: "", street: "", landmark: "", memberIdStr: ""
      });
    } catch (err) {
      console.error(err);
      alert("Failed to checkout. Please try again.");
    } finally {
      setIsProcessingCheckout(false);
    }
  };


  return (
    <div className="container mx-auto px-4 md:px-6 pt-32 pb-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-[var(--color-4h-green)]/5 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/2"></div>
      
      {/* Header & Cart Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl md:text-6xl font-black text-[var(--color-ink)] dark:text-white tracking-tighter mb-4 flex items-center gap-4">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)]">
              <ShoppingBag size={28} />
            </div>
            <span><span className="text-[var(--color-4h-green)]">4-H</span> Shop</span>
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">
            {description}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {!user ? (
            <button 
              onClick={handleLogin}
              className="relative inline-flex items-center gap-2 bg-slate-900 border border-slate-700 px-6 py-4 rounded-full font-bold text-white hover:bg-slate-800 transition-all shadow-sm"
            >
              <LogIn size={20} />
              <span>Login</span>
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => signOut(auth)}
                className="text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2 mr-2"
                title="Log Out"
              >
                <LogOut size={16} /> Logout
              </button>
              <button 
                onClick={() => {/* Handle Wishlist Opening */}}
                className="relative inline-flex items-center justify-center bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 w-14 h-14 rounded-full text-slate-900 dark:text-white hover:border-red-500 hover:text-red-500 transition-all shadow-sm group"
                title="Wishlist"
              >
                <Heart size={20} className={wishlist.length > 0 ? "fill-red-500 text-red-500" : ""} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-[10px] rounded-full font-bold shadow-sm">
                    {wishlist.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative inline-flex items-center gap-2 bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-full font-bold text-slate-900 dark:text-white hover:border-[var(--color-4h-green)] transition-all shadow-sm"
              >
                <ShoppingCart size={20} />
                <span>My Cart</span>
                {populatedCart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[var(--color-4h-green)] text-white w-6 h-6 flex items-center justify-center text-xs rounded-full font-bold shadow-sm">
                    {populatedCart.reduce((a, b) => a + b.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="mb-10 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search merchandise..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-100 dark:bg-[#111] border-none rounded-2xl outline-none focus:ring-2 focus:ring-[var(--color-4h-green)]/50 transition-all text-slate-900 dark:text-white font-medium"
            />
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Sort:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl font-semibold outline-none focus:ring-2 focus:ring-[var(--color-4h-green)]/50 cursor-pointer appearance-none pr-10 relative text-sm"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
            >
              <option>Recommended</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Top Rated</option>
            </select>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all",
                selectedCategory === cat
                  ? "bg-[var(--color-4h-green)] text-white shadow-md shadow-green-900/10"
                  : "bg-white dark:bg-[#151515] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-[var(--color-4h-green)] hover:text-[var(--color-4h-green)]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-20 text-center text-slate-500 font-medium text-lg">No items found matching your criteria.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, i) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                onClick={() => openProductModal(item)}
                className="group flex flex-col bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:border-[var(--color-4h-green)]/50 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-[var(--color-4h-green)]/5 relative"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-[#151515] p-6">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <img
                    src={item.images?.[0] || "https://placehold.co/600x600?text=No+Image"}
                    alt={item.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 items-start">
                    {item.salePrice && (
                      <span className="bg-red-500 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1">Sale</span>
                    )}
                    {(item.stockStatus === 'Out of Stock' || (item.variants?.length ? item.variants.reduce((a,v) => a+v.stock, 0) : item.stockQuantity || 0) <= 0) && (
                      <span className="bg-slate-900 dark:bg-red-900 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1">Out of Stock</span>
                    )}
                    {item.stockStatus === 'On Pre-order' && (
                      <span className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1">Pre-order</span>
                    )}
                    <span className="bg-white/90 dark:bg-[#111]/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)] dark:text-white shadow-sm flex items-center gap-1">
                      <Tag size={12} />
                      {item.category}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => toggleWishlist(e, item.id)}
                    className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/90 dark:bg-[#111]/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform duration-300"
                  >
                    <Heart size={18} className={wishlist.includes(item.id) ? "fill-red-500 text-red-500" : "text-slate-400"} />
                  </button>
                </div>

                <div className="p-6 flex flex-col flex-1 relative z-10 bg-white dark:bg-[#0a0a0a]">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white group-hover:text-[var(--color-4h-green)] transition-colors leading-tight">
                      {item.name}
                    </h3>
                    <div className="font-mono font-bold text-xl text-[var(--color-4h-green)] whitespace-nowrap mt-1 flex flex-col items-end">
                      {item.salePrice ? (
                        <>
                          <span className="text-sm line-through opacity-50 text-slate-500">₱{item.price.toFixed(2)}</span>
                          <span>₱{item.salePrice.toFixed(2)}</span>
                        </>
                      ) : (
                        <span>₱{item.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-4">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold">{(item.rating && item.rating > 0) ? item.rating.toFixed(1) : "0"}</span>
                    <span className="text-xs text-slate-500 ml-1">({item.reviews?.length || 0} reviews)</span>
                  </div>
                  
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-auto mb-6">
                    {item.description}
                  </p>

                  <div className="mt-auto">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 group-hover:bg-[var(--color-4h-green)] group-hover:text-white transition-all w-full">
                      View Details <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Cart Navigation Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-full md:w-[450px] h-full bg-white dark:bg-[#0a0a0a] border-l border-slate-200 dark:border-slate-800 z-[101] flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#111]">
                <h2 className="font-display text-2xl font-bold flex items-center gap-3">
                  <ShoppingCart className="text-[var(--color-4h-green)]" />
                  Your Cart
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                {populatedCart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 space-y-4">
                    <ShoppingCart size={48} className="opacity-20 mb-2" />
                    <p className="font-medium text-lg">Your cart is empty.</p>
                    <button onClick={() => { setIsCartOpen(false); setCheckoutPhase("cart"); }} className="text-[var(--color-4h-green)] font-bold hover:underline">Continue Shopping</button>
                  </div>
                ) : checkoutPhase === "cart" ? (
                  populatedCart.map((cartItem, idx) => (
                    <div key={`${cartItem.id}-${idx}`} className="flex gap-4">
                      <button onClick={() => { if(cartItem.item) { setSelectedProduct(cartItem.item); setIsCartOpen(false); } }} className="w-24 h-24 bg-slate-100 dark:bg-[#151515] rounded-2xl overflow-hidden shrink-0 hover:opacity-90 transition-opacity">
                        <img src={cartItem.item?.images?.[0] || "https://placehold.co/600x600?text=No+Image"} alt={cartItem.item?.name} className="w-full h-full object-contain" />
                      </button>
                      <div className="flex-1 flex flex-col">
                        <h4 onClick={() => { if(cartItem.item) { setSelectedProduct(cartItem.item); setIsCartOpen(false); } }} className="font-bold text-slate-900 dark:text-white leading-tight mb-1 cursor-pointer hover:underline">{cartItem.item?.name}</h4>
                        <div className="text-sm font-semibold text-slate-500 mb-2">
                          {cartItem.color ? `Color: ${cartItem.color} | ` : ""}
                          {cartItem.size ? `Size: ${cartItem.size} | ` : ""}
                          <span className="text-[var(--color-4h-green)] font-mono">₱{(cartItem.item?.salePrice || cartItem.item?.price || 0).toFixed(2)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateCartQuantity(cartItem, -1)} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#151515] text-slate-600 dark:text-slate-300">
                              <Minus size={14} />
                            </button>
                            <input 
                              type="number" 
                              className="font-bold w-12 text-center bg-transparent outline-none border-b-2 border-transparent focus:border-[var(--color-4h-green)] hide-arrows"
                              value={cartItem.quantity || ''}
                              onChange={(e) => updateCartQuantityAbsolute(cartItem, parseInt(e.target.value) || 0)}
                            />
                            <button onClick={() => updateCartQuantity(cartItem, 1)} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#151515] text-slate-600 dark:text-slate-300">
                              <Plus size={14} />
                            </button>
                          </div>
                          <button onClick={() => deleteCartItem(cartItem.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition-colors ml-2" title="Remove from cart">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : checkoutPhase === "discount" ? (
                  <div className="flex flex-col gap-4">
                    <button onClick={() => setCheckoutPhase("cart")} className="self-start text-sm font-semibold text-[var(--color-4h-green)] hover:underline">&larr; Back to Cart Items</button>
                    <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-800 pb-2">Apply Member Discount</h3>
                    <p className="text-sm text-slate-500">Do you have an active 4-H ID? Please provide your ID to claim your member or alumni discounts.</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">4-H Member ID</label>
                        <input type="text" value={checkoutDetails.memberIdStr} onChange={(e) => setCheckoutDetails({...checkoutDetails, memberIdStr: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151515] outline-none focus:border-[var(--color-4h-green)] transition-colors" placeholder="e.g. 4H-2023-1002" />
                      </div>
                      {memberValidationMessage.text && (
                        <div className={`p-3 rounded-xl text-sm font-bold ${memberValidationMessage.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : memberValidationMessage.type === 'success' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-slate-100 text-slate-600 dark:bg-[#111]'}`}>
                           {memberValidationMessage.text}
                        </div>
                      )}
                      <div className="flex gap-3">
                         <button onClick={verifyMemberId} className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90">Verify & Apply</button>
                         <button onClick={() => setCheckoutPhase("address")} className="py-3 px-6 bg-slate-200 dark:bg-[#333] text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-[#444]">Skip</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <button onClick={() => setCheckoutPhase("cart")} className="self-start text-sm font-semibold text-[var(--color-4h-green)] hover:underline">&larr; Back to Cart Items</button>
                    <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-800 pb-2">Delivery Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Full Name</label>
                        <input type="text" value={checkoutDetails.fullName} onChange={(e) => setCheckoutDetails({...checkoutDetails, fullName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151515] outline-none focus:border-[var(--color-4h-green)] transition-colors" placeholder="e.g. Juan De La Cruz" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Contact Number</label>
                        <input type="text" value={checkoutDetails.contactNumber} onChange={(e) => setCheckoutDetails({...checkoutDetails, contactNumber: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151515] outline-none focus:border-[var(--color-4h-green)] transition-colors" placeholder="e.g. 0912 345 6789" />
                      </div>
                      
                      {/* Address Text Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Region / Province</label>
                          <input 
                            type="text" 
                            value={checkoutDetails.region} 
                            onChange={(e) => setCheckoutDetails({...checkoutDetails, region: e.target.value})} 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151515] outline-none focus:border-[var(--color-4h-green)] transition-colors" 
                            placeholder="e.g. Metro Manila" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">City / Municipality</label>
                          <input 
                            type="text" 
                            value={checkoutDetails.city} 
                            onChange={(e) => setCheckoutDetails({...checkoutDetails, city: e.target.value})} 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151515] outline-none focus:border-[var(--color-4h-green)] transition-colors" 
                            placeholder="e.g. Quezon City" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Barangay</label>
                          <input 
                            type="text" 
                            value={checkoutDetails.barangay} 
                            onChange={(e) => setCheckoutDetails({...checkoutDetails, barangay: e.target.value})} 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151515] outline-none focus:border-[var(--color-4h-green)] transition-colors" 
                            placeholder="e.g. Barangay Commonwealth" 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Street Name, House No., Building / Subdivision</label>
                        <input type="text" value={checkoutDetails.street} onChange={(e) => setCheckoutDetails({...checkoutDetails, street: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151515] outline-none focus:border-[var(--color-4h-green)] transition-colors" placeholder="e.g. 123 Rizal St., Bgy. Hall" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                           Landmark <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                        </label>
                        <input type="text" value={checkoutDetails.landmark} onChange={(e) => setCheckoutDetails({...checkoutDetails, landmark: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151515] outline-none focus:border-[var(--color-4h-green)] transition-colors" placeholder="e.g. Near 7-Eleven" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {populatedCart.length > 0 && (
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-500">Subtotal ({populatedCart.reduce((a,b) => a+b.quantity, 0)} items)</span>
                    <span className="font-bold text-lg">₱{cartTotal.toFixed(2)}</span>
                  </div>
                  {appliedDiscountRate > 0 && (
                    <div className="flex justify-between items-center mb-2 text-[var(--color-4h-green)]">
                      <span className="font-semibold">Member Discount ({appliedDiscountRate}%)</span>
                      <span className="font-bold text-lg">-₱{(cartTotal * (appliedDiscountRate / 100)).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-white">Total</span>
                    <span className="font-display font-black text-3xl">₱{discountedTotal.toFixed(2)}</span>
                  </div>
                  {checkoutPhase === "cart" ? (
                    <button onClick={() => setCheckoutPhase("discount")} className="w-full py-4 bg-[var(--color-4h-green)] text-white rounded-2xl font-bold text-lg hover:shadow-lg hover:bg-green-700 transition-all">
                      Proceed to Checkout
                    </button>
                  ) : checkoutPhase === "discount" ? null : (
                    <button 
                      onClick={handleCheckoutSubmit} 
                      disabled={isProcessingCheckout || !checkoutDetails.fullName.trim() || !checkoutDetails.contactNumber.trim() || !checkoutDetails.region.trim() || !checkoutDetails.city.trim() || !checkoutDetails.barangay.trim() || !checkoutDetails.street.trim()} 
                      className="w-full py-4 bg-[var(--color-4h-green)] disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-2xl font-bold text-lg hover:shadow-lg hover:bg-green-700 disabled:hover:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessingCheckout ? (
                         <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Processing...
                         </>
                      ) : (
                         "Confirm & Checkout"
                      )}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-[5%] left-1/2 -translate-x-1/2 w-[90%] max-w-5xl max-h-[90vh] bg-white dark:bg-[#0a0a0a] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl z-[101] overflow-hidden flex flex-col md:flex-row"
            >
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[#222] transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>

              <div className="w-full md:w-1/2 bg-slate-100 dark:bg-[#111] relative group flex items-center justify-center min-h-[40vh]">
                {(() => {
                  const mediaList: { type: 'video' | 'image', url: string }[] = [];
                  if (selectedProduct.video) mediaList.push({ type: 'video', url: selectedProduct.video });
                  if (selectedProduct.images) selectedProduct.images.forEach(img => mediaList.push({ type: 'image', url: img }));
                  
                  const currentMedia = mediaList[mediaIndex] || mediaList[0];

                  return currentMedia ? (
                    <>
                      {currentMedia.type === 'video' ? (
                        currentMedia.url.includes('youtube.com') || currentMedia.url.includes('youtu.be') ? (
                          <iframe 
                            src={(() => {
                              const match = currentMedia.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^"&?\/\s]{11})/);
                              return match ? `https://www.youtube.com/embed/${match[1]}` : currentMedia.url;
                            })()} 
                            className="w-full h-full max-h-[40vh] md:max-h-[80vh] object-contain p-8 border-none"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        ) : (
                          <video src={currentMedia.url} controls autoPlay muted playsInline loop className="w-full h-full max-h-[40vh] md:max-h-[80vh] object-contain p-8" />
                        )
                      ) : (
                        <img src={currentMedia.url} alt={selectedProduct.name} className="w-full h-full max-h-[40vh] md:max-h-[80vh] object-contain p-8" />
                      )}
                      
                      {mediaList.length > 1 && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setMediaIndex(prev => (prev - 1 + mediaList.length) % mediaList.length); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-full items-center justify-center shadow-lg hover:scale-110 transition-transform opacity-0 group-hover:opacity-100 flex text-slate-900 dark:text-white"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setMediaIndex(prev => (prev + 1) % mediaList.length); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-full items-center justify-center shadow-lg hover:scale-110 transition-transform opacity-0 group-hover:opacity-100 flex text-slate-900 dark:text-white"
                          >
                            <ChevronRight size={20} />
                          </button>
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {mediaList.map((_, idx) => (
                              <button key={idx} onClick={() => setMediaIndex(idx)} className={cn("w-2 h-2 rounded-full transition-all", idx === mediaIndex ? "bg-[var(--color-4h-green)] w-4" : "bg-slate-300 dark:bg-slate-700")} />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : <div className="text-slate-400">No media available</div>;
                })()}
              </div>
              
              <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-[#151515] rounded-full text-xs font-bold uppercase tracking-widest text-[var(--color-ink)] dark:text-white mb-4">
                  <Tag size={12} />
                  {selectedProduct.category}
                </div>
                
                <h2 className="font-display text-4xl font-bold mb-2 text-slate-900 dark:text-white leading-tight">
                  {selectedProduct.name}
                </h2>
                
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                  {selectedProduct.salePrice ? (
                    <div className="flex flex-col">
                      <span className="font-mono text-lg line-through opacity-60">₱{selectedProduct.price.toFixed(2)}</span>
                      <span className="font-mono text-4xl font-bold text-[var(--color-4h-green)]">₱{selectedProduct.salePrice.toFixed(2)}</span>
                    </div>
                  ) : (
                    <span className="font-mono text-3xl font-bold text-[var(--color-4h-green)]">₱{selectedProduct.price.toFixed(2)}</span>
                  )}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Star size={18} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-lg">{(selectedProduct.rating && selectedProduct.rating > 0) ? selectedProduct.rating.toFixed(1) : "0"}</span>
                    <span className="text-slate-500 font-medium">({selectedProduct.reviews?.length || 0} reviews)</span>
                  </div>
                </div>

                {(() => {
                  const hasVariants = selectedProduct.variants && selectedProduct.variants.length > 0;
                  const availableColors = hasVariants ? Array.from(new Set(selectedProduct.variants!.map(v => v.color).filter(Boolean))) as string[] : [];
                  const availableSizes = hasVariants ? selectedProduct.variants!.filter(v => v.color === selectedColor).map(v => v.size).filter(Boolean) as string[] : [];
                  const currentVariant = hasVariants ? selectedProduct.variants!.find(v => v.color === selectedColor && v.size === selectedSize) : null;
                  const displayStock = currentVariant ? currentVariant.stock : (selectedProduct.stockQuantity || 0);
                  const isOutOfStock = selectedProduct.stockStatus === 'Out of Stock' || displayStock <= 0;

                  return (
                    <>
                      {availableColors.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-bold uppercase tracking-wider text-xs text-slate-500 mb-3">Select Color</h4>
                          <div className="flex flex-wrap gap-2">
                            {availableColors.map((color) => (
                              <button
                                key={color}
                                onClick={() => {
                                  setSelectedColor(color);
                                  if (hasVariants) {
                                    const sizesForColor = selectedProduct.variants!.filter(v => v.color === color).map(v => v.size);
                                    if (sizesForColor.length > 0 && !sizesForColor.includes(selectedSize)) {
                                      setSelectedSize(sizesForColor[0]);
                                    }
                                  }
                                }}
                                className={cn(
                                  "px-5 py-2.5 rounded-xl font-bold text-sm min-w-[3rem] transition-all",
                                  selectedColor === color
                                    ? "bg-[var(--color-ink)] dark:bg-white text-white dark:text-black border-2 border-[var(--color-ink)] dark:border-white shadow-md shadow-black/10 dark:shadow-white/10"
                                    : "border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500"
                                )}
                              >
                                {color}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {availableSizes.length > 0 && (
                        <div className="mb-8">
                          <h4 className="font-bold uppercase tracking-wider text-xs text-slate-500 mb-3">Select Size</h4>
                          <div className="flex flex-wrap gap-2">
                            {availableSizes.map((size) => (
                              <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={cn(
                                  "px-5 py-2.5 rounded-xl font-bold text-sm min-w-[3rem] transition-all",
                                  selectedSize === size
                                    ? "bg-[var(--color-ink)] dark:bg-white text-white dark:text-black border-2 border-[var(--color-ink)] dark:border-white shadow-md shadow-black/10 dark:shadow-white/10"
                                    : "border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500"
                                )}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {displayStock !== undefined && displayStock >= 0 && (
                        <div className="mb-6 p-4 rounded-xl bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] font-semibold text-sm">
                          {displayStock} items available in stock
                        </div>
                      )}

                      <div className="flex gap-4">
                        <button 
                          onClick={() => {
                            addToCart(selectedProduct, selectedSize, selectedColor);
                          }}
                          disabled={isOutOfStock}
                          className={cn(
                            "flex-1 py-4 rounded-2xl font-bold text-lg transition-all outline-none focus:ring-4 focus:ring-[var(--color-4h-green)]/30",
                            isOutOfStock
                              ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed" 
                              : "bg-[var(--color-4h-green)] text-white hover:bg-green-700 hover:shadow-lg hover:shadow-green-900/20 hover:-translate-y-0.5"
                          )}
                        >
                          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        <button 
                          onClick={(e) => toggleWishlist(e, selectedProduct.id)}
                          className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-red-500 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                        >
                          <Heart size={24} className={wishlist.includes(selectedProduct.id) ? "fill-red-500 text-red-500" : ""} />
                        </button>
                      </div>
                    </>
                  );
                })()}

                <hr className="my-8 border-t border-slate-200 dark:border-slate-800" />

                {/* Product Information Sections */}
                <div className="mt-8 space-y-6">
                  {((selectedProduct.aboutProduct || selectedProduct.description) || selectedProduct.details) && (
                    <details className="group border-b border-slate-200 dark:border-slate-800 pb-4" open>
                      <summary className="flex justify-between items-center font-bold text-lg cursor-pointer list-none">
                        About the Product
                        <span className="transition group-open:rotate-180">
                          <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                        </span>
                      </summary>
                      <div className="text-slate-600 dark:text-slate-400 mt-4 text-sm leading-relaxed">
                        <div className="markdown-body prose prose-sm prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
                          <Markdown remarkPlugins={[remarkBreaks]}>{selectedProduct.aboutProduct || selectedProduct.description || ""}</Markdown>
                        </div>
                        {selectedProduct.details && (
                          <div className="markdown-body prose prose-sm prose-slate dark:prose-invert max-w-none mt-4 text-slate-500">
                            <Markdown remarkPlugins={[remarkBreaks]}>{selectedProduct.details}</Markdown>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                  {(selectedProduct.hasMaterialAndCare || selectedProduct.productInformation) && (
                    <details className="group border-b border-slate-200 dark:border-slate-800 pb-4">
                      <summary className="flex justify-between items-center font-bold text-lg cursor-pointer list-none">
                        Product Information
                        <span className="transition group-open:rotate-180">
                          <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                        </span>
                      </summary>
                      <div className="mt-6 text-sm leading-relaxed">
                        
                        {selectedProduct.hasMaterialAndCare && (
                          <div className="mb-8">
                            <h4 className="font-bold text-[16px] text-slate-900 dark:text-white mb-6">Material & Care</h4>
                            <div className="space-y-6">
                              {selectedProduct.material && (
                                <div className="flex gap-4 items-start border-b border-slate-100 dark:border-slate-800/50 pb-6">
                                  <div className="w-6 h-6 shrink-0 mt-0.5 text-slate-700 dark:text-slate-300">
                                    <Scissors size={20} strokeWidth={1.5} />
                                  </div>
                                  <div className="w-1/3 shrink-0 font-bold text-slate-900 dark:text-white">Material</div>
                                  <div className="flex-1 text-slate-600 dark:text-slate-400">{selectedProduct.material}</div>
                                </div>
                              )}
                              {selectedProduct.careLabel && (
                                <div className="flex gap-4 items-start border-b border-slate-100 dark:border-slate-800/50 pb-6">
                                  <div className="w-6 h-6 shrink-0 mt-0.5 text-slate-700 dark:text-slate-300">
                                    <Eye size={20} strokeWidth={1.5} />
                                  </div>
                                  <div className="w-1/3 shrink-0 font-bold text-slate-900 dark:text-white">Care Label</div>
                                  <div className="flex-1 text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{selectedProduct.careLabel}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {selectedProduct.productInformation && (
                          <div>
                            <h4 className="font-bold text-[16px] text-slate-900 dark:text-white mb-4">Details</h4>
                            <div className="markdown-body prose prose-sm prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                              <Markdown components={{
                                p: ({node, ...props}) => <p className="mb-2" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold text-slate-900 dark:text-white mr-1" {...props} />,
                              }} remarkPlugins={[remarkBreaks]}>{selectedProduct.productInformation}</Markdown>
                            </div>
                          </div>
                        )}
                        
                      </div>
                    </details>
                  )}
                </div>

                {/* Ratings section */}
                <div className="mt-8 pt-4">
                  <h4 className="font-bold text-xl mb-4">Buyer Rating</h4>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="text-5xl font-display font-bold">{(selectedProduct.rating && selectedProduct.rating > 0) ? selectedProduct.rating.toFixed(1) : "0"}</div>
                    <div>
                      <div className="flex text-yellow-400 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={16} className={cn("fill-current", (!selectedProduct.rating || selectedProduct.rating < star) && "opacity-30")} />
                        ))}
                      </div>
                      <div className="text-slate-500 text-sm">Based on {selectedProduct.reviews?.length || 0} reviews</div>
                    </div>
                  </div>

                  {/* Customer Reviews Section */}
                  <div className="space-y-4 mb-8">
                    {(selectedProduct.reviews && selectedProduct.reviews.length > 0) ? (
                      selectedProduct.reviews.map((rev, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-[#151515] p-5 rounded-2xl">
                          <div className="flex justify-between items-center mb-2">
                             <div className="font-bold text-sm">{rev.user}</div>
                             <div className="flex items-center text-yellow-400">
                               {[1, 2, 3, 4, 5].map((star) => (
                                 <Star key={star} size={12} className={cn("fill-current", (rev.rating && rev.rating < star) && "opacity-30")} />
                               ))}
                             </div>
                          </div>
                          {rev.comment && (
                            <p className="text-slate-600 dark:text-slate-400 italic text-sm">"{rev.comment}"</p>
                          )}
                          {rev.createdAt && (
                            <div className="text-xs text-slate-400 mt-2">{new Date(rev.createdAt).toLocaleDateString()}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 italic">No reviews yet. Be the first to review!</p>
                    )}
                  </div>

                  {/* Add Review Form */}
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-lg mb-4">Write a Review</h4>
                    {!user ? (
                      <p className="text-sm text-slate-500">Please <button onClick={handleLogin} className="text-[var(--color-4h-green)] font-semibold hover:underline cursor-pointer">log in</button> or create an account to write a review.</p>
                    ) : !isVerifiedBuyer ? (
                      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-xl text-amber-800 dark:text-amber-500 text-sm">
                        <p className="font-bold mb-1">Verified Buyers Only</p>
                        <p>To prevent fake reviews, only users who have purchased and received this product can leave a review. If you recently ordered, please wait until your order is marked as delivered.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1 text-yellow-400 mb-2 cursor-pointer">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} type="button" onClick={() => setNewRating(star)} className="focus:outline-none transition-transform hover:scale-110">
                              <Star size={24} className={cn("fill-current", newRating < star && "opacity-30")} />
                            </button>
                          ))}
                        </div>
                        <textarea 
                          value={newReview}
                          onChange={(e) => setNewReview(e.target.value)}
                          placeholder="What do you think about this product? (Optional)"
                          className="w-full bg-slate-50 dark:bg-[#151515] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm min-h-[80px] outline-none focus:ring-2 focus:ring-[var(--color-4h-green)]/30 resize-none"
                        />
                        <div className="flex justify-between items-center mt-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-600 dark:text-slate-400">
                            <input 
                              type="checkbox" 
                              checked={hideIdentity} 
                              onChange={(e) => setHideIdentity(e.target.checked)} 
                              className="w-4 h-4 rounded text-[var(--color-4h-green)] focus:ring-[var(--color-4h-green)]"
                            />
                            Hide my identity
                          </label>
                          <button 
                            onClick={handleSubmitReview}
                            className="bg-[var(--color-4h-green)] text-white px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition"
                          >
                            Submit Review
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
