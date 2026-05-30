import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Handshake, ExternalLink, Quote } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, onSnapshot, doc } from "firebase/firestore";

export default function Partners() {
  const [partners, setPartners] = useState<any[]>([]);
  const [voices, setVoices] = useState<any[]>([]);
  const [description, setDescription] = useState("Our initiatives are amplified by the generous support of local businesses, national corporations, and government agencies. Together, we build better communities.");

  useEffect(() => {
    const unsubPartners = onSnapshot(collection(db, "partners"), snap => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setPartners(arr);
    }, err => handleFirestoreError(err, OperationType.GET, "partners"));

    const unsubVoices = onSnapshot(collection(db, "voices"), snap => {
      const arr: any[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setVoices(arr);
    }, err => handleFirestoreError(err, OperationType.GET, "voices"));

    const unsubSettings = onSnapshot(doc(db, "settings", "site"), snap => {
      if (snap.exists() && snap.data().partnersDescription) {
        setDescription(snap.data().partnersDescription);
      }
    });

    return () => {
      unsubPartners();
      unsubVoices();
      unsubSettings();
    };
  }, []);

  return (
    <div className="container mx-auto px-4 md:px-6 pt-40 pb-12">
      <div className="max-w-3xl mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--color-tech-blue)]/10 text-[var(--color-tech-blue)]">
            <Handshake size={32} />
          </div>
          Partners in Progress
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-24">
        {partners.map((partner, i) => (
          <motion.div
            key={partner.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:border-[var(--color-tech-blue)] transition-colors group cursor-pointer"
          >
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-3xl font-black text-slate-400 dark:text-slate-500 overflow-hidden group-hover:scale-110 transition-all">
              {partner.logo && partner.logo.startsWith('http') ? (
                <img src={partner.logo} alt={partner.name} className="w-full h-full object-cover" />
              ) : (
                partner.logo || partner.name.charAt(0)
              )}
            </div>
            <div className="text-center font-bold text-slate-800 dark:text-slate-200">
              {partner.name}
            </div>
          </motion.div>
        ))}
        {partners.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            No partners added yet.
          </div>
        )}
      </div>

      {/* Testimonials */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 md:p-12 border border-slate-100 dark:border-slate-700 mt-24">
        <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white mb-10 text-center flex items-center justify-center gap-3">
          <Quote className="text-[var(--color-tech-blue)]" />
          Voices from the Field
        </h2>
        
        <div className="grid lg:grid-cols-3 gap-8 items-stretch">
          {/* Left Column: Video Testimony */}
          <div className="lg:col-span-1 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center relative min-h-[350px]">
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none"></div>
             <video src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline></video>
             <div className="relative z-20 text-center p-6 mt-auto self-end w-full">
               <h3 className="text-white font-bold text-xl mb-2">Hear Our Story</h3>
               <p className="text-white/80 text-sm">Watch what our partners and members say about the 4-H experience.</p>
             </div>
          </div>

          <div className="lg:col-span-2 flex overflow-x-auto gap-6 no-scrollbar pb-4 snap-x snap-mandatory">
            {voices.map(voice => (
              <div key={voice.id} className="min-w-[320px] w-full lg:max-w-md snap-start bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-start h-full shrink-0">
                <Quote size={24} className="text-slate-200 dark:text-slate-700 mb-4" />
                <p className="text-slate-600 dark:text-slate-400 italic mb-8 text-lg flex-1">
                  "{voice.quote}"
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                    {voice.avatarUrl ? (
                      <img src={voice.avatarUrl} alt={voice.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">{voice.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 dark:text-white truncate">{voice.name}</div>
                    <div className="text-xs text-[var(--color-tech-blue)] font-medium leading-tight">
                      {voice.role}
                      {voice.office && <span className="block text-slate-500 dark:text-slate-400 mt-0.5">{voice.office}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {voices.length === 0 && (
              <div className="w-full py-12 text-center text-slate-500 flex items-center justify-center">
                No voices from the field yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Support CTA */}
      <div className="mt-24 text-center">
        <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white mb-6">Become a Partner</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-8">
          Are you a business or organization looking to invest in youth development and municipal progress? We are always open to new alliances.
        </p>
        <button className="bg-[var(--color-tech-blue)] hover:bg-[var(--color-tech-blue-dark)] text-white px-8 py-4 rounded-full font-bold text-lg inline-flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20">
          Support Us <ExternalLink size={20} />
        </button>
      </div>
    </div>
  );
}
