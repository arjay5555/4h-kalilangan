import { useParams, useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, CheckCircle2, ArrowRight, Target, Leaf, Heart, Download, Package, Activity, Info } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore";
import * as lucideIcons from "lucide-react";
import { formatTimeAMPM, formatTimeRange, calculateDiffDays } from "../lib/utils";

export default function PillarDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [pillar, setPillar] = useState<any>(null);
  const [otherPillars, setOtherPillars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get("tab") || "about";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (!id) return;
    const fetchPillarAndOthers = async () => {
      setLoading(true);
      try {
        const pillarDoc = await getDoc(doc(db, "pillars", id));
        if (pillarDoc.exists()) {
          setPillar({ id: pillarDoc.id, ...pillarDoc.data() });
        } else {
          setPillar(null);
        }

        // Fetch other pillars for navigation
        try {
          const pillarsSnap = await getDocs(collection(db, "pillars"));
          const allArr: any[] = [];
          pillarsSnap.forEach(d => {
            if (d.id !== id) {
              allArr.push({ id: d.id, ...d.data() });
            }
          });
          // Pick a random subset of 3 or just display them all
          setOtherPillars(allArr.slice(0, 3));
        } catch (err) {
          console.error("Failed to fetch other pillars", err);
        }

      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `pillars/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchPillarAndOthers();
  }, [id]);

  const [activeAlbum, setActiveAlbum] = useState<any>(null);
  const [albumTab, setAlbumTab] = useState<'photos' | 'videos'>('photos');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [previewDoc, setPreviewDoc] = useState<{title: string, url: string} | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const tabs = [
    { id: "about", label: "About" },
    { id: "activities", label: "Activities & Events" },
    { id: "projects", label: "Projects" },
    { id: "media", label: "Media & Pictures" }
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 pt-40 pb-24 text-center">
        <h1 className="font-display text-2xl font-bold mb-4">Loading...</h1>
      </div>
    );
  }

  if (!pillar) {
    return (
      <div className="container mx-auto px-4 pt-40 pb-24 text-center">
        <h1 className="font-display text-4xl font-bold mb-4">Pillar Not Found</h1>
        <Link to="/pillars" className="text-[var(--color-4h-green)] hover:underline inline-flex items-center gap-2">
          <ArrowLeft size={20} /> Back to Pillars
        </Link>
      </div>
    );
  }

  const Icon = pillar.icon && (lucideIcons as any)[pillar.icon] ? (lucideIcons as any)[pillar.icon] : lucideIcons.Circle;

  return (
    <div className="container mx-auto px-4 md:px-6 pt-40 pb-24 max-w-5xl">
      <Link to="/pillars" className="inline-flex items-center gap-2 text-slate-500 hover:text-[var(--color-4h-green)] transition-colors mb-8 font-medium">
        <ArrowLeft size={20} /> Back to Pillars
      </Link>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)]">
             <Icon size={48} strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-tight">
            {pillar.title}
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400">
            {pillar.description}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          key={`hero-${id}`}
          className="relative rounded-3xl overflow-hidden aspect-video shadow-2xl bg-black"
        >
          {pillar.heroVideo ? (
            pillar.heroVideo.includes("youtube.com") || pillar.heroVideo.includes("youtu.be") ? (
              <iframe 
                src={pillar.heroVideo.includes("watch?v=") ? pillar.heroVideo.replace("watch?v=", "embed/") : pillar.heroVideo.replace("youtu.be/", "www.youtube.com/embed/")} 
                className="w-full h-full border-0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen 
              />
            ) : (
              <video src={pillar.heroVideo} controls className="w-full h-full object-cover" />
            )
          ) : (
            <>
              <img 
                src={pillar.image || "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1000&auto=format&fit=crop"} 
                alt={pillar.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </>
          )}
        </motion.div>
      </div>

      {pillar.highlightImages && pillar.highlightImages.length > 0 && (
        <div className="mb-16">
          <h3 className="font-display text-2xl font-bold mb-6 text-slate-900 dark:text-white">Highlights</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pillar.highlightImages.map((img: any, idx: number) => (
              <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden shadow-md cursor-pointer" onClick={() => setPreviewPhoto(img.url)}>
                 <img src={img.url} alt={img.name || `Highlight ${idx}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-12 border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-8 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap pb-4 text-sm md:text-base font-bold transition-colors relative ${
                activeTab === tab.id
                  ? "text-[var(--color-4h-green)]"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activePillarTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-4h-green)]"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'about' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="prose prose-slate dark:prose-invert prose-lg md:prose-xl max-w-none"
          >
            {pillar.extendedDescription ? (
               <p className="leading-relaxed text-slate-700 dark:text-slate-300">{pillar.extendedDescription}</p>
            ) : (
               <p className="text-slate-500 italic">No extended description available for this pillar.</p>
            )}
          </motion.div>
        )}

        {activeTab === 'activities' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {selectedEvent ? (
              <div className="bg-white dark:bg-[#111] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden mb-12">
                <div className="relative h-64 md:h-96 bg-slate-900 flex items-center justify-center">
                  {selectedEvent.image ? (
                    <>
                       <img src={selectedEvent.image} alt={selectedEvent.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-4h-green)]/20 text-[var(--color-4h-green)]"><lucideIcons.CalendarDays size={80} className="opacity-50" /></div>
                  )}
                  <button onClick={() => setSelectedEvent(null)} className="absolute top-4 left-4 bg-black/50 hover:bg-black text-white p-2 rounded-full backdrop-blur-sm transition-colors z-10 flex items-center gap-2 pr-4 text-sm font-bold">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <div className="absolute bottom-0 left-0 w-full p-6 md:p-10">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="text-white text-sm font-bold tracking-widest uppercase bg-[var(--color-4h-green)] px-3 py-1 rounded-full inline-flex items-center gap-1.5"><lucideIcons.CalendarDays size={16} /> {selectedEvent.date}</span>
                      {(selectedEvent.timeStart || selectedEvent.timeEnd || selectedEvent.time) && (
                        <span className="text-blue-300 text-sm font-bold tracking-widest uppercase bg-black/60 backdrop-blur-md px-3 py-1 rounded-full inline-flex items-center gap-1.5"><lucideIcons.Clock size={16} /> {formatTimeRange(selectedEvent.timeStart || selectedEvent.time, selectedEvent.timeEnd)}</span>
                      )}
                      {selectedEvent.location && (
                        <span className="text-white text-sm font-bold bg-black/60 backdrop-blur-md px-3 py-1 rounded-full inline-flex items-center gap-1.5"><lucideIcons.MapPin size={16} /> {selectedEvent.location}</span>
                      )}
                    </div>
                    <h3 className="font-display text-4xl md:text-5xl font-bold text-white drop-shadow-md">{selectedEvent.title}</h3>
                  </div>
                </div>
                
                <div className="p-6 md:p-10">
                  <div className="flex flex-col md:flex-row gap-12">
                    <div className="flex-1 space-y-8">
                       <div>
                         <h4 className="font-display text-2xl font-bold mb-4 flex items-center gap-2"><lucideIcons.Info className="text-[var(--color-4h-green)]" /> About the Event</h4>
                         <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
                       </div>
                       
                       {selectedEvent.photos && selectedEvent.photos.length > 0 && (
                         <div>
                           <h4 className="font-display text-xl font-bold mb-4 flex items-center gap-2"><lucideIcons.Image className="text-[var(--color-4h-green)]" /> Event Photos</h4>
                           <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                             {selectedEvent.photos.map((photo: any, i: number) => (
                               <img key={i} src={photo.url} onClick={() => setPreviewPhoto(photo.url)} className="w-full aspect-square object-cover rounded-xl shadow-sm hover:scale-105 transition-transform cursor-pointer" />
                             ))}
                           </div>
                         </div>
                       )}
                    </div>
                    
                    <div className="w-full md:w-80 space-y-6">
                      {selectedEvent.videoLink && (
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                          <h4 className="font-display text-lg font-bold mb-4 flex items-center gap-2"><lucideIcons.Video className="text-[var(--color-4h-green)]" /> Featured Video</h4>
                          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                            <iframe 
                              src={selectedEvent.videoLink.includes('youtu.be') ? selectedEvent.videoLink.replace('youtu.be/', 'youtube.com/embed/') : selectedEvent.videoLink.replace('watch?v=', 'embed/').split('&')[0]} 
                              className="w-full h-full border-0" 
                              allowFullScreen 
                            />
                          </div>
                        </div>
                      )}
                      
                      {selectedEvent.documents && selectedEvent.documents.length > 0 && (
                         <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                           <h4 className="font-display text-lg font-bold mb-4 flex items-center gap-2"><lucideIcons.FileDown className="text-[var(--color-4h-green)]" /> Downloadables</h4>
                           <div className="space-y-3">
                             {selectedEvent.documents.map((doc: any, i: number) => (
                               <button key={i} onClick={(e) => { e.preventDefault(); setPreviewDoc(doc); }} className="flex w-full items-center gap-3 bg-white dark:bg-black p-3 rounded-xl hover:text-[var(--color-4h-green)] hover:shadow-md transition-all font-medium text-sm text-left">
                                  <div className="bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] p-2 rounded-lg"><lucideIcons.FileText size={16} /></div>
                                  <span className="flex-1 truncate">{doc.title}</span>
                                  <lucideIcons.Eye size={14} className="opacity-50" />
                               </button>
                             ))}
                           </div>
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : pillar.upcomingEvents && Array.isArray(pillar.upcomingEvents) && pillar.upcomingEvents.filter((e:any) => !e.isArchived && calculateDiffDays(e.date) >= 0).length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {pillar.upcomingEvents.filter((e:any) => !e.isArchived && calculateDiffDays(e.date) >= 0).map((event: any, idx: number) => {
                  const diffDays = calculateDiffDays(event.date);
                  
                  return (
                  <div key={idx} onClick={() => setSelectedEvent({...event, idx})} className="group bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-[var(--color-4h-green)] hover:shadow-xl transition-all shadow-sm flex flex-col cursor-pointer hover:-translate-y-1 relative">
                    {diffDays <= 2 && diffDays >= 0 && (
                      <div className="absolute left-0 top-0 right-0 h-1.5 bg-gradient-to-r from-[var(--color-4h-green)] to-[#0f3e23] z-20"></div>
                    )}
                    {event.image ? (
                      <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                           <span className="text-white font-semibold flex items-center gap-1"><lucideIcons.Eye size={16} /> View Full Details</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden relative flex items-center justify-center text-[var(--color-4h-green)]/40">
                         <lucideIcons.CalendarDays size={48} className="group-hover:scale-110 transition-transform duration-700" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                           <span className="text-white font-semibold flex items-center gap-1"><lucideIcons.Eye size={16} /> View Full Details</span>
                        </div>
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex flex-col mb-4">
                         <div className="flex flex-wrap items-center gap-2 mb-1">
                           <span className="text-sm font-bold tracking-widest uppercase text-[var(--color-4h-green)] flex items-center gap-1"><lucideIcons.CalendarDays size={14} /> {event.date}</span>
                           {(event.timeStart || event.timeEnd || event.time) && (
                             <span className="text-sm font-bold tracking-widest uppercase text-blue-500 dark:text-blue-400 flex items-center gap-1"><lucideIcons.Clock size={14} /> {formatTimeRange(event.timeStart || event.time, event.timeEnd)}</span>
                           )}
                           {event.location && (
                             <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded flex items-center gap-1"><lucideIcons.MapPin size={12} /> {event.location}</span>
                           )}
                         </div>
                         
                         {diffDays >= 0 && diffDays <= 7 && (
                            <div className="mt-2 mb-1">
                              {diffDays <= 0 ? (
                                <span className="font-bold text-red-500 text-[10px] uppercase tracking-wider bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md">Happening now</span>
                              ) : (
                                <span className="font-bold text-blue-500 text-[10px] uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                                  {diffDays} {diffDays === 1 ? 'day' : 'days'} left
                                </span>
                              )}
                            </div>
                         )}
                         <h4 className="font-display font-bold text-2xl text-slate-900 dark:text-white group-hover:text-[var(--color-4h-green)] transition-colors mt-2">{event.title}</h4>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed flex-1 line-clamp-3">{event.description}</p>
                    </div>
                  </div>
                )})}
              </div>
            ) : (
              <p className="text-slate-500 italic">No upcoming activities or events have been listed yet.</p>
            )}
          </motion.div>
        )}

        {activeTab === 'projects' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {pillar.sampleProjects && Array.isArray(pillar.sampleProjects) && pillar.sampleProjects.filter((p:any) => !p.isArchived).length > 0 ? (
              <ul className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {pillar.sampleProjects.filter((p:any) => !p.isArchived).map((project: any, idx: number) => (
                  <li key={idx} className="bg-white dark:bg-[#151515] rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[var(--color-4h-green)]/5 transition-all duration-500 flex flex-col group/card relative">
                    {project.image && (
                      <div className="w-full h-72 md:h-96 relative overflow-hidden bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/60">
                         <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700 opacity-90 group-hover/card:opacity-100" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                         
                         {/* Badges overlaid on image */}
                         <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                           {project.year && (
                             <span className="bg-white/90 dark:bg-black/90 backdrop-blur-md text-slate-900 dark:text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
                               {project.year}
                             </span>
                           )}
                           {project.status && (
                             <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-sm border ${
                               project.status === 'Active' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                               project.status === 'Planning' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                               project.status === 'Completed' ? 'bg-slate-500/20 text-slate-300 border-slate-500/30' :
                               'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                             }`}>
                               {project.status}
                             </span>
                           )}
                         </div>

                         {/* Title & Tagline overlaid */}
                         <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-10 md:right-10">
                           <h3 className="font-display text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">
                             {project.title || 'Untitled Project'}
                           </h3>
                           {project.tagline && (
                             <p className="text-slate-300 font-medium text-lg md:text-xl max-w-2xl text-balance">
                               {project.tagline}
                             </p>
                           )}
                         </div>
                      </div>
                    )}

                    <div className="flex flex-col p-6 md:p-10 gap-10">
                      {/* Description Block for when there is NO image */}
                      {(!project.image) && (
                        <div>
                           <div className="flex flex-wrap gap-2 mb-4">
                             {project.year && (
                               <span className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
                                 {project.year}
                               </span>
                             )}
                             {project.status && (
                               <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm ${
                                 project.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                                 project.status === 'Planning' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                                 project.status === 'Completed' ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                                 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                               }`}>
                                 {project.status}
                               </span>
                             )}
                           </div>
                           <h3 className="font-display text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                             {project.title || 'Untitled Project'}
                           </h3>
                           {project.tagline && (
                             <p className="text-slate-500 dark:text-slate-400 font-medium text-xl md:text-2xl mb-6">
                               {project.tagline}
                             </p>
                           )}
                        </div>
                      )}

                      {(project.objective || project.about) && (
                        <div className="grid md:grid-cols-2 gap-8 md:gap-12 relative">
                           {project.objective && (
                             <div className="space-y-4">
                               <div className="inline-flex items-center gap-2 text-[var(--color-4h-green)] font-bold uppercase tracking-widest text-sm mb-1 bg-[var(--color-4h-green)]/10 px-4 py-1.5 rounded-full">
                                 <Target size={18} /> Objective
                               </div>
                               <p className="text-slate-800 dark:text-slate-200 text-xl leading-relaxed font-medium">
                                 {project.objective}
                               </p>
                             </div>
                           )}
                           {project.about && (
                             <div className="space-y-4">
                               <div className="inline-flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-sm mb-1 bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full">
                                 <Info size={18} /> About
                               </div>
                               <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                                 {project.about}
                               </p>
                             </div>
                           )}
                        </div>
                      )}

                      {/* Metrics / Highlights Block */}
                      {(project.impact || project.sustainabilityPlan || project.acknowledgment) && (
                        <div className="grid sm:grid-cols-3 gap-6 pt-10 border-t border-slate-100 dark:border-slate-800/60 mt-4">
                          {project.impact && (
                            <div className="bg-[var(--color-4h-green)]/5 dark:bg-[var(--color-4h-green)]/10 p-6 sm:p-8 rounded-[1.5rem] border border-[var(--color-4h-green)]/20 shadow-sm relative overflow-hidden group/impact">
                              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--color-4h-green)]/10 rounded-full blur-2xl group-hover/impact:blur-xl transition-all" />
                              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#111] text-[var(--color-4h-green)] shadow-sm border border-[var(--color-4h-green)]/20 flex items-center justify-center mb-5 relative z-10">
                                 <Activity size={24} />
                              </div>
                              <strong className="block text-slate-900 dark:text-white font-bold mb-3 text-xl relative z-10">Impact</strong>
                              <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed relative z-10">{project.impact}</p>
                            </div>
                          )}
                          {project.sustainabilityPlan && (
                             <div className="bg-slate-50 dark:bg-[#1a1a1a] p-6 sm:p-8 rounded-[1.5rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-colors hover:bg-slate-100 dark:hover:bg-[#222]">
                               <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#111] text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center mb-5">
                                  <Leaf size={24} />
                               </div>
                               <strong className="block text-slate-900 dark:text-white font-bold mb-3 text-xl">Sustainability</strong>
                               <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">{project.sustainabilityPlan}</p>
                             </div>
                          )}
                          {project.acknowledgment && (
                             <div className="bg-slate-50 dark:bg-[#1a1a1a] p-6 sm:p-8 rounded-[1.5rem] border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-colors hover:bg-slate-100 dark:hover:bg-[#222]">
                               <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#111] text-pink-600 dark:text-pink-400 shadow-sm border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center mb-5">
                                  <Heart size={24} />
                               </div>
                               <strong className="block text-slate-900 dark:text-white font-bold mb-3 text-xl">Acknowledgments</strong>
                               <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">{project.acknowledgment}</p>
                             </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      {(project.downloadUrl || (project.callToAction && project.callToAction.url)) && (
                        <div className="flex flex-wrap items-center gap-4 pt-10 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
                          {project.callToAction && project.callToAction.url && (
                            <a href={project.callToAction.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-lg font-bold text-white bg-[var(--color-4h-green)] hover:bg-green-700 px-8 py-4 rounded-2xl shadow-lg shadow-[var(--color-4h-green)]/20 hover:shadow-[var(--color-4h-green)]/40 transition-all group shrink-0">
                               {project.callToAction.text || "Partner With Us"} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </a>
                          )}
                          {project.downloadUrl && (
                            <a href={project.downloadUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-lg font-bold text-[var(--color-4h-green)] hover:text-green-800 bg-[var(--color-4h-green)]/10 hover:bg-[var(--color-4h-green)]/20 px-8 py-4 rounded-2xl transition-all font-medium shrink-0">
                              <Download size={20} /> Download Details
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-[#111] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                 <Package className="mx-auto h-12 w-12 text-[var(--color-4h-green)]/50 mb-4" />
                 <p className="text-slate-500 font-medium text-lg">No programs or projects listed yet.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'media' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {activeAlbum ? (
               <div className="bg-slate-50 dark:bg-[#111] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <button onClick={() => setActiveAlbum(null)} className="flex items-center gap-2 text-[var(--color-4h-green)] hover:underline mb-6 font-semibold"><ArrowLeft size={16}/> Back to Albums</button>
                  <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
                    <h3 className="font-display text-3xl font-bold mb-2 text-slate-900 dark:text-white">{activeAlbum.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      {activeAlbum.date && <p className="text-slate-500 font-semibold tracking-widest uppercase text-sm">{activeAlbum.date}</p>}
                      {activeAlbum.location && <p className="text-slate-500 font-medium text-sm flex items-center gap-1 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md"><lucideIcons.MapPin size={14} /> {activeAlbum.location}</p>}
                    </div>
                    {activeAlbum.description && <p className="text-slate-700 dark:text-slate-300 mb-6">{activeAlbum.description}</p>}
                    
                    <div className="flex gap-6 mt-6">
                      <button 
                        onClick={() => setAlbumTab('photos')} 
                        className={`text-sm font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors ${albumTab === 'photos' ? 'border-[var(--color-4h-green)] text-[var(--color-4h-green)]' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                      >
                        Photos
                      </button>
                      <button 
                        onClick={() => setAlbumTab('videos')} 
                        className={`text-sm font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors ${albumTab === 'videos' ? 'border-[var(--color-4h-green)] text-[var(--color-4h-green)]' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                      >
                        Videos
                      </button>
                    </div>
                  </div>
                  
                  {activeAlbum.media && activeAlbum.media.filter((item: any) => albumTab === 'photos' ? item.type === 'image' : item.type === 'video').length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeAlbum.media.filter((item: any) => albumTab === 'photos' ? item.type === 'image' : item.type === 'video').map((item: any, idx: number) => (
                        <div key={idx} className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 group shadow flex flex-col">
                          <div className="aspect-square relative overflow-hidden bg-black flex items-center justify-center">
                            {item.type === 'video' ? (
                              item.url.includes('youtube.com') || item.url.includes('youtu.be') ? (
                                <iframe 
                                  src={item.url.includes('youtu.be') ? item.url.replace('youtu.be/', 'youtube.com/embed/') : item.url.replace('watch?v=', 'embed/').split('&')[0]}
                                  className="w-full h-full" 
                                  allowFullScreen 
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                ></iframe>
                              ) : (
                                <video src={item.url} controls className="w-full h-full object-cover" />
                              )
                            ) : (
                              <img src={item.url} onClick={() => setPreviewPhoto(item.url)} alt={item.description || 'Media'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 cursor-pointer" />
                            )}
                          </div>
                          {(item.title || item.description || item.date) && (
                            <div className="p-4 bg-white dark:bg-[#151515] border-t border-slate-100 dark:border-slate-800 flex-1 flex flex-col gap-1">
                               {item.date && <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{item.date}</span>}
                               {item.title && <h4 className="text-[var(--color-4h-green)] font-bold text-base">{item.title}</h4>}
                               {item.description && <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{item.description}</p>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-slate-500 italic">No {albumTab} found in this album.</p>}
               </div>
            ) : (
               <div className="flex flex-col gap-12">
                 {pillar.albums && pillar.albums.length > 0 && (
                   <div>
                     <h3 className="font-display text-2xl font-bold mb-6 text-slate-900 dark:text-white">Photo & Video Albums</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                       {pillar.albums.map((album: any) => (
                         <div key={album.id} onClick={() => setActiveAlbum(album)} className="group cursor-pointer bg-white dark:bg-[#111] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:border-[var(--color-4h-green)] transition-all">
                           <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                              {album.cover ? (
                                <img src={album.cover} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                              ) : album.media && album.media.length > 0 ? (
                                album.media[0].type === 'image' ? (
                                  <img src={album.media[0].url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                ) : (
                                  album.media[0].url.includes('youtube.com') || album.media[0].url.includes('youtu.be') ? (
                                    <iframe src={album.media[0].url.includes('youtu.be') ? album.media[0].url.replace('youtu.be/', 'youtube.com/embed/') : album.media[0].url.replace('watch?v=', 'embed/').split('&')[0]} className="w-full h-full pointer-events-none" />
                                  ) : (
                                    <video src={album.media[0].url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                  )
                                )
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <lucideIcons.Image size={32} />
                                </div>
                              )}
                              <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm text-slate-900 dark:text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                                <lucideIcons.Layers size={14} className="text-[var(--color-4h-green)]" />
                                {(album.media || []).length} items
                              </div>
                           </div>
                           <div className="p-5 flex flex-col items-center text-center">
                              <h4 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-[var(--color-4h-green)] transition-colors">{album.title}</h4>
                              <div className="flex flex-col items-center gap-1">
                                {album.date && <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">{album.date}</p>}
                                {album.location && <p className="text-slate-400 text-xs font-medium flex items-center gap-1"><lucideIcons.MapPin size={12} /> {album.location}</p>}
                              </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Legacy Media Rendering */}
                 {pillar.media && Array.isArray(pillar.media) && pillar.media.length > 0 && (
                   <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                     <h3 className="font-display text-xl font-bold mb-6 text-slate-900 dark:text-white">Other Media</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                       {pillar.media.map((item: any, idx: number) => (
                         <div key={idx} className="relative aspect-square rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 group shadow-lg">
                           {item.type === 'video' ? (
                             <video src={item.url} controls className="w-full h-full object-cover" />
                           ) : (
                             <img src={item.url} onClick={() => setPreviewPhoto(item.url)} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 cursor-pointer" />
                           )}
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {(!pillar.albums || pillar.albums.length === 0) && (!pillar.media || pillar.media.length === 0) && (
                   <p className="text-slate-500 italic">No media available for this pillar.</p>
                 )}
               </div>
            )}
          </motion.div>
        )}
      </div>

      {otherPillars.length > 0 && (
        <div className="mt-32 pt-16 border-t border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Explore Other Pillars</h2>
              <p className="text-slate-500 mt-2">Discover more ways we impact the community.</p>
            </div>
            <Link to="/pillars" className="text-[var(--color-4h-green)] hover:underline font-semibold text-sm hidden sm:block">
              View All Pillars
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {otherPillars.map(p => {
               const OtherIcon = p.icon && (lucideIcons as any)[p.icon] ? (lucideIcons as any)[p.icon] : lucideIcons.Circle;
               return (
                 <Link key={p.id} to={`/pillars/${p.id}`} className="group relative rounded-3xl overflow-hidden aspect-video outline-none focus-visible:ring-4 ring-[var(--color-4h-green)] ring-offset-2 dark:ring-offset-[#09090b]">
                   <img src={p.image} alt={p.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                   <div className="absolute inset-0 p-6 flex flex-col justify-end">
                     <div className="bg-white/20 backdrop-blur-md w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 shadow-lg">
                        <OtherIcon size={20} />
                     </div>
                     <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[var(--color-4h-green)] transition-colors">{p.title}</h3>
                     <div className="flex items-center gap-2 text-white/80 text-sm font-semibold group-hover:text-white transition-colors">
                       View Details <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                     </div>
                   </div>
                 </Link>
               );
            })}
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden w-full max-w-2xl max-h-[75vh] h-[75vh] flex flex-col shadow-2xl">
              <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-lg flex items-center gap-2"><lucideIcons.FileText className="text-[var(--color-4h-green)]" /> {previewDoc.title}</h3>
                <div className="flex gap-2">
                  <a href={previewDoc.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-500 hover:text-[var(--color-4h-green)] bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors" title="Download">
                    <lucideIcons.Download size={18} />
                  </a>
                  <button onClick={() => setPreviewDoc(null)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <lucideIcons.X size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-slate-100 dark:bg-black/50 p-4 overflow-hidden relative">
                 {previewDoc.url.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) || (previewDoc.url.includes('alt=media&token=') && !previewDoc.url.toLowerCase().includes('.pdf') && !previewDoc.url.toLowerCase().match(/\.(doc|docx|ppt|pptx|xls|xlsx)($|\?)/i)) ? (
                   <div className="w-full h-full overflow-auto flex items-center justify-center">
                       <img src={previewDoc.url} alt={previewDoc.title} className="max-w-full max-h-full object-contain rounded-xl shadow-sm border border-slate-200 dark:border-slate-800" />
                   </div>
                 ) : previewDoc.url.toLowerCase().match(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx)($|\?)/i) || previewDoc.url.includes('alt=media&token=') ? (
                   <iframe 
                     src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewDoc.url)}&embedded=true`}
                     className="w-full h-full border-0 rounded-xl bg-white"
                     title={previewDoc.title}
                   />
                 ) : (
                   <iframe 
                     src={previewDoc.url}
                     className="w-full h-full border-0 rounded-xl bg-white"
                     title={previewDoc.title}
                   />
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setPreviewPhoto(null)}>
           <button onClick={() => setPreviewPhoto(null)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors">
             <lucideIcons.X size={24} />
           </button>
           <img src={previewPhoto} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}

    </div>
  );
}
