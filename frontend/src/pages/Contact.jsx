import { useState } from "react";
import { Mail, MapPin, Phone, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } };

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      toast.success("Message received. We will respond shortly.");
      setForm({ name: "", email: "", subject: "", message: "" });
      setSending(false);
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-12 py-24 lg:py-32">
      
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-20">
        <h1 className="font-semibold text-5xl lg:text-6xl text-surface-950 dark:text-surface-50 mb-6 tracking-tight">Initiate contact.</h1>
        <p className="text-lg text-surface-500 max-w-xl mx-auto text-balance">
          Whether you have a question, require assistance, or wish to collaborate, our team is ready to listen.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        
        {/* Contact Info Sidebar */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="lg:col-span-4 space-y-6">
          <div className="bg-surface-50 dark:bg-surface-900 rounded-[2rem] border border-border p-8 hover:shadow-surface transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 border border-border flex items-center justify-center mb-6">
              <Mail className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="text-lg font-medium text-surface-950 dark:text-surface-50 mb-1">Direct Line</h3>
            <p className="text-surface-500 text-sm">support@evently.app</p>
          </div>
          
          <div className="bg-surface-50 dark:bg-surface-900 rounded-[2rem] border border-border p-8 hover:shadow-surface transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 border border-border flex items-center justify-center mb-6">
              <MapPin className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="text-lg font-medium text-surface-950 dark:text-surface-50 mb-1">Headquarters</h3>
            <p className="text-surface-500 text-sm">San Francisco, CA<br/>Global Remote Team</p>
          </div>
          
          <div className="bg-surface-50 dark:bg-surface-900 rounded-[2rem] border border-border p-8 hover:shadow-surface transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 border border-border flex items-center justify-center mb-6">
              <Phone className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="text-lg font-medium text-surface-950 dark:text-surface-50 mb-1">Operating Hours</h3>
            <p className="text-surface-500 text-sm">Mon - Fri, 9:00 AM - 6:00 PM PST</p>
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="lg:col-span-8 bg-surface-50 dark:bg-surface-900 rounded-[2.5rem] border border-border p-8 sm:p-12 shadow-surface relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="mb-10 relative z-10">
            <h2 className="text-2xl font-semibold text-surface-950 dark:text-surface-50">Send a dispatch</h2>
            <p className="text-surface-500 mt-2 text-sm">We aim to respond to all inquiries within 24 hours.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Full Name</label>
                <input
                  type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-100 dark:bg-surface-950 border border-border text-surface-900 dark:text-white rounded-xl text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Email Address</label>
                <input
                  type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-100 dark:bg-surface-950 border border-border text-surface-900 dark:text-white rounded-xl text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  placeholder="jane@example.com"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Subject</label>
              <input
                type="text" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-4 py-3 bg-surface-100 dark:bg-surface-950 border border-border text-surface-900 dark:text-white rounded-xl text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                placeholder="How can we assist?"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">Message</label>
              <textarea
                required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-3 bg-surface-100 dark:bg-surface-950 border border-border text-surface-900 dark:text-white rounded-xl text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none transition-all"
                placeholder="Detail your inquiry..."
              />
            </div>
            
            <div className="pt-2">
              <button type="submit" disabled={sending} className="group inline-flex items-center justify-center gap-2 bg-surface-950 text-surface-50 dark:bg-surface-50 dark:text-surface-950 hover:bg-surface-800 dark:hover:bg-surface-200 px-8 py-4 rounded-full font-medium transition-all hover:scale-[1.02] active:scale-95 shadow-sm disabled:opacity-50">
                {sending ? "Transmitting..." : <>Transmit Message <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
