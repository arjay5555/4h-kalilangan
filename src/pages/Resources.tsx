import { Link } from "react-router-dom";
import { BookOpen, FileText } from "lucide-react";

export default function Resources() {
  return (
    <div className="container mx-auto px-4 pt-40 pb-12">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="font-display text-4xl font-bold mb-4 text-[var(--color-ink)] dark:text-white">Resources & Documents</h1>
        <p className="text-slate-600 dark:text-slate-400">Access official Federation materials, membership forms, and governing documents.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Link to="/cbl" className="group p-8 rounded-3xl bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 hover:border-[var(--color-4h-green)] transition-all shadow-sm">
           <div className="bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] w-12 h-12 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
             <BookOpen size={24} />
           </div>
           <h3 className="font-display text-2xl font-bold mb-2 group-hover:text-[var(--color-4h-green)] transition-colors">Constitution & By-Laws</h3>
           <p className="text-slate-500 text-sm">Read the unified governing rules and framework of the 4-H Kalilangan Federation.</p>
        </Link>
        
        <div className="group p-8 rounded-3xl bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 opacity-70 cursor-not-allowed shadow-sm">
           <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 w-12 h-12 rounded-full flex items-center justify-center mb-6">
             <FileText size={24} />
           </div>
           <h3 className="font-display text-2xl font-bold mb-2">Membership Forms</h3>
           <p className="text-slate-500 text-sm">Downloadable forms for your local Barangay chapters. (Coming soon)</p>
        </div>
      </div>
    </div>
  );
}
