import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, MapPin } from "lucide-react";
import { cn } from "../lib/utils";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

const TABS = ["All", "Upcoming", "Ongoing", "Done"];

export default function Projects() {
  const [activeTab, setActiveTab] = useState("All");
  const [projectsAndPrograms, setProjectsAndPrograms] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "activities"), snap => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setProjectsAndPrograms(arr);
    }, err => handleFirestoreError(err, OperationType.GET, "activities"));

    return () => unsub();
  }, []);

  const filteredProjects = projectsAndPrograms.filter(
    (p) => activeTab === "All" || p.status === activeTab
  );

  return (
    <div className="container mx-auto px-4 md:px-6 pt-40 pb-24">
      <div className="max-w-3xl mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--color-ink)] dark:text-white mb-6">
          Projects & Programs
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400">
          Discover our upcoming, ongoing, and completed initiatives across all chapters. 
          Get involved and make a difference.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-4 mb-8 no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all",
              activeTab === tab
                ? "bg-[var(--color-4h-green)] text-white shadow-md shadow-green-900/10"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project, i) => (
            <motion.div
              layout
              key={project.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm hover:shadow-xl hover:border-[var(--color-4h-green)]/30 group flex flex-col transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="text-xs font-bold uppercase tracking-widest bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] px-3 py-1 rounded-full">
                  {project.category}
                </span>
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider px-2 py-1 border rounded-md",
                  project.status === "Upcoming" ? "text-purple-600 border-purple-200 bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800" :
                  project.status === "Ongoing" ? "text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800" :
                  "text-slate-500 border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                )}>
                  {project.status}
                </span>
              </div>

              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[var(--color-4h-green)] transition-colors">
                {project.title}
              </h2>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6 flex-1">
                {project.description}
              </p>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  {project.date}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-[var(--color-tech-blue)]" />
                  {project.location}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          No projects found for this category.
        </div>
      )}
    </div>
  );
}
