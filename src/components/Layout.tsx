import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X, Moon, Sun, Facebook, Instagram, Twitter, Phone, Mail, MapPin, MessageSquare, ChevronDown } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { cn } from "../lib/utils";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [socials, setSocials] = useState<{facebookUrl?: string, instagramUrl?: string, twitterUrl?: string, tiktokUrl?: string}>({});
  const [contact, setContact] = useState<{email?: string, phone?: string, address?: string}>({});

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "site"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSocials({
          facebookUrl: data.facebookUrl,
          instagramUrl: data.instagramUrl,
          twitterUrl: data.twitterUrl,
          tiktokUrl: data.tiktokUrl
        });
        setContact({
          email: data.contactEmail,
          phone: data.contactPhone,
          address: data.contactAddress
        });
      }
    });
    return () => unsub();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: "About", path: "/about" },
    { name: "Pillars", path: "/pillars" },
    { 
      name: "Transparency", 
      subLinks: [
        { name: "Financial Transparency", path: "/transparency" },
        { name: "Governing Documents", path: "/documents" }
      ]
    },
    { name: "News", path: "/news" },
    { name: "Partners", path: "/partners" },
    { name: "Shop", path: "/shop" },
  ];

  return (
    <div className="min-h-screen flex flex-col selection:bg-[var(--color-4h-green)] selection:text-white relative overflow-x-clip">
      {/* Global Animated Background */}
      <div className="fixed inset-0 -z-50 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-[var(--color-4h-green)] opacity-[0.15] blur-[100px]"></div>
        <div className="absolute left-1/3 bottom-0 -z-10 m-auto h-[400px] w-[400px] rounded-full bg-yellow-400 opacity-[0.1] blur-[120px]"></div>
      </div>

      {/* Floating Pill Header */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
         <div className="bg-white/80 dark:bg-[#111]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-2xl shadow-black/5 rounded-full px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.jpg" alt="4-H Logo" className="w-8 h-8 rounded-full object-cover border border-transparent shadow-sm group-hover:scale-105 transition-transform" />
            <span className={cn("font-display font-bold text-lg tracking-tight", location.pathname === "/" ? "text-[var(--color-4h-green)]" : "text-slate-900 dark:text-white")}>
              4-H Club
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-8">
            {navLinks.map((link) => (
              link.subLinks ? (
                <div key={link.name} className="relative group">
                  <button className={cn("flex items-center gap-1 text-xs uppercase tracking-[0.1em] font-semibold transition-colors group-hover:text-[var(--color-4h-green)]", location.pathname.startsWith('/documents') || location.pathname.startsWith('/transparency') ? "text-[var(--color-4h-green)]" : "text-slate-500 dark:text-slate-400")}>
                    {link.name}
                    <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-48 py-2 bg-white dark:bg-[#151515] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all -translate-y-2 group-hover:translate-y-0">
                     {link.subLinks.map(sub => (
                        <Link key={sub.name} to={sub.path} className={cn("block px-4 py-2 text-sm font-semibold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800", location.pathname === sub.path ? "text-[var(--color-4h-green)]" : "text-slate-600 dark:text-slate-400 hover:text-[var(--color-4h-green)]")}>
                          {sub.name}
                        </Link>
                     ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={link.name}
                  to={link.path as string}
                  className={cn(
                    "text-xs uppercase tracking-[0.1em] font-semibold transition-colors hover:text-[var(--color-4h-green)]",
                    location.pathname === link.path
                      ? "text-[var(--color-4h-green)]"
                      : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  {link.name}
                </Link>
              )
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-500"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              to="/join"
              className="bg-[var(--color-4h-green)] text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Join Us
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 bg-white/95 dark:bg-[#111]/95 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-2xl rounded-3xl py-6 px-6 flex flex-col gap-6">
            {navLinks.map((link) => (
              link.subLinks ? (
                <div key={link.name} className="flex flex-col gap-3">
                   <div className="text-2xl font-display font-medium text-slate-900 dark:text-white">
                     {link.name}
                   </div>
                   <div className="flex flex-col gap-3 pl-4 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                      {link.subLinks.map(sub => (
                        <Link key={sub.name} to={sub.path} onClick={() => setIsMobileMenuOpen(false)} className={cn("text-lg font-medium", location.pathname === sub.path ? "text-[var(--color-4h-green)]" : "text-slate-600 dark:text-slate-400")}>
                          {sub.name}
                        </Link>
                      ))}
                   </div>
                </div>
              ) : (
                <Link
                  key={link.name}
                  to={link.path as string}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "block text-2xl font-display font-medium",
                    location.pathname === link.path
                      ? "text-[var(--color-4h-green)]"
                      : "text-slate-900 dark:text-white"
                  )}
                >
                  {link.name}
                </Link>
              )
            ))}
            <div className="h-px bg-black/5 dark:bg-white/5 w-full my-2"></div>
            <Link
              to="/join"
              onClick={() => setIsMobileMenuOpen(false)}
              className="bg-[var(--color-4h-green)] text-white text-center py-4 rounded-full font-semibold text-lg w-full block"
            >
              Join Us Today
            </Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-[var(--color-4h-green)] to-[#0f3e23] border-t border-transparent text-white overflow-hidden py-8">
        {/* Abstract yellow accent */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-yellow-400/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-yellow-400/10 rounded-full blur-[50px] translate-y-1/3 -translate-x-1/4"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-between border-b border-white/10 pb-8 mb-6">
            {/* Left side big logo block */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6 w-full lg:w-2/3">
              <Link to="/" className="shrink-0 relative group inline-block focus:outline-none">
                <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full group-hover:bg-yellow-400/30 transition-colors"></div>
                <img src="/logo.jpg" alt="4-H Kalilangan Logo" className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover shadow-2xl relative z-10 border-2 md:border-4 border-white/10" />
              </Link>
              <div className="flex flex-col items-center lg:items-start">
                <h2 className="font-display text-xl sm:text-2xl md:text-4xl font-extrabold tracking-tight text-white mb-2 whitespace-nowrap">
                  Head. Heart. Hands. Health.
                </h2>
                <p className="text-white/80 text-sm md:text-base max-w-xl">
                  Empowering the youth of Kalilangan towards an innovative and sustainable future.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-5 justify-center lg:justify-start">
                  {socials.facebookUrl && <a href={socials.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/10 rounded-full hover:bg-yellow-400 hover:text-[#0f3e23] transition-colors" title="Facebook"><Facebook size={20} /></a>}
                  {socials.instagramUrl && <a href={socials.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/10 rounded-full hover:bg-yellow-400 hover:text-[#0f3e23] transition-colors" title="Instagram"><Instagram size={20} /></a>}
                  {socials.twitterUrl && <a href={socials.twitterUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/10 rounded-full hover:bg-yellow-400 hover:text-[#0f3e23] transition-colors" title="X (Twitter)"><Twitter size={20} /></a>}
                  {socials.tiktokUrl && <a href={socials.tiktokUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-4 py-2 bg-white/10 rounded-full hover:bg-yellow-400 hover:text-[#0f3e23] transition-colors text-sm font-bold tracking-wide" title="TikTok">TikTok</a>}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col items-center lg:items-end gap-3 w-full mt-4 lg:mt-0">
               <nav className="flex flex-wrap lg:flex-col justify-center lg:justify-end gap-x-6 gap-y-3">
                 <Link to="/about" className="text-sm font-semibold tracking-wider uppercase hover:text-yellow-400 transition-colors">About</Link>
                 <Link to="/pillars" className="text-sm font-semibold tracking-wider uppercase hover:text-yellow-400 transition-colors">Pillars</Link>
                 <Link to="/documents" className="text-sm font-semibold tracking-wider uppercase hover:text-yellow-400 transition-colors">Documents</Link>
                 <Link to="/shop" className="text-sm font-semibold tracking-wider uppercase hover:text-yellow-400 transition-colors">Shop</Link>
                 <Link to="/contact-faq" className="text-sm font-semibold tracking-wider uppercase hover:text-yellow-400 transition-colors">Contact & FAQ</Link>
                 <Link to="/join" className="text-sm font-semibold tracking-wider uppercase hover:text-yellow-400 transition-colors">Join Us</Link>
                 <Link to="/login" className="text-sm font-semibold tracking-wider uppercase hover:text-yellow-400 transition-colors">Staff Login</Link>
               </nav>
            </div>
          </div>
          
          <div className="text-xs text-white/50 text-center">
            &copy; {new Date().getFullYear()} 4-H Club Federation of Kalilangan. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
