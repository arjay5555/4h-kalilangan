import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, FileText, Download, ShieldCheck, ExternalLink, X, FileBarChart, Scale } from "lucide-react";
import { cn } from "../lib/utils";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore";

type DocumentItem = { id: string; title: string; description: string; type: string; category: string; link: string; };

export default function Transparency() {
  const [searchTerm, setSearchTerm] = useState("");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [viewingDocument, setViewingDocument] = useState<DocumentItem | null>(null);
  const [description, setDescription] = useState("We believe in absolute integrity. Access our official documents, reports, and records here. We keep our processes open to remain accountable to our members and partners.");

  useEffect(() => {
    // Fetch financial documents
    const unsubFin = onSnapshot(collection(db, "financial_documents_col"), snap => {
      const arr: DocumentItem[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as DocumentItem));
      arr.sort((a,b) => a.title.localeCompare(b.title));
      setDocuments(arr);
    }, err => handleFirestoreError(err, OperationType.GET, "financial_documents_col"));

    const unsubSettings = onSnapshot(doc(db, "settings", "site"), snap => {
      if (snap.exists() && snap.data().transparencyDescription) {
        setDescription(snap.data().transparencyDescription);
      }
    }, err => handleFirestoreError(err, OperationType.GET, "settings/site"));

    return () => { unsubFin(); unsubSettings(); };
  }, []);

  const categories = ["All", ...Array.from(new Set(documents.map(doc => doc.category)))];
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("A-Z");

  const filteredDocs = documents.filter((item) => {
    let matches = true;
    if (searchTerm) {
      matches = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase());
    }
    if (selectedCategory !== "All") {
      matches = matches && item.category === selectedCategory;
    }
    return matches;
  }).sort((a, b) => {
    if (sortBy === "A-Z") return a.title.localeCompare(b.title);
    if (sortBy === "Z-A") return b.title.localeCompare(a.title);
    return 0;
  });

  return (
    <div className="container mx-auto px-4 md:px-6 pt-40 pb-24 min-h-screen">
      {/* Header */}
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-tech-blue)]/10 text-[var(--color-tech-blue-dark)] dark:text-[var(--color-tech-blue-light)] text-sm font-semibold mb-4">
          <ShieldCheck size={16} /> Open Data Initiative
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 text-[var(--color-ink)] dark:text-white">
          Financial Transparency
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-10 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search documents..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-100 dark:bg-[#111] border-none rounded-2xl outline-none focus:ring-2 focus:ring-[var(--color-tech-blue)]/50 transition-all text-slate-900 dark:text-white font-medium"
            />
          </div>
          <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all",
                  selectedCategory === cat
                    ? "bg-[var(--color-tech-blue)] text-white shadow-md shadow-blue-900/10"
                    : "bg-white dark:bg-[#151515] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-[var(--color-tech-blue)] hover:text-[var(--color-tech-blue)]"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Sort:</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl font-semibold outline-none focus:ring-2 focus:ring-[var(--color-tech-blue)]/50 cursor-pointer appearance-none pr-10 relative text-sm"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
          >
            <option>A-Z</option>
            <option>Z-A</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <AnimatePresence mode="popLayout">
            {filteredDocs.map((docItem, idx) => (
              <motion.div
                layout
                onClick={() => setViewingDocument(docItem)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                key={docItem.id || idx}
                className="group block bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-[var(--color-tech-blue)] transition-all cursor-pointer relative flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-tech-blue)]/10 flex items-center justify-center text-[var(--color-tech-blue)]">
                    {docItem.type === "Download" ? <Download size={24} /> : <FileText size={24} />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md text-xs font-semibold">
                      {docItem.category}
                    </span>
                    {docItem.link && (
                      <a href={docItem.link} target="_blank" rel="noreferrer" download onClick={(e) => e.stopPropagation()} className="p-1.5 text-slate-400 hover:text-[var(--color-tech-blue)] hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors" title="Download directly">
                        <Download size={18} />
                      </a>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-[var(--color-tech-blue)] transition-colors pr-8">
                  {docItem.title}
                </h3>

                <p className="text-sm text-slate-500 mb-6 line-clamp-2">
                  {docItem.description}
                </p>

                <div className="flex items-center text-sm font-semibold text-[var(--color-tech-blue)] mt-auto">
                  {docItem.type === "Download" ? "Download File" : "View Details"}
                  <ExternalLink size={16} className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      {filteredDocs.length === 0 && (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
          <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No documents found</h3>
          <p className="text-slate-500">We couldn't find any documents matching your search.</p>
        </div>
      )}

      {/* Document View Modal */}
      <AnimatePresence>
        {viewingDocument && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[75vh] h-[75vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex-none bg-white/80 dark:bg-[#111]/80 backdrop-blur-md p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center z-10">
                <div className="flex-1 min-w-0 mr-4">
                  <h3 className="font-bold text-lg sm:text-xl truncate text-slate-900 dark:text-white">{viewingDocument.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{viewingDocument.category} • {viewingDocument.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  {viewingDocument.link && (
                    <a href={viewingDocument.link} target="_blank" rel="noreferrer" download className="flex items-center gap-2 bg-[var(--color-tech-blue)] hover:bg-blue-700 text-white px-3 py-2 sm:px-4 rounded-xl font-bold transition-colors">
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
