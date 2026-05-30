import React, { useState, useEffect } from "react";
import { Send, MessageSquare, ChevronDown, Phone, Mail, MapPin } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "../lib/utils";

type FAQItem = { question: string; answer: string; };

export default function ContactFAQ() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [contactInfo, setContactInfo] = useState({ email: "", phone: "", address: "" });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "site"), snap => {
      if (snap.exists()) {
        const data = snap.data();
        setFaqs(data.faqs || []);
        setContactInfo({
          email: data.contactEmail || "",
          phone: data.contactPhone || "",
          address: data.contactAddress || ""
        });
      }
    }, err => handleFirestoreError(err, OperationType.GET, "settings/site"));
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setIsSubmitting(true);
    setSubmitStatus("idle");
    try {
      await addDoc(collection(db, "messages"), {
        ...formData,
        createdAt: serverTimestamp(),
        status: "unread"
      });
      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSubmitStatus("idle"), 5000);
    } catch (err) {
      console.error(err);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-24 bg-slate-50 dark:bg-[#0a0a0a] min-h-screen">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-black text-[var(--color-ink)] dark:text-white tracking-tighter mb-4 flex items-center gap-4">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--color-4h-green)]/10 text-[var(--color-4h-green)]">
              <MessageSquare size={28} />
            </div>
            <span>Contact <span className="text-[var(--color-4h-green)]">&</span> FAQ</span>
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
            Have questions or need assistance? Check our FAQs below or send us a message directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FAQ Section */}
          <div>
            <h2 className="text-2xl font-bold font-display mb-6 text-[var(--color-ink)] dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
              Frequently Asked Questions
            </h2>
            {faqs.length > 0 ? (
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all hover:shadow-md">
                    <button 
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)} 
                      className="w-full text-left px-5 py-4 flex items-center justify-between font-bold text-[var(--color-ink)] dark:text-white"
                    >
                      <span className="pr-4">{faq.question}</span>
                      <ChevronDown size={20} className={cn("shrink-0 transition-transform text-slate-400", openFaq === idx ? "rotate-180 text-[var(--color-4h-green)]" : "")} />
                    </button>
                    <div className={cn("px-5 text-slate-600 dark:text-slate-400 overflow-hidden transition-all", openFaq === idx ? "pb-4 block" : "h-0 hidden")}>
                      {faq.answer}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-[#111] rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-slate-500">No FAQs available at this time.</p>
              </div>
            )}
          </div>

          {/* Contact Form & Info Section */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-[#111] rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-yellow-400 to-[var(--color-4h-green)]"></div>
              <h2 className="text-2xl font-bold font-display mb-6 text-[var(--color-ink)] dark:text-white">
                Send us a Message
              </h2>
              
              {submitStatus === "success" && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl font-medium border border-green-200 dark:border-green-800/30 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  Message sent successfully! We'll get back to you soon.
                </div>
              )}
              {submitStatus === "error" && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl font-medium border border-red-200 dark:border-red-800/30">
                  Failed to send message. Please checking your connection and try again.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-[var(--color-ink)] dark:text-slate-300">Name *</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-[var(--color-ink)] dark:text-slate-300">Email *</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" placeholder="your@email.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[var(--color-ink)] dark:text-slate-300">Subject</label>
                  <input type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)]" placeholder="How can we help?" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-[var(--color-ink)] dark:text-slate-300">Message *</label>
                  <textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl outline-none focus:border-[var(--color-4h-green)] h-32 resize-none" placeholder="Your message here..." />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-[var(--color-4h-green)] hover:bg-[#1a5b3c] text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                  {isSubmitting ? "Sending..." : "Send Message"}
                  {!isSubmitting && <Send size={18} />}
                </button>
              </form>
            </div>

            {/* Direct Contact Details */}
            <div className="bg-[#151515] p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[var(--color-4h-green)] rounded-full blur-3xl opacity-30"></div>
              <h2 className="text-xl font-bold font-display mb-6">Direct Contact</h2>
              <ul className="space-y-5">
                {contactInfo.phone && (
                   <li className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-yellow-400 shrink-0">
                         <Phone size={18} />
                      </div>
                      <span className="font-medium text-white/90">{contactInfo.phone}</span>
                   </li>
                )}
                {contactInfo.email && (
                   <li className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-yellow-400 shrink-0">
                         <Mail size={18} />
                      </div>
                      <a href={`mailto:${contactInfo.email}`} className="font-medium text-white/90 hover:text-yellow-400 transition-colors">{contactInfo.email}</a>
                   </li>
                )}
                {contactInfo.address && (
                   <li className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-yellow-400 shrink-0">
                         <MapPin size={18} />
                      </div>
                      <span className="font-medium text-white/90 leading-snug">{contactInfo.address}</span>
                   </li>
                )}
                {(!contactInfo.email && !contactInfo.phone && !contactInfo.address) && (
                   <li className="text-white/60 text-sm">Contact details are being updated.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
