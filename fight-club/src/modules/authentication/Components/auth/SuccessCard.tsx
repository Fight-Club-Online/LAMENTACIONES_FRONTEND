import { motion } from 'framer-motion'
import { ShieldCheck, ArrowRight } from 'lucide-react'

interface SuccessCardProps {
  onConfirm: () => void;
}

export const SuccessCard = ({ onConfirm }: SuccessCardProps) => (
  <div className="flex flex-col items-center py-10 px-2 w-full">
    {/* Icono con Aura */}
    <div className="relative mb-10 flex justify-center w-full">
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute inset-0 bg-fuego/30 blur-[60px] rounded-full" 
      />
      
      <motion.div 
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative bg-[#1a1a1a] border-2 border-fuego/50 p-8 rounded-full shadow-[0_0_60px_rgba(226,81,39,0.4)]"
      >
        <motion.div
          animate={{ opacity: [1, 0.6, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ShieldCheck className="text-fuego" size={80} strokeWidth={1.5} />
        </motion.div>
      </motion.div>
    </div>
    
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex flex-col items-center text-center w-full mb-12"
    >
      <h2 className="text-3xl font-black text-white uppercase tracking-[0.4em] drop-shadow-lg mb-4">
        ¡ACCESO CONCEDIDO!
      </h2>
      
      <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-fuego to-transparent mb-6" />
      
      <p className="text-white/50 text-[11px] font-bold uppercase tracking-[0.3em] max-w-[300px] leading-relaxed text-center mx-auto">
        Tu perfil ha sido validado. <br />
        Prepárate para el combate en La Arena.
      </p>
    </motion.div>

    {/* Botón */}
    <motion.button 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      onClick={onConfirm}
      className="group w-full max-w-[320px] bg-white text-black font-black py-5 rounded-xl flex items-center justify-center gap-3 hover:bg-fuego hover:text-white transition-all duration-500 uppercase tracking-[0.3em] text-[13px] shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer active:scale-95"
    >
      <span>Entrar al Arena</span>
      <ArrowRight 
        className="group-hover:translate-x-2 transition-transform duration-300 text-fuego group-hover:text-white" 
        size={20} 
      />
    </motion.button>
  </div>
)