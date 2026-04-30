import { Calendar, Users, Zap, Shield, BarChart3, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const highlights = [
  { icon: Calendar, title: "Event Management", description: "Orchestrate, oversee, and track events with an intuitive command center." },
  { icon: Users, title: "Community Focused", description: "Built meticulously for the modern campus — students, organizers, and administration." },
  { icon: Zap, title: "Real-time Architecture", description: "Live seat availability and instant notifications powered by persistent connections." },
  { icon: Shield, title: "Absolute Security", description: "Enterprise-grade authentication, role-based access, and cryptographic tickets." },
  { icon: BarChart3, title: "Deep Analytics", description: "Comprehensive insights engine for organizers to track and optimize performance." },
  { icon: MapPin, title: "Location Aware", description: "Integrated spatial data and venue intelligence for seamless navigation." },
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-12 py-24 lg:py-32">
      
      {/* Hero */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-24">
        <h1 className="font-semibold text-5xl lg:text-7xl text-surface-950 dark:text-surface-50 mb-6 tracking-tight text-balance">
          The future of <br className="hidden sm:block" /><span className="italic text-brand-600 dark:text-brand-400">campus experiences</span>.
        </h1>
        <p className="text-lg lg:text-xl text-surface-500 max-w-2xl mx-auto leading-relaxed text-balance">
          Evently is a meticulously engineered platform designed to help communities discover, orchestrate, and elevate events with absolute clarity.
        </p>
      </motion.div>

      {/* Mission */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-surface-50 dark:bg-surface-900 border border-border rounded-[2.5rem] p-10 sm:p-16 mb-24 lg:mb-32 shadow-surface relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <h2 className="font-semibold text-3xl lg:text-4xl text-surface-950 dark:text-surface-50 mb-6 relative z-10">Our Philosophy</h2>
        <p className="text-surface-600 dark:text-surface-400 leading-relaxed text-lg max-w-3xl relative z-10 text-balance">
          We believe friction is the enemy of connection. Whether orchestrating a technical summit, a cultural festival, or a quiet academic seminar, the tools should disappear, leaving only the experience. Evently brings everything together into a single, cohesive ecosystem.
        </p>
      </motion.div>

      {/* Features Grid */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mb-24 lg:mb-32">
        <motion.h2 variants={fadeUp} className="font-semibold text-3xl lg:text-4xl text-surface-950 dark:text-surface-50 mb-12 text-center">Engineering & Design</motion.h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.title} variants={fadeUp} className="bg-surface-50 dark:bg-surface-900 rounded-[2rem] border border-border p-8 hover:shadow-surface transition-shadow group">
                <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 border border-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="text-lg font-medium text-surface-950 dark:text-surface-50 mb-3">{item.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Tech Stack */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-24 lg:mb-32">
        <h2 className="font-semibold text-3xl text-surface-950 dark:text-surface-50 mb-8 text-center">The Stack</h2>
        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {["React 19", "Express", "MongoDB", "Tailwind CSS", "Socket.io", "Vite", "Framer Motion", "Recharts"].map((tech) => (
            <div key={tech} className="px-5 py-2.5 rounded-full border border-border bg-surface-50 dark:bg-surface-900 text-sm font-medium text-surface-600 dark:text-surface-400">
              {tech}
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
        <h2 className="font-semibold text-4xl lg:text-5xl text-surface-950 dark:text-surface-50 mb-8">Begin your journey.</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-brand-600 text-white hover:bg-brand-500 px-8 py-4 rounded-full font-medium transition-all hover:scale-[1.02] active:scale-95 shadow-glow">
            Create Account
          </Link>
          <Link to="/explore" className="inline-flex items-center justify-center gap-2 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-50 border border-border hover:bg-surface-100 dark:hover:bg-surface-800 px-8 py-4 rounded-full font-medium transition-all hover:scale-[1.02] active:scale-95 shadow-sm">
            Explore Platform
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
