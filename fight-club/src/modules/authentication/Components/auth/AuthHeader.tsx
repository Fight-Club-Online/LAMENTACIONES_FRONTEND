import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

export const AuthHeader = () => {
  return (
    <div className="flex flex-col items-center mb-12">
      <div className="w-20 h-20 bg-acero/90 rounded-full flex items-center justify-center mb-6 border border-fuego/30 shadow-[0_0_40px_rgba(255,68,0,0.3)]">
        <Flame className="text-oro animate-pulse" size={42} strokeWidth={1.2} />
      </div>

      <motion.h1 
        initial={{ filter: "blur(20px)", opacity: 0, scale: 0.9 }}
        animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="text-5xl font-black italic text-ceniza tracking-tighter uppercase text-center"
      >
        FIGHT <span className="text-fuego drop-shadow-[0_0_20px_rgba(255,68,0,0.7)]">CLUB</span>
      </motion.h1>
      <p className="text-oro/40 text-[9px] tracking-[0.7em] uppercase font-bold mt-3">Online Battle</p>
    </div>
  )
}