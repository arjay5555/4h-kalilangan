import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, onSnapshot, doc } from "firebase/firestore";
import * as lucideIcons from "lucide-react";
import { CloverAnimation } from "../components/CloverAnimation";
import { cn, formatTimeAMPM, formatTimeRange, calculateDiffDays } from "../lib/utils";

const CAROUSEL_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1000&auto=format&fit=crop",
    title: "Agriculture & STEM"
  },
  {
    url: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop",
    title: "Youth Community Projects"
  },
  {
    url: "https://images.unsplash.com/photo-1530836369250-ef71a3f5e4bf?q=80&w=1000&auto=format&fit=crop",
    title: "Environmental Advocacy"
  }
];

// Impact Counter Component
const formatStatNumber = (num: number) => {
  if (num <= 10) return num.toString();
  const base = Math.floor((num - 1) / 10) * 10;
  return `${base}+`;
};

const FloatingStat = ({ number, label, delay = 0, to }: { number: string; label: string; delay?: number; to?: string }) => {
  const content = (
    <div className="flex flex-col pt-6 relative group">
      <div className="absolute top-0 left-0 w-8 h-1 bg-[var(--color-4h-green)] rounded-full group-hover:w-full transition-all duration-500 ease-out"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-black/5 dark:bg-white/5 rounded-full -z-10"></div>
      <div className="font-display text-5xl lg:text-6xl font-black tracking-tighter text-[var(--color-ink)] dark:text-white mb-2 drop-shadow-sm group-hover:text-[var(--color-4h-green)] transition-colors duration-300">{number}</div>
      <div className="text-xs uppercase tracking-[0.2em] text-[#666] dark:text-[#aaa] font-bold">{label}</div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, type: "spring" }}
    >
      {to ? <Link to={to} className="block w-full">{content}</Link> : content}
    </motion.div>
  );
};

