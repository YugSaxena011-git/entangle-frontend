import { useState } from 'react'
import { ShieldAlert, ShieldCheck, Terminal, Send, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import useSound from 'use-sound'

export default function Chat() {
  const [inputValue, setInputValue] = useState('')
  
  // --- AUDIO HOOKS ---
  const [playTyping] = useSound('/sounds/typing.mp3', { volume: 0.1, interrupt: false })
  const [playClick] = useSound('/sounds/click.mp3', { volume: 0.3 }) // Heavier sound for sending

  // --- BOUNDARY CASE HANDLING ---
  const handleKeyDown = (e) => {
    // 1. Prevent "Machine Gun" audio if the user holds down a key
    if (e.repeat) return

    // 2. Define all keys that should be completely silent
    const silentKeys = [
      'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 
      'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
    ]
    if (silentKeys.includes(e.key)) return

    // 3. Prevent backspace sound if the input is already empty
    if (e.key === 'Backspace' && inputValue.length === 0) return

    // 4. If they press Enter, handle the send logic instead of typing sound
    if (e.key === 'Enter') {
      handleSendMessage()
      return
    }

    // If it passes all the checks above, play the typing sound!
    playTyping()
  }

  const handleSendMessage = () => {
    // Prevent sending if the box is empty or just spaces
    if (inputValue.trim().length === 0) return

    // Play the satisfying click sound
    playClick()
    
    // Clear the input box
    setInputValue('')
    
    // (In a real app, you would add the message to the chat array here)
  }

  const messages = [
    { id: 1, text: "Initiating quantum handshake sequence...", type: "system", sender: "SYS_ROOT", time: "00:00:01" },
    { id: 2, text: "Handshake confirmed. QKD Keys exchanged.", type: "verified", sender: "SYS_ROOT", time: "00:00:04" },
    { id: 3, text: "Alpha protocol requires immediate update.", type: "priority", sender: "ALICE_NODE", time: "00:01:12" },
    { id: 4, text: "Understood. Encrypting payload data.", type: "normal", sender: "BOB_NODE", time: "00:01:45" },
    { id: 5, text: "CRITICAL: Payload integrity check failed. Superposition collapsed by third party.", type: "tampered", sender: "SYS_ROOT", time: "00:02:11" },
  ]

  const getMessageStyle = (type) => {
    switch(type) {
      case 'verified': return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200'
      case 'tampered': return 'border-red-500/50 bg-red-500/10 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
      case 'priority': return 'border-indigo-500/50 bg-indigo-500/10 text-indigo-200'
      case 'system': return 'border-white/10 bg-white/5 text-slate-400 font-mono text-xs uppercase'
      default: return 'border-slate-700/50 bg-slate-800/30 text-slate-200'
    }
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col lg:flex-row gap-8 w-full max-w-7xl mx-auto">
      
      {/* Sidebar - Terminal Status */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5">
          <div className="flex items-center gap-2 mb-6 text-indigo-400">
            <Terminal size={18} />
            <h3 className="text-xs font-mono uppercase tracking-widest font-bold">Session Link</h3>
          </div>
          <div className="flex items-center bg-black/50 border border-slate-700 rounded-lg p-1">
            <span className="text-indigo-500 font-mono px-3">{`>`}</span>
            <input type="text" placeholder="Enter Room ID" className="w-full bg-transparent p-2 text-white font-mono text-sm focus:outline-none placeholder:text-slate-600" />
          </div>
          <button className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-mono text-xs uppercase tracking-widest transition-all text-white">Execute Connect</button>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5 flex-1 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
          <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-slate-500 mb-6">Security State</h3>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <ShieldCheck className="text-emerald-400 mt-1 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]" size={24} />
              <div>
                <p className="text-emerald-400 font-bold uppercase tracking-wider text-sm">Line Secured</p>
                <p className="text-slate-500 text-xs font-mono mt-1">AES-GCM Active</p>
              </div>
            </div>
            <div className="flex items-start gap-4 pt-6 border-t border-white/5">
              <ShieldAlert className="text-red-400 mt-1 drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]" size={24} />
              <div>
                <p className="text-red-400 font-bold uppercase tracking-wider text-sm">Threats</p>
                <p className="text-slate-500 text-xs font-mono mt-1">1 Collapse Detected</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Chat Display */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
        
        {/* Chat Area */}
        <div className="flex-1 p-8 overflow-y-auto space-y-6 flex flex-col">
          {messages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              key={msg.id} 
              className={`flex flex-col max-w-[80%] ${msg.sender === 'BOB_NODE' ? 'self-end items-end' : 'self-start items-start'}`}
            >
              <div className="flex items-center gap-3 mb-2 px-1">
                <span className="text-[10px] font-mono text-indigo-400">[{msg.time}]</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{msg.sender}</span>
              </div>
              <div className={`px-5 py-3 rounded-xl border backdrop-blur-sm text-sm ${getMessageStyle(msg.type)}`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Input Area */}
        <div className="p-4 bg-black/60 border-t border-white/5">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2 pr-2 focus-within:border-indigo-500/50 transition-colors">
            <Lock size={16} className="text-slate-500 ml-3" />
            
            <input 
              type="text" 
              maxLength={200} // Bonus Boundary Case: Max 200 characters
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown} 
              placeholder="Draft encrypted transmission..." 
              className="flex-1 bg-transparent px-2 py-2 focus:outline-none text-sm text-white font-mono placeholder:text-slate-600"
            />
            
            <button 
              onClick={handleSendMessage}
              className="bg-indigo-600 hover:bg-indigo-500 p-3 rounded-lg text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)]"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </motion.div>

    </div>
  )
}