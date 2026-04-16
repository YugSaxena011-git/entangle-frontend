import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSound from 'use-sound'
import Landing from './pages/Landing'
import Chat from './pages/Chat'
import Simulation from './pages/Simulation'
import Analytics from './pages/Analytics'
import useChat from './useChat'
import { MessageSquare, Activity, BarChart3, Radio, TerminalSquare, Power } from 'lucide-react'

const BootSequence = ({ onComplete, playTyping, playPowerUp }) => {
  const [logs, setLogs] = useState([])
  const [progress, setProgress] = useState(0)

  const bootMessages = [
    "Starting up system...",
    "Checking internet connection...",
    "Applying end-to-end encryption...",
    "Securing private chat rooms...",
    "Connecting to servers...",
    "System Ready."
  ]

  useEffect(() => {
    let currentLog = 0
    let progressValue = 0

    const logInterval = setInterval(() => {
      if (currentLog < bootMessages.length) {
        setLogs(prev => [...prev, bootMessages[currentLog]])
        playTyping()
        currentLog++
      }
    }, 400)

    const progressInterval = setInterval(() => {
      progressValue += Math.floor(Math.random() * 15)
      if (progressValue >= 100) {
        progressValue = 100
        clearInterval(progressInterval)

        setTimeout(() => {
          setLogs(prev => [...prev, "WELCOME TO ENTANGLE."])
          playPowerUp()

          setTimeout(onComplete, 1500)
        }, 500)
      }
      setProgress(progressValue)
    }, 120)

    return () => {
      clearInterval(logInterval)
      clearInterval(progressInterval)
    }
  }, [onComplete, playTyping, playPowerUp])

  return (
    <motion.div
      key="boot-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
      transition={{ duration: 1, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-black flex flex-col justify-end p-12 font-mono"
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none opacity-50" />

      <div className="max-w-3xl space-y-2 relative z-10">
        <div className="mb-8 flex items-center gap-4 text-indigo-500">
          <TerminalSquare className="animate-pulse" size={32} />
          <span className="text-2xl font-bold tracking-widest uppercase">Connecting...</span>
        </div>

        {logs.map((log, index) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} key={index}
            className={`text-sm md:text-base ${log === "WELCOME TO ENTANGLE." ? "text-emerald-400 font-bold text-xl mt-8 animate-pulse" : "text-indigo-300"}`}
          >
            {`> ${log}`}
          </motion.div>
        ))}

        <div className="mt-12 pt-8 border-t border-indigo-900/50 flex items-center gap-6">
          <div className="flex-1 h-1 bg-indigo-950 rounded-full overflow-hidden">
            <motion.div className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]" animate={{ width: `${progress}%` }} />
          </div>
          <span className="text-indigo-400 w-16 text-right font-bold">{progress}%</span>
        </div>
      </div>
    </motion.div>
  )
}

const VideoBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-black">
      <video autoPlay loop muted playsInline className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover opacity-30" style={{ filter: "brightness(0.7) contrast(1.2)" }}>
        <source src="/bg-video.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(#ffffff03_1px,transparent_1px),linear-gradient(90deg,#ffffff03_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute inset-0 mix-blend-overlay opacity-10 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
    </div>
  )
}

export default function App() {
  const [hasStarted, setHasStarted] = useState(false)
  const [isBooting, setIsBooting] = useState(true)
  const [currentPage, setCurrentPage] = useState('home')

  const chat = useChat()

  const [playClick] = useSound('/sounds/click.mp3', { volume: 0.25 })
  const [playHover] = useSound('/sounds/hover.mp3', { volume: 0.15 })
  const [playTyping] = useSound('/sounds/typing.mp3', { volume: 0.15, interrupt: false })
  const [playPowerUp] = useSound('/sounds/powerup.mp3', { volume: 0.4 })

  const handlePageChange = (pageId) => {
    playClick()
    setCurrentPage(pageId)
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono selection:bg-indigo-500/40">
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            playClick()
            setHasStarted(true)
          }}
          className="flex flex-col items-center gap-6 text-indigo-500 hover:text-indigo-400 transition-colors p-12 rounded-3xl border border-indigo-900/50 hover:border-indigo-500/50 bg-indigo-950/20"
        >
          <Power size={64} className="animate-pulse" />
          <span className="text-xl tracking-[0.5em] font-bold">START SYSTEM</span>
        </motion.button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-indigo-500/40 text-slate-300 relative overflow-x-hidden bg-black">
      <AnimatePresence mode="wait">
        {isBooting ? (
          <BootSequence
            onComplete={() => setIsBooting(false)}
            playTyping={playTyping}
            playPowerUp={playPowerUp}
          />
        ) : (
          <motion.div
            key="main-app"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
            className="flex-1 flex flex-col relative z-10 w-full min-h-screen"
          >
            <VideoBackground />

            <nav className="border-b border-white/5 bg-black/40 backdrop-blur-3xl sticky top-0 z-50">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse" />
              <div className="w-full px-8 lg:px-16 h-20 flex items-center justify-between">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => handlePageChange('home')}
                  onMouseEnter={playHover}
                >
                  <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                    <Radio className="text-indigo-500 group-hover:animate-spin" size={20} />
                  </div>
                  <span className="text-xl font-bold tracking-[0.4em] text-white drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                    ENTANGLE
                  </span>
                </motion.div>

                <div className="flex gap-8 md:gap-12 font-mono">
                  {[
                    { id: 'chat', icon: <MessageSquare size={14} />, label: 'SECURE CHAT' },
                    { id: 'simulation', icon: <Activity size={14} />, label: 'HOW IT WORKS' },
                    { id: 'analytics', icon: <BarChart3 size={14} />, label: 'DASHBOARD' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handlePageChange(item.id)}
                      onMouseEnter={playHover}
                      className={`group relative flex items-center gap-2 uppercase text-[10px] md:text-[11px] tracking-[0.2em] transition-all py-2 ${currentPage === item.id ? 'text-white' : 'text-slate-500 hover:text-indigo-400'}`}
                    >
                      <span className="hidden md:block">{item.icon}</span>
                      {item.label}
                      {currentPage === item.id && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute -bottom-1 left-0 right-0 h-[2px] bg-indigo-500 shadow-[0_0_15px_#6366f1]"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </nav>

            <main className="flex-1 w-full px-8 lg:px-16 py-12 flex flex-col relative z-10">
              <div className={currentPage === 'home' ? 'block flex-1' : 'hidden'}>
                <Landing setPage={setCurrentPage} />
              </div>

              <div className={currentPage === 'chat' ? 'block flex-1' : 'hidden'}>
                <Chat chat={chat} />
              </div>

              <div className={currentPage === 'simulation' ? 'block flex-1' : 'hidden'}>
                <Simulation />
              </div>

              <div className={currentPage === 'analytics' ? 'block flex-1' : 'hidden'}>
                <Analytics chat={chat} />
              </div>
            </main>

            <div className="fixed top-24 left-6 flex flex-col gap-2 opacity-30">
              <div className="w-8 h-[1px] bg-indigo-500" />
              <div className="w-[1px] h-8 bg-indigo-500" />
            </div>
            <div className="fixed bottom-8 right-12 flex items-center gap-4 text-[10px] font-mono text-slate-600 tracking-widest uppercase bg-black/20 p-2 rounded border border-white/5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              STATUS: ONLINE
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}