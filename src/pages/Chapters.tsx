import { MapPin, School, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Chapters() {
  const [barangayChapters, setBarangayChapters] = useState<any[]>([]);
  const [schoolChapters, setSchoolChapters] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const unsubCouncil = onSnapshot(collection(db, "council"), snap => {
      const b: any[] = [];
      const s: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        const item = { id: d.id, ...data };
        if (data.type === "Barangay Based") b.push(item);
        if (data.type === "School Based") s.push(item);
      });
      setBarangayChapters(b);
      setSchoolChapters(s);
    });

    const unsubMembers = onSnapshot(collection(db, "members"), snap => {
      const mArr: any[] = [];
      snap.forEach(d => mArr.push(d.data()));
      setMembers(mArr);
    });

    return () => {
      unsubCouncil();
      unsubMembers();
    };
  }, []);

  const getMemberCount = (type: string, chapterName: string) => {
    return members.filter(m => {
      // If member belongs to both, only count towards their primary chapter type
      if (m.chapterType === "Both" && m.primaryChapterType !== type) {
        return false;
      }
      return (type === "Barangay Based" && m.barangayChapter === chapterName) || 
             (type === "School Based" && m.schoolChapter === chapterName);
    }).length;
  };

  return (
    <div className="container mx-auto px-4 md:px-6 pt-40 pb-24">
      <div className="max-w-3xl mb-16">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--color-ink)] dark:text-white mb-6">
          Barangay & School-Based Chapters
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400">
          The 4-H Kalilangan Federation is made up of diverse and active chapters spread across our barangays and academic institutions.
        </p>
      </div>

      <div className="space-y-16">
        {/* Barangay Chapters */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] rounded-xl">
              <MapPin size={24} />
            </div>
            <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Barangay Chapters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barangayChapters.length > 0 ? barangayChapters.map((chapter, i) => (
              <motion.div
                key={`brgy-${chapter.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:border-[var(--color-4h-green)] hover:shadow-md transition-all"
              >
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-4">{chapter.role}</h3>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="font-medium">President</span>
                    <span>{chapter.name || "Vacant"}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="font-medium flex items-center gap-1"><Users size={14} /> Members</span>
                    <span className="font-mono text-[var(--color-4h-green)] font-semibold">{getMemberCount("Barangay Based", chapter.role)}</span>
                  </div>
                </div>
              </motion.div>
            )) : (
              <p className="text-slate-500 italic col-span-full">No barangay chapters created yet.</p>
            )}
          </div>
        </section>

        {/* School Chapters */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <School size={24} />
            </div>
            <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">School-Based Chapters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schoolChapters.length > 0 ? schoolChapters.map((chapter, i) => (
              <motion.div
                key={`school-${chapter.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all"
              >
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-4 line-clamp-2 min-h-[3.5rem]">{chapter.role}</h3>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="font-medium">Coordinator / President</span>
                    <span>{chapter.name || "Vacant"}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="font-medium flex items-center gap-1"><Users size={14} /> Members</span>
                    <span className="font-mono text-blue-500 font-semibold">{getMemberCount("School Based", chapter.role)}</span>
                  </div>
                </div>
              </motion.div>
            )) : (
              <p className="text-slate-500 italic col-span-full">No school chapters created yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
