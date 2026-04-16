import { Shield, Key, AlertTriangle, CheckCircle, ArrowRight, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Landing({ setPage }) {
  const features = [
    { icon: <Shield size={24} className="text-emerald-400" />, title: "Absolute Secrecy", desc: "End-to-end quantum-resistant AES-256 GCM encryption protocols." },
    { icon: <Key size={24} className="text-indigo-400" />, title: "Ephemeral Keys", desc: "Dynamic key generation that self-destructs after session termination." },
    { icon: <AlertTriangle size={24} className="text-red-400" />, title: "Intrusion Detection", desc: "Real-time alerts on eavesdropping via wave function monitoring." },
    { icon: <CheckCircle size={24} className="text-violet-400" />, title: "Zero-Knowledge", desc: "Cryptographic proof of authenticity without revealing payload data." },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80 } }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-12 relative">
      
      <div className="text-center w-full max-w-5xl space-y-8 mb-20 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-xs uppercase tracking-widest mb-4"
        >
          <Zap size={14} className="text-indigo-400 animate-pulse" /> V 3.1.2 Online
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="text-6xl md:text-8xl font-bold tracking-tighter"
        >
          Unbreakable <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 animate-pulse-slow">
            Entanglement.
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.4 }}
          className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light"
        >
          A next-generation communication protocol built on quantum physics. Measure the unmeasurable. Secure the future.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-6 pt-8"
        >
          <button onClick={() => setPage('chat')} className="group relative px-8 py-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-sm overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]">
            <span className="relative z-10 flex items-center gap-2">Initialize Comm <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></span>
          </button>
          <button onClick={() => setPage('simulation')} className="px-8 py-4 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 backdrop-blur-md rounded-xl font-bold uppercase tracking-widest text-sm text-white transition-all hover:scale-105">
            Run Diagnostics
          </button>
        </motion.div>
      </div>

      <motion.div 
        variants={containerVariants} initial="hidden" animate="show"
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto z-10"
      >
        {features.map((f, i) => (
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.05)" }}
            key={i} 
            className="p-8 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5 transition-colors group relative overflow-hidden"
          >
            {/* Subtle inner hover glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
            
            <div className="mb-6 bg-white/5 w-14 h-14 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-indigo-500/50 transition-colors">
              {f.icon}
            </div>
            <h3 className="text-xl font-bold mb-3 tracking-wide">{f.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}