export default function Home() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/embed/dQw4w9WgXcQ");
  const [heroTitle, setHeroTitle] = useState("Cultivating<br/>The <span className=\"text-transparent bg-clip-text bg-gradient-to-br from-[var(--color-4h-green)] to-green-400\">4-H</span> Future");
  const [heroSubtitle, setHeroSubtitle] = useState("Empowering the youth through modernized agriculture, STEM, environmental advocacy, and tech-driven leadership to build resilient communities.");
  const [pillars, setPillars] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [council, setCouncil] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [chaptersCount, setChaptersCount] = useState(0);
  const [activeMembersCount, setActiveMembersCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [whyJoinDescription, setWhyJoinDescription] = useState("Discover the incredible benefits and opportunities waiting for you as a registered member of the 4-H Kalilangan Federation.");
  const [whyJoinItems, setWhyJoinItems] = useState<{title: string, description: string}[]>([]);
  const [acceptingNewMembers, setAcceptingNewMembers] = useState(true);

  // Helper to convert standard youtube watch URLs to embed format
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtube.com") && parsed.pathname === "/watch") {
        const v = parsed.searchParams.get("v");
        if (v) return `https://www.youtube.com/embed/${v}`;
      } else if (parsed.hostname === "youtu.be") {
        const v = parsed.pathname.slice(1);
        if (v) return `https://www.youtube.com/embed/${v}`;
      }
    } catch {
      // Ignore invalid URLs
    }
    return url;
  };

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "settings", "site"), snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.videoUrl) setVideoUrl(getEmbedUrl(data.videoUrl));
        if (data.heroTitle) setHeroTitle(data.heroTitle);
        if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle);
        if (data.acceptingNewMembers !== undefined) setAcceptingNewMembers(data.acceptingNewMembers);
        if (data.whyJoinDescription) setWhyJoinDescription(data.whyJoinDescription);
        if (data.whyJoinItems && data.whyJoinItems.length > 0) {
          setWhyJoinItems(data.whyJoinItems);
        } else {
          setWhyJoinItems([
            { title: "Skill Development", description: "Gain hands-on experience in agriculture, STEM, leadership, and entrepreneurship through our comprehensive project tracks." },
            { title: "Community Impact", description: "Make a real difference in your barangay through civic engagement and environmental conservation projects." },
            { title: "Lifelong Network", description: "Connect with mentors, industry professionals, and like-minded youth leaders across the municipality." },
            { title: "Exclusive Resources", description: "Access specialized training, scholarship opportunities, and funding for innovative community projects." }
          ]);
        }
      }
    }, err => handleFirestoreError(err, OperationType.GET, "settings/site"));

    const unsubPillars = onSnapshot(collection(db, "pillars"), snap => {
      const arr: any[] = [];
      const evts: any[] = [];
      const now = new Date();
      now.setHours(0,0,0,0);

      snap.forEach(d => {
        const data = d.data();
        arr.push({ id: d.id, ...data });

        if (data.upcomingEvents && Array.isArray(data.upcomingEvents)) {
          data.upcomingEvents.forEach((ev: any, evIdx: number) => {
            const diffDays = calculateDiffDays(ev.date);
            
              // Only show if event is happening today or in the future (up to 30 days)
            if (diffDays >= 0 && diffDays <= 30) {
              evts.push({
                id: `${d.id}-${evIdx}`,
                pillarId: d.id,
                title: ev.title,
                date: ev.date,
                timeStart: ev.timeStart,
                timeEnd: ev.timeEnd,
                description: ev.description,
                image: ev.image,
                type: data.title,
                location: ev.location,
                diffDays
              });
            }
          });
        }
      });
      arr.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Auto-migrate old pillar name
      const targetPillar = arr.find(p => p.id === "health-recreation" && p.title.includes("Nutrition"));
      if (targetPillar) {
        import("firebase/firestore").then(({ doc, updateDoc }) => {
          updateDoc(doc(db, "pillars", targetPillar.id), { title: "Well-being" }).catch(() => {});
        });
      }

      // Auto-migrate agriculture sample project
      const agPillar = arr.find(p => p.id === "agriculture");
      if (agPillar && agPillar.sampleProjects && agPillar.sampleProjects.length > 0) {
        const hasDetailedProject = agPillar.sampleProjects.some((p: any) => p.objective && p.impact);
        if (!hasDetailedProject) {
           const updatedProjects = [...agPillar.sampleProjects];
           updatedProjects[0] = {
             title: "Community Hydroponics Initiative",
             tagline: "Empowering Local Farmers Through Innovation",
             objective: "To introduce sustainable and modern hydroponic farming techniques to urban communities.",
             about: "This project provides communities with the tools, training, and resources needed to establish vertical hydroponic farms. By integrating IoT sensors and automated nutrient delivery, we optimize crop yield while conserving up to 90% more water compared to traditional soil farming.",
             impact: "Trained 150+ youth in agritech, successfully establishing 12 functional urban hydroponic systems that yield 50kg of fresh produce monthly.",
             status: "Active",
             year: new Date().getFullYear().toString(),
             image: "https://images.unsplash.com/photo-1530836369250-ef71a3f5e9ce?q=80&w=600&auto=format&fit=crop",
             sustainabilityPlan: "The initiative includes an established long-term seed fund and continuous quarterly technical assessment workshops.",
             callToAction: {
                text: "Partner With Us",
                url: "mailto:partner@4hclub.org"
             },
             acknowledgment: "Special thanks to the local Department of Agriculture and City Agronomists."
           };
           import("firebase/firestore").then(({ doc, updateDoc }) => {
             updateDoc(doc(db, "pillars", agPillar.id), { sampleProjects: updatedProjects }).catch(() => {});
           });
        }
      }

      setPillars(arr);
      evts.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(evts);
    }, err => handleFirestoreError(err, OperationType.GET, "pillars"));

    const unsubCouncil = onSnapshot(collection(db, "council"), snap => {
      const arr: any[] = [];
      let chapCount = 0;
      snap.forEach(d => {
        const data = d.data();
        const item = { id: d.id, ...data };
        arr.push(item);
        if (data.type === "Barangay Based" || data.type === "School Based") {
          chapCount++;
        }
      });
      setChaptersCount(chapCount);

      const roleHierarchy: Record<string, number> = {
        "President": 1,
        "Vice-President": 2,
        "Secretary": 3,
        "Treasurer": 4,
        "Auditor": 5,
        "PIRO": 6,
        "Business Manager": 7
      };
      
      arr.sort((a, b) => {
        const rankA = roleHierarchy[a.role] || 99;
        const rankB = roleHierarchy[b.role] || 99;
        
        if (rankA !== rankB) return rankA - rankB;
        return a.name.localeCompare(b.name);
      });

      setCouncil(arr.filter(a => a.type === "Executive Board"));
    }, err => handleFirestoreError(err, OperationType.GET, "council"));

    const unsubMembers = onSnapshot(collection(db, "members"), snap => {
      let active = 0;
      snap.forEach(d => {
        const member = d.data();
        
        let effStatus = "Active";
        if (member.status === "Alumni" || member.category === "Alumni") effStatus = "Alumni";
        else if (member.status === "Inactive") effStatus = "Inactive";
        else if (member.status === "Not Renewed") {
          const refDateStr = member.statusUpdatedAt || member.lastRenewed || member.registrationDate;
          if (refDateStr) {
            const refDate = new Date(refDateStr).getTime();
            const ms6Months = 6 * 30 * 24 * 60 * 60 * 1000;
            const threshold = member.statusUpdatedAt ? ms6Months : (365 * 24 * 60 * 60 * 1000 + ms6Months);
            if (Date.now() - refDate > threshold) {
              effStatus = "Inactive";
            }
          }
        }
        
        if (effStatus === "Active") active++;
      });
      setActiveMembersCount(active);
    }, err => handleFirestoreError(err, OperationType.GET, "members"));

    const unsubActivities = onSnapshot(collection(db, "activities"), snap => {
      setProjectsCount(snap.size);
    }, err => handleFirestoreError(err, OperationType.GET, "activities"));

    const unsubPartners = onSnapshot(collection(db, "partners"), snap => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setPartners(arr);
    }, err => handleFirestoreError(err, OperationType.GET, "partners"));

    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 4000);
    
    return () => {
      clearInterval(timer);
      unsubSettings();
      unsubPillars();
      unsubCouncil();
      unsubPartners();
      unsubMembers();
      unsubActivities();
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* 1. HERO SECTION (Split Layout) */}
      <section className="min-h-screen pt-32 pb-16 px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 max-w-7xl mx-auto w-full">
        {/* Left Content with decorative elements */}
        <div className="flex flex-col justify-center max-w-2xl relative">
          {/* Decorative animated blobs */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-[var(--color-4h-green)]/20 rounded-full blur-3xl animate-pulse mix-blend-multiply dark:mix-blend-screen -z-10"></div>
          <div className="absolute top-40 -right-10 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite] mix-blend-multiply dark:mix-blend-screen -z-10"></div>
          <div className="absolute bottom-0 left-20 w-48 h-48 bg-[var(--color-tech-blue)]/10 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite] mix-blend-multiply dark:mix-blend-screen -z-10"></div>

          {acceptingNewMembers && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur-md border border-[var(--color-4h-green)]/20 text-xs font-bold uppercase tracking-widest mb-8 w-fit shadow-sm"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-4h-green)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--color-4h-green)]"></span>
              </span>
              <span className="text-[var(--color-4h-green)]">Accepting New Members</span>
            </motion.div>
          )}

          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 100 }}
            className="font-display text-[14vw] md:text-7xl lg:text-8xl leading-[0.9] font-black tracking-tighter text-[var(--color-ink)] dark:text-white mb-6 drop-shadow-sm"
            dangerouslySetInnerHTML={{ __html: heroTitle }}
          />

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-lg leading-relaxed font-medium whitespace-pre-wrap"
          >
            {heroSubtitle}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <Link to="/join" className="group relative inline-flex items-center gap-2 bg-[var(--color-4h-green)] text-white px-8 py-4 rounded-full font-bold text-sm tracking-wide overflow-hidden shadow-lg shadow-green-900/20 hover:shadow-xl hover:shadow-green-900/40 hover:-translate-y-0.5 transition-all">
              <span className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
              Join Us <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/about" className="inline-flex items-center gap-2 bg-white dark:bg-[#111] text-[var(--color-ink)] dark:text-white border-2 border-slate-200 dark:border-slate-800 px-8 py-4 rounded-full font-bold text-sm tracking-wide hover:border-[var(--color-4h-green)] hover:text-[var(--color-4h-green)] dark:hover:border-[var(--color-4h-green)] transition-all hover:shadow-md">
              Learn More
            </Link>
          </motion.div>
        </div>

        {/* Right Graphic/Video block */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative rounded-[2rem] lg:rounded-[3rem] overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center isolate group mt-8 lg:mt-0 shadow-2xl aspect-video w-full max-w-2xl lg:ml-auto"
        >
          <iframe 
            className="absolute inset-0 w-full h-full" 
            src={videoUrl} 
            title="4-H Video Player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerPolicy="strict-origin-when-cross-origin" 
            allowFullScreen
          ></iframe>
        </motion.div>
      </section>

      {/* 2. IMPACT COUNTER SECTION */}
      <section className="py-24 px-4 md:px-8 border-y border-[var(--color-4h-green)]/10 dark:border-white/5 bg-gradient-to-b from-white/50 to-white dark:from-black/50 dark:to-black relative overflow-hidden">
        {/* Subtle background graphic */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[200px] bg-[var(--color-4h-green)]/5 blur-3xl rounded-[100%]"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <FloatingStat number={formatStatNumber(chaptersCount)} label="Barangay & School Chapters" delay={0.1} to="/chapters" />
          <FloatingStat number={formatStatNumber(activeMembersCount)} label="Active Members" delay={0.2} />
          <FloatingStat number={formatStatNumber(projectsCount)} label="Projects" delay={0.3} to="/projects" />
        </div>
      </section>

      {/* 2.2 THE 4 H MEANING */}
      <CloverAnimation />

      {/* 2.5 BENEFITS & SHOWCASE SECTION */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
             initial={{ opacity: 0, x: -20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             className="flex flex-col gap-8"
          >
            <div>
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-[var(--color-ink)] dark:text-white mb-4 tracking-tight">
                Why Join <span className="text-[var(--color-4h-green)]">4-H?</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                {whyJoinDescription || "Discover the incredible benefits and opportunities waiting for you as a registered member of the 4-H Kalilangan Federation."}
              </p>
            </div>
            
            <div className="grid gap-4">
              {whyJoinItems.map((benefit, idx) => (
                <div key={idx} className="flex gap-4 p-5 rounded-2xl bg-white dark:bg-[#151515] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] flex items-center justify-center font-bold text-lg shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--color-ink)] dark:text-white text-lg">{benefit.title}</h4>
                    <p className="text-sm text-slate-500 max-w-sm mt-1">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-[2rem] overflow-hidden bg-slate-200 dark:bg-slate-800 min-h-[50vh] flex items-center justify-center isolate group shadow-2xl"
          >
            <AnimatePresence mode="popLayout">
              <motion.img
                key={currentIdx}
                src={CAROUSEL_IMAGES[currentIdx].url}
                alt={CAROUSEL_IMAGES[currentIdx].title}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>

            {/* Gradient Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />

            {/* Graphic Element Text */}
            <div className="absolute bottom-8 left-8 right-8 z-20 flex flex-col gap-2">
               <AnimatePresence mode="wait">
                 <motion.h3 
                   key={currentIdx}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   transition={{ duration: 0.4 }}
                   className="font-display text-2xl lg:text-3xl font-bold text-white shadow-sm"
                 >
                   {CAROUSEL_IMAGES[currentIdx].title}
                 </motion.h3>
               </AnimatePresence>
               <p className="font-display font-medium text-white/70 uppercase tracking-widest text-xs">Achievement Showcase</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. PILLARS GRID (Clean Utility style) */}
      <section className="py-32 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-[var(--color-ink)] dark:text-white max-w-md leading-tight">
              Our Core <br/>
              <span className="text-slate-400">Pillars</span>
            </h2>
            <Link to="/pillars" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest hover:text-[var(--color-4h-green)] transition-colors pb-2 border-b border-black/20 dark:border-white/20">
              View All Pillars <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {pillars.slice(0, 6).map((pillar, i) => {
              const Icon = (lucideIcons as any)[pillar.icon] || lucideIcons.Circle;
              return (
                <Link to={`/pillars#${pillar.id}`} key={pillar.id} className="group flex flex-col items-start">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="w-full bg-white dark:bg-[#151515] p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-[var(--color-4h-green)]/10 hover:border-[var(--color-4h-green)]/30 transition-all duration-500 group-hover:-translate-y-2 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-4h-green)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="mb-6 bg-slate-50 dark:bg-black w-14 h-14 rounded-2xl flex items-center justify-center text-[var(--color-ink)] dark:text-white border border-slate-100 dark:border-slate-800 group-hover:bg-[var(--color-4h-green)] group-hover:text-white group-hover:border-transparent transition-all duration-300 shadow-sm overflow-hidden">
                      {pillar.profilePicture ? (
                        <img src={pillar.profilePicture} alt={pillar.title} className="w-full h-full object-cover" />
                      ) : (
                        <Icon size={24} strokeWidth={2} />
                      )}
                    </div>
                    <h3 className="font-display text-2xl font-bold mb-4 group-hover:text-[var(--color-4h-green)] transition-colors relative z-10">{pillar.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm relative z-10">
                      {pillar.description}
                    </p>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. UPCOMING ACTIVITIES & EVENTS */}
      <section className="py-24 px-4 md:px-8 bg-slate-50 dark:bg-[#111]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center md:text-left mb-16">
            <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-ink)] dark:text-white mb-4">
              Upcoming <span className="text-[var(--color-4h-green)]">Activities</span>
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl">
              Get involved! Check out our latest schedule of projects and events across different chapters and pillars.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.length === 0 ? <p className="text-slate-500 py-8 col-span-full">No upcoming events happening soon.</p> : events.slice(0, 5).map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/pillars/${event.pillarId}?tab=activities`} className={cn("rounded-2xl hover:shadow-xl transition-all flex flex-col group border h-full overflow-hidden",
                  event.diffDays <= 2
                    ? "bg-white dark:bg-[#151515] border-[var(--color-4h-green)]/40 shadow-sm relative z-10" 
                    : "bg-white dark:bg-[#111] border-slate-200 dark:border-slate-800 hover:border-[var(--color-4h-green)]/30"
                )}>
                  {event.diffDays <= 2 && (
                    <div className="absolute left-0 top-0 right-0 h-1.5 bg-gradient-to-r from-[var(--color-4h-green)] to-[#0f3e23] z-20"></div>
                  )}

                  {/* Thumbnail Image */}
                  {event.image && (
                    <div className="h-40 w-full shrink-0 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-3 left-3 text-white flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 font-bold text-sm drop-shadow-md">
                           <CalendarDays size={14} />
                           {event.date}
                        </div>
                        {(event.timeStart || event.timeEnd || event.time) && (
                          <div className="flex items-center gap-1.5 font-bold text-xs drop-shadow-md text-blue-300">
                             <lucideIcons.Clock size={12} />
                             {formatTimeRange(event.timeStart || event.time, event.timeEnd)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-5 flex flex-col flex-1 gap-3">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md",
                        event.diffDays <= 2 ? "bg-[var(--color-4h-green)] text-white animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      )}>
                        {event.type || event.category}
                      </span>
                      {event.diffDays <= 0 ? (
                        <span className="font-bold text-red-500 text-[10px] uppercase tracking-wider bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md">Happening now</span>
                      ) : (
                        <span className="font-bold text-blue-500 text-[10px] uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                          {event.diffDays} {event.diffDays === 1 ? 'day' : 'days'} left
                        </span>
                      )}
                    </div>

                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white group-hover:text-[var(--color-4h-green)] transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    
                    {event.location && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                        <MapPin size={14} className="text-[var(--color-4h-green)] flex-shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}

                    {!event.image && (
                       <div className="flex flex-col gap-1 mt-2">
                         <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-600 dark:text-slate-300">
                            <CalendarDays size={14} />
                            {event.date}
                         </div>
                         {(event.timeStart || event.timeEnd || event.time) && (
                           <div className="flex items-center gap-1.5 font-bold text-xs text-blue-500 dark:text-blue-400">
                              <lucideIcons.Clock size={12} />
                              {formatTimeRange(event.timeStart || event.time, event.timeEnd)}
                           </div>
                         )}
                       </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. LEADERS MARQUEE */}
      <section className="py-24 overflow-hidden border-y border-[var(--color-4h-green)]/10 dark:border-white/5 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-12">
          <h2 className="font-display text-4xl font-bold tracking-tight text-[var(--color-ink)] dark:text-white">
            Meet the <span className="text-[var(--color-4h-green)]">Executive Council</span>
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mt-2">The dedicated youth leaders guiding the federation forward.</p>
        </div>

        {/* Marquee Wrapper */}
        <div className="relative w-full flex overflow-x-hidden group">
          <div className="animate-[marquee_30s_linear_infinite] flex gap-6 px-3 w-max group-hover:[animation-play-state:paused]">
            {council.length > 0 ? [...council, ...council, ...council].map((leader, i) => (
              <div 
                key={`${leader.id}-${i}`}
                className="flex items-center gap-4 bg-slate-50 dark:bg-[#151515] p-3 pr-6 rounded-full border border-slate-200 dark:border-slate-800 shrink-0 hover:border-[var(--color-4h-green)] transition-all min-w-[280px]"
              >
                {leader.image ? <img src={leader.image} alt={leader.name || "Vacant"} referrerPolicy="no-referrer" className="w-16 h-16 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700" /> : <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xl font-bold border border-slate-200 shrink-0">{(leader.name || 'V').charAt(0).toUpperCase()}</div>}
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 dark:text-white leading-tight">{leader.name || "Vacant"}</span>
                  <span className="text-xs font-semibold text-[var(--color-4h-green)] tracking-wider mt-0.5">{leader.role || "Member"}</span>
                </div>
              </div>
            )) : <p className="py-4 text-slate-500">No members found.</p>}
          </div>
        </div>
      </section>

      {/* 6. SUPPORTER WALL (Oversized, graphical) */}
      <section className="py-24 px-4 md:px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="w-px h-16 bg-white/20 mb-8" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-16">
            Supported by industry leaders & LGU
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-24">
             {partners.length > 0 ? partners.map((partner) => (
              <div 
                key={partner.id} 
                className="font-display text-3xl lg:text-5xl font-black tracking-tighter text-white/30 hover:text-white transition-colors cursor-default select-none grayscale hover:grayscale-0"
              >
                {partner.logo && partner.logo.startsWith('http') ? <img src={partner.logo} alt={partner.name} className="h-12 lg:h-16 object-contain" /> : (partner.logo || partner.name)}
              </div>
            )) : <p className="text-white/50 text-sm">No partners added yet.</p>}
          </div>
        </div>
      </section>
      
    </div>
  );
}
