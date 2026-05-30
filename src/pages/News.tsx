import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Calendar, Search, X, Share2 } from "lucide-react";
import { cn } from "../lib/utils";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { useSearchParams } from "react-router-dom";

type NewsItemType = {
  id?: string;
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  category: string;
  image?: string;
  media?: { url: string; type: 'image' | 'video'; name: string }[];
};

export default function News() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [selectedArticle, setSelectedArticle] = useState<NewsItemType | null>(null);
  const [newsArticles, setNewsArticles] = useState<NewsItemType[]>([]);
  const [description, setDescription] = useState("Stay updated on our municipal activities, events, and community initiatives shaping the future.");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "news"), snap => {
      const arr: NewsItemType[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as NewsItemType));
      if (arr.length > 0) {
        setNewsArticles(arr);
        
        // Check URL for shared article
        const articleId = searchParams.get("article");
        if (articleId) {
           const found = arr.find(a => a.id === articleId);
           if (found) {
              setSelectedArticle(found);
           }
        }
      }
    }, err => handleFirestoreError(err, OperationType.GET, "news"));

    const unsubSettings = onSnapshot(doc(db, "settings", "site"), snap => {
      if (snap.exists() && snap.data().newsDescription) {
        setDescription(snap.data().newsDescription);
      }
    });

    return () => { unsub(); unsubSettings(); };
  }, []);

  const handleOpenArticle = (article: NewsItemType) => {
    setSelectedArticle(article);
    setSearchParams({ article: article.id || "" }, { replace: true });
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
    setSearchParams({}, { replace: true });
  };

  const handleShare = async (e: React.MouseEvent, article: NewsItemType) => {
    e.stopPropagation();
    const url = new URL(window.location.href);
    url.searchParams.set("article", article.id || "");
    const shareUrl = url.toString();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: shareUrl
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  const categories = ["All", ...Array.from(new Set(newsArticles.map(article => article.category)))];

  const filteredArticles = useMemo(() => {
    let articles = newsArticles;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      articles = articles.filter(article => 
        article.title.toLowerCase().includes(q) || 
        article.excerpt.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "All") {
      articles = articles.filter(article => article.category === selectedCategory);
    }

    articles = [...articles].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (sortBy === "Oldest") return dateA - dateB;
      return dateB - dateA; // Newest Default
    });

    return articles;
  }, [searchQuery, selectedCategory, sortBy, newsArticles]);

  return (
    <div className="container mx-auto px-4 md:px-6 pt-40 pb-24">
      <div className="max-w-3xl mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--color-ink)] dark:text-white mb-6">
          Latest News & Press
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
              placeholder="Search news..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-100 dark:bg-[#111] border-none rounded-2xl outline-none focus:ring-2 focus:ring-[var(--color-4h-green)]/50 transition-all text-slate-900 dark:text-white font-medium"
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
                    ? "bg-[var(--color-4h-green)] text-white shadow-md shadow-green-900/10"
                    : "bg-white dark:bg-[#151515] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-[var(--color-4h-green)] hover:text-[var(--color-4h-green)]"
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
            className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl font-semibold outline-none focus:ring-2 focus:ring-[var(--color-4h-green)]/50 cursor-pointer appearance-none pr-10 relative text-sm"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
          >
            <option>Newest</option>
            <option>Oldest</option>
          </select>
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="py-20 text-center text-slate-500 font-medium text-lg">No news found matching your criteria.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredArticles.map((article, i) => (
              <motion.div 
                layout
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="group flex flex-col bg-white dark:bg-[#111] border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden hover:border-[var(--color-4h-green)] dark:hover:border-[var(--color-4h-green)] transition-colors shadow-sm"
              >
                {/* Image */}
                <div className="relative h-60 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {(article.image || article.media?.[0]?.url) ? (
                    article.media?.[0]?.type === 'video' && !article.image ? (
                      <video 
                        src={article.media[0].url} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        muted playsInline
                      />
                    ) : (
                      <img 
                        src={article.image || article.media?.[0]?.url} 
                        alt={article.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )
                  ) : (
                    <span className="text-slate-400">No media</span>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 dark:bg-black/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-[var(--color-ink)] dark:text-white">
                      {article.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                    <Calendar size={16} />
                    <time dateTime={article.date}>{new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
                  </div>
                  
                  <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[var(--color-4h-green)] transition-colors">
                    {article.title}
                  </h2>
                  
                  <p className="text-slate-600 dark:text-slate-400 line-clamp-3 mb-6 flex-1">
                    {article.excerpt}
                  </p>
                  
                  <div className="flex justify-between items-center mt-auto border-b border-black/20 dark:border-white/20 pb-1 group-hover:border-[var(--color-4h-green)]">
                    <button 
                      onClick={() => handleOpenArticle(article)}
                      className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink)] dark:text-white hover:text-[var(--color-4h-green)] dark:hover:text-[var(--color-4h-green)] transition-colors"
                    >
                      Read Full Article <ArrowRight size={16} />
                    </button>
                    <button onClick={(e) => handleShare(e, article)} className="p-2 text-slate-400 hover:text-[var(--color-4h-green)] transition-colors" title="Share Article">
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Article Detail Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm" onClick={handleCloseArticle}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#111] w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative"
            >
              <div className="flex gap-2 absolute top-4 right-4 z-10">
                <button 
                  onClick={(e) => handleShare(e, selectedArticle)}
                  className="bg-black/50 hover:bg-black/80 text-white rounded-full p-2 backdrop-blur-md transition-colors"
                  title="Share Article"
                >
                  <Share2 size={20} />
                </button>
                <button 
                  onClick={handleCloseArticle}
                  className="bg-black/50 hover:bg-black/80 text-white rounded-full p-2 backdrop-blur-md transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="overflow-y-auto no-scrollbar">
                {/* Hero Media */}
                <div className="w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative min-h-[40vh]">
                  {selectedArticle.image || selectedArticle.media?.[0]?.url ? (
                    selectedArticle.media?.[0]?.type === 'video' && !selectedArticle.image ? (
                      <video src={selectedArticle.media[0].url} className="w-full max-h-[50vh] object-contain" controls autoPlay playsInline />
                    ) : (
                      <img src={selectedArticle.image || selectedArticle.media?.[0]?.url} alt={selectedArticle.title} className="w-full max-h-[50vh] object-cover" />
                    )
                  ) : null}
                </div>
                
                <div className="p-6 md:p-10">
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                    <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-[var(--color-ink)] dark:text-white">
                      {selectedArticle.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      <time dateTime={selectedArticle.date}>{new Date(selectedArticle.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
                    </span>
                  </div>
                  
                  <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                    {selectedArticle.title}
                  </h2>
                  
                  <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 font-serif leading-relaxed text-lg whitespace-pre-wrap mb-10">
                    {selectedArticle.content || selectedArticle.excerpt}
                  </div>

                  {/* Other Media Gallery */}
                  {selectedArticle.media && selectedArticle.media.length > 1 && (
                    <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-8">
                      <h3 className="font-display text-2xl font-bold mb-6">Media Gallery</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {(selectedArticle.image ? selectedArticle.media : selectedArticle.media.slice(1)).map((m, idx) => (
                          <div key={idx} className="bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {m.type === 'video' ? (
                              <video src={m.url} className="w-full h-48 object-cover" controls playsInline />
                            ) : (
                              <a href={m.url} target="_blank" rel="noopener noreferrer">
                                <img src={m.url} alt={`Media ${idx + 1}`} className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
