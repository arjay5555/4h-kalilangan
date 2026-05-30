import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Target, Flag, Users2, Quote, Heart, Hand, Brain, Leaf } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { CloverAnimation } from "../components/CloverAnimation";

type CouncilMember = { id: string; name: string; role: string; type: string; image?: string; };

const getRoleRank = (role: string) => {
  const r = role.toLowerCase();
  if (r.includes('president') && !r.includes('vice')) return 1;
  if (r.includes('vice president') || r.includes('vice-president')) return 2;
  if (r.includes('secretary')) return 3;
  if (r.includes('treasurer')) return 4;
  if (r.includes('auditor')) return 5;
  if (r.includes('p.r.o') || r.includes('public relations') || r.includes('pro')) return 6;
  if (r.includes('manager')) return 7;
  return 8;
};

export default function About() {
  const [council, setCouncil] = useState<CouncilMember[]>([]);
  const [pastAdmins, setPastAdmins] = useState<any[]>([]);
  const [selectedPastAdminId, setSelectedPastAdminId] = useState<string | null>(null);
  const [showAllPastAdmins, setShowAllPastAdmins] = useState(false);
  const [settings, setSettings] = useState({ mission: "", vision: "", aboutDescription: "" });

  const executives = council.filter(c => c.type === "Executive Board").sort((a, b) => getRoleRank(a.role) - getRoleRank(b.role));
  const councilLeaders = council.filter(c => c.type !== "Executive Board");

  useEffect(() => {
    const unsubCouncil = onSnapshot(collection(db, "council"), snap => {
      const arr: CouncilMember[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() } as CouncilMember));
      setCouncil(arr);
    }, err => handleFirestoreError(err, OperationType.GET, "council"));

    const unsubPastAdmins = onSnapshot(collection(db, "pastAdmins"), snap => {
      let arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));

      // Fallback mock if completely empty so we can always see the design
      if (arr.length === 0) {
        arr = [{
          id: "mock-1",
          termName: "2023-2024 (Sample)",
          createdAt: new Date().toISOString(),
          officers: [
            { id: "1", type: "Executive Board", role: "President", name: "Ramon Santos", image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=800&auto=format&fit=crop" },
            { id: "2", type: "Executive Board", role: "Vice President", name: "Maria Clara", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&auto=format&fit=crop" },
            { id: "3", type: "Executive Board", role: "Secretary", name: "Josefa Llanes", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop" },
            { id: "4", type: "School Based", role: "President", name: "Antonio Luna", image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=800&auto=format&fit=crop" },
            { id: "5", type: "Barangay Based", role: "President", name: "Andres Bonifacio", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop" }
          ]
        }];
      }

      // Sort chronologically (oldest to newest) so latest is on the right
      arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setPastAdmins(arr);
    }, err => console.error("Error fetching pastAdmins:", err));

    const unsubSettings = onSnapshot(doc(db, "settings", "site"), snap => {
      if (snap.exists()) {
        const data = snap.data();
        setSettings({
          mission: data.mission || "To develop the Head, Heart, Hands, and Health of young people...",
          vision: data.vision || "A community of empowered youth who lead with integrity...",
          aboutDescription: data.aboutDescription || "We are a dynamic youth organization committed to cultivating the next generation of leaders in agriculture, technology, and community service."
        });
      }
    }, err => handleFirestoreError(err, OperationType.GET, "settings/site"));

    return () => { unsubCouncil(); unsubPastAdmins(); unsubSettings(); };
  }, []);
  return (
    <div className="container mx-auto px-4 md:px-6 pt-40 pb-12">
      <div className="max-w-3xl mb-16">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
          About the <span className="text-[var(--color-4h-green)] font-extrabold">4-H</span> Club
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          {settings.aboutDescription}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-24">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-700"
        >
          <div className="bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
            <Target size={32} />
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-4">Our Vision</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg whitespace-pre-wrap">
            {settings.vision || "A community of empowered youth who lead with integrity..."}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-700"
        >
          <div className="bg-[var(--color-tech-blue)]/10 text-[var(--color-tech-blue)] w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
            <Flag size={32} />
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-4">Our Mission</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base whitespace-pre-wrap">
            {settings.mission || "To develop the Head, Heart, Hands, and Health of young people..."}
          </p>
        </motion.div>
      </div>

      <div className="mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 bg-gradient-to-br from-[var(--color-4h-green)] to-[#1b4332] text-white p-8 md:p-12 rounded-3xl relative overflow-hidden shadow-2xl shadow-green-900/20"
          >
            
            <h2 className="font-display text-4xl font-black mb-12 relative z-10 flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                 <Leaf size={32} />
              </div>
              The 4-H Pledge
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 mb-12">
              <div className="bg-white/10 border border-white/20 p-6 rounded-3xl hover:bg-white/20 hover:border-white/40 transition-all group duration-300">
                <Brain className="text-white/80 group-hover:text-white mb-6 transition-colors" size={40} />
                <p className="text-lg font-medium text-green-100 leading-relaxed">I pledge my <span className="text-white text-2xl font-bold block mt-2">Head</span> to clearer thinking.</p>
              </div>
              
              <div className="bg-white/10 border border-white/20 p-6 rounded-3xl hover:bg-white/20 hover:border-white/40 transition-all group duration-300">
                <Heart className="text-white/80 group-hover:text-white mb-6 transition-colors" size={40} />
                <p className="text-lg font-medium text-green-100 leading-relaxed">I pledge my <span className="text-white text-2xl font-bold block mt-2">Heart</span> to greater loyalty.</p>
              </div>
              
              <div className="bg-white/10 border border-white/20 p-6 rounded-3xl hover:bg-white/20 hover:border-white/40 transition-all group duration-300">
                <Hand className="text-white/80 group-hover:text-white mb-6 transition-colors" size={40} />
                <p className="text-lg font-medium text-green-100 leading-relaxed">I pledge my <span className="text-white text-2xl font-bold block mt-2">Hands</span> to larger service.</p>
              </div>
              
              <div className="bg-white/10 border border-white/20 p-6 rounded-3xl hover:bg-white/20 hover:border-white/40 transition-all group duration-300">
                <Leaf className="text-white/80 group-hover:text-white mb-6 transition-colors" size={40} />
                <p className="text-lg font-medium text-green-100 leading-relaxed">I pledge my <span className="text-white text-2xl font-bold block mt-2">Health</span> to better living.</p>
              </div>
            </div>
            
            <div className="relative z-10 bg-black/20 border border-white/10 rounded-2xl p-6 md:p-8 flex items-start gap-4 shadow-inner backdrop-blur-sm">
               <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-[var(--color-4h-green)] shadow-[0_0_10px_var(--color-4h-green)] animate-pulse"></div>
               <p className="text-white text-xl md:text-2xl font-display font-medium leading-relaxed">
                 For my <span className="text-green-300 font-bold">club</span>, my <span className="text-green-300 font-bold">community</span>, my <span className="text-green-300 font-bold">country</span>, and my <span className="text-green-300 font-bold">world</span>.
               </p>
            </div>
          </motion.div>

          <div className="flex flex-col gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-slate-100 group overflow-hidden dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 md:p-10 rounded-3xl flex flex-col justify-center flex-1 shadow-lg shadow-slate-200/50 dark:shadow-none relative"
            >
              <h3 className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-sm mb-4 relative z-10 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-[var(--color-4h-green)]"></span> Motto
              </h3>
              <p className="font-display text-3xl xl:text-4xl font-black text-slate-900 dark:text-white relative z-10">
                "<span className="text-[var(--color-4h-green)]">To Make the</span> Best Better"
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white group overflow-hidden dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 md:p-10 rounded-3xl flex flex-col justify-center flex-1 shadow-lg shadow-slate-200/50 dark:shadow-none relative"
            >
              <h3 className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-sm mb-4 relative z-10 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-[var(--color-4h-green)]"></span> Slogan
              </h3>
              <p className="font-display text-3xl xl:text-4xl font-black text-slate-900 dark:text-white relative z-10">
                "<span className="text-[var(--color-4h-green)]">Learning</span> by Doing"
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <CloverAnimation />

      {/* Council of Leaders */}
      <div className="space-y-24">
        {council.length === 0 ? (
           <div className="text-slate-500 py-8">No council members found.</div>
        ) : (
          <>
            <div>
              <div className="flex items-center gap-3 mb-12 border-b border-slate-200 dark:border-slate-800 pb-4">
                <Users2 className="text-[var(--color-4h-green)]" size={32} />
                <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Executive Leaders</h2>
              </div>
              
              {executives.length === 0 ? (
                 <div className="text-slate-500 py-8">No executive leaders found.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {executives.map((member, i) => (
                    <motion.div 
                      key={member.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="text-center group"
                    >
                      <div className="w-40 h-40 mx-auto rounded-full overflow-hidden mb-6 border-4 border-slate-100 dark:border-slate-800 group-hover:border-[var(--color-4h-green)] transition-all bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-4xl font-bold text-slate-400">
                        {member.image ? (
                          <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          member.name.charAt(0)
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{member.name}</h3>
                      <p className="text-[var(--color-4h-green)] font-medium mb-1">{member.role}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-widest">{member.type}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3 mb-12 border-b border-slate-200 dark:border-slate-800 pb-4">
                <Users2 className="text-[var(--color-4h-green)]" size={32} />
                <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Representative Leaders</h2>
              </div>
              
              {councilLeaders.length === 0 ? (
                 <div className="text-slate-500 py-8">No representative leaders found.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {councilLeaders.map((member, i) => (
                    <motion.div 
                      key={member.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="text-center group"
                    >
                      <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-6 border-4 border-slate-100 dark:border-slate-800 group-hover:border-[var(--color-4h-green)] transition-all bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-400">
                        {member.image ? (
                          <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          member.name.charAt(0)
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{member.name}</h3>
                      <p className="text-[var(--color-4h-green)] font-medium mb-1">{member.role}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-widest">{member.type}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {pastAdmins.length > 0 && (
        <div className="mt-32 border-t border-slate-200 dark:border-slate-800 pt-16">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <Users2 className="text-slate-400" size={28} />
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Past Administrations</h2>
            </div>
            {pastAdmins.length > 10 && (
              <button 
                onClick={() => setShowAllPastAdmins(!showAllPastAdmins)}
                className="text-sm font-bold text-[var(--color-4h-green)] hover:text-green-700 bg-[var(--color-4h-green)]/10 hover:bg-[var(--color-4h-green)]/20 px-4 py-2 rounded-xl transition-colors"
              >
                {showAllPastAdmins ? "Show Less" : `See All (${pastAdmins.length})`}
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-6">
            {(showAllPastAdmins ? pastAdmins : pastAdmins.slice(-10)).map((term, i) => {
               const president = term.officers?.find((o: any) => o.role?.toLowerCase() === 'president') || term.officers?.[0];
               const isSelected = selectedPastAdminId === term.id;
               
               return (
                 <motion.button 
                   key={term.id} 
                   onClick={() => setSelectedPastAdminId(isSelected ? null : term.id)}
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: i * 0.05 }}
                   className={`flex flex-col items-center group text-center transition-all ${isSelected ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'}`}
                 >
                   <div className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden mb-4 border-4 transition-all flex items-center justify-center text-2xl font-bold text-slate-400 ${isSelected ? 'border-[var(--color-4h-green)] bg-[var(--color-4h-green)]/10' : 'border-slate-100 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 group-hover:border-[var(--color-4h-green)]/50'}`}>
                     {president?.image ? (
                       <img src={president.image} alt={president.name || 'President'} className="w-full h-full object-cover" />
                     ) : (
                       (president?.name?.[0] || 'V')
                     )}
                   </div>
                   <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{president?.name || 'Vacant'}</h3>
                   <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)] max-w-full truncate">{term.termName}</span>
                 </motion.button>
               );
             })}
          </div>

          {/* Expanded view for all officers of a selected term */}
          {selectedPastAdminId && (
            <motion.div 
               initial={{ opacity: 0, height: 0, marginTop: 0 }}
               animate={{ opacity: 1, height: 'auto', marginTop: 40 }}
               className="bg-slate-50 dark:bg-[#151515] rounded-3xl border border-slate-200 dark:border-slate-800 p-8"
            >
               <h3 className="font-display text-xl font-bold text-center mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
                 All Officers - {pastAdmins.find(p => p.id === selectedPastAdminId)?.termName}
               </h3>
               {(() => {
                 const selectedTerm = pastAdmins.find(p => p.id === selectedPastAdminId);
                 if (!selectedTerm || !selectedTerm.officers) return <div className="text-center text-slate-500">No officers found.</div>;
                 
                 const executives = selectedTerm.officers.filter((c: any) => c.type === "Executive Board").sort((a: any, b: any) => getRoleRank(a.role) - getRoleRank(b.role));
                 const councilLeaders = selectedTerm.officers.filter((c: any) => c.type !== "Executive Board");

                 return (
                   <div className="space-y-12">
                     {executives.length > 0 && (
                       <div>
                         <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center mb-6">Executive Board</h4>
                         <div className="flex flex-wrap justify-center gap-6">
                           {executives.map((member: any) => (
                             <div key={member.id} className="text-center w-36">
                               <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-3 border-2 border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-400">
                                 {member.image ? (
                                   <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                 ) : (
                                   (member.name?.[0] || 'V')
                                 )}
                               </div>
                               <h5 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{member.name || 'Vacant'}</h5>
                               <p className="text-[10px] text-[var(--color-4h-green)] uppercase tracking-wider font-medium">{member.role}</p>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     {councilLeaders.length > 0 && (
                       <div>
                         <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center mb-6">Chapter Presidents / Representatives</h4>
                         <div className="flex flex-wrap justify-center gap-6">
                           {councilLeaders.map((member: any) => (
                             <div key={member.id} className="text-center w-32">
                               <div className="w-16 h-16 mx-auto rounded-full overflow-hidden mb-3 border-2 border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-400">
                                 {member.image ? (
                                   <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                 ) : (
                                   (member.name?.[0] || 'V')
                                 )}
                               </div>
                               <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{member.name || 'Vacant'}</h5>
                               <p className="text-[9px] text-[var(--color-4h-green)] uppercase tracking-wider font-medium line-clamp-1">{member.role} ({member.type})</p>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 );
               })()}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
