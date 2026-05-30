import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import * as lucideIcons from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, onSnapshot, doc } from "firebase/firestore";

type PillarItemType = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
  profilePicture?: string;
  order?: number;
};

export default function Pillars() {
  const [pillars, setPillars] = useState<PillarItemType[]>([
    { id: "agriculture", title: "Agriculture", description: "Promoting modern farming techniques, food security, and sustainable agricultural practices.", icon: "Tractor", image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1000&auto=format&fit=crop", order: 0 },
    { id: "stem", title: "Science, Technology, Engineering, and Mathematics (STEM)", description: "Fostering innovation and critical thinking through technology and scientific exploration.", icon: "Microscope", image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop", order: 1 },
    { id: "education", title: "Education", description: "Empowering communities through continuous learning and capability building.", icon: "GraduationCap", image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop", order: 2 },
    { id: "environmental", title: "Environmental", description: "Advocating for conservation, climate action, and sustainable ecosystems.", icon: "TreePine", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop", order: 3 },
    { id: "health-recreation", title: "Health, Nutrition, Sports & Recreation", description: "Promoting health, nutrition, sports, and recreational activities for holistic well-being.", icon: "Activity", image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1000&auto=format&fit=crop", order: 4 },
    { id: "community-service", title: "Community Service", description: "Engaging in volunteerism, social responsibility, and community outreach.", icon: "HeartHandshake", image: "https://images.unsplash.com/photo-1593113511867-b50aba8f7142?q=80&w=1000&auto=format&fit=crop", order: 5 },
    { id: "arts-culture", title: "Arts and Culture", description: "Preserving heritage and celebrating creativity through various art forms.", icon: "Palette", image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=1000&auto=format&fit=crop", order: 6 }
  ]);

  const [description, setDescription] = useState("The 4-H Federation focuses on comprehensive impact. Our pillars represent the core areas where we actively build programs, train leaders, and allocate resources to strengthen our municipalities.");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pillars"), snap => {
      const arr: PillarItemType[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as PillarItemType));
      if (arr.length > 0) {
        arr.sort((a, b) => (a.order || 0) - (b.order || 0));
        setPillars(arr);
        setTimeout(() => {
          if (window.location.hash) {
            const el = document.getElementById(window.location.hash.slice(1));
            if (el) {
              el.scrollIntoView({ behavior: "smooth" });
            }
          }
        }, 100);
      }
    }, err => handleFirestoreError(err, OperationType.GET, "pillars"));

    const unsubSettings = onSnapshot(doc(db, "settings", "site"), snap => {
      if (snap.exists() && snap.data().pillarsDescription) {
        setDescription(snap.data().pillarsDescription);
      }
    }, err => handleFirestoreError(err, OperationType.GET, "settings/site"));

    return () => { unsub(); unsubSettings(); };
  }, []);

  return (
    <div className="container mx-auto px-4 md:px-6 pt-40 pb-12">
      <div className="max-w-3xl mb-16">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
          Our Strategic Pillars
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {pillars.map((pillar, index) => {
          const Icon = pillar.icon && (lucideIcons as any)[pillar.icon] ? (lucideIcons as any)[pillar.icon] : lucideIcons.Circle;

          return (
            <motion.div
              key={pillar.id}
              id={pillar.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              className="bg-white dark:bg-[#151515] rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col group shadow-sm hover:shadow-xl hover:shadow-[var(--color-4h-green)]/10 transition-all duration-500 scroll-mt-24"
            >
              <div className="relative aspect-video bg-slate-100 dark:bg-slate-900 overflow-hidden">
                <img 
                  src={pillar.image || "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1000&auto=format&fit=crop"} 
                  alt={pillar.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10" />
                <div className="absolute bottom-4 right-4 z-20">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg group-hover:-translate-y-1 transition-transform">
                     {pillar.profilePicture ? (
                        <img src={pillar.profilePicture} alt={pillar.title} className="w-10 h-10 object-cover rounded-xl" />
                     ) : (
                        <Icon size={24} className="text-white" />
                     )}
                  </div>
                </div>
              </div>

              <div className="p-8 flex flex-col flex-1">
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2">
                  {pillar.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-1 line-clamp-3">
                  {pillar.description}
                </p>
                
                <Link to={`/pillars/${pillar.id}`} className="mt-auto inline-flex items-center justify-center w-full py-4 rounded-xl bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] font-semibold hover:bg-[var(--color-4h-green)] hover:text-white transition-colors duration-300">
                  Explore Pillar
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
