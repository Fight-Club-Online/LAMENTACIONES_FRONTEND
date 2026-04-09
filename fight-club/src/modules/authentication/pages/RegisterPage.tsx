import { motion } from 'framer-motion'
import { BackgroundRays } from '../Components/ui/BackgroundRays'
import { RegisterForm } from '../Components/register/RegisterForm'
import { Link } from 'react-router-dom'

export const RegisterPage = () => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden py-10">
      <div className="absolute inset-0 bg-[#080706] -z-20"></div>
      <BackgroundRays />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 z-0 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-[92%] max-w-[820px] min-h-[780px] py-16 px-8 sm:px-12 bg-[#12100e]/40 border border-white/10 rounded-[3.5rem] backdrop-blur-2xl shadow-[0_0_120px_rgba(0,0,0,0.9)] flex flex-col justify-center"
      >
        {/* BOTÓN VOLVER - Posicionado arriba a la izquierda */}
        <div className="absolute top-10 left-10">
          <Link 
            to="/login" 
            className="group flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold hover:text-white transition-colors"
          >
            <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span> 
            Volver
          </Link>
        </div>

        <div className="text-center mb-10">
            <h1 className="text-5xl font-black text-white tracking-tighter italic">FIGHT CLUB</h1>
            <p className="text-oro text-[10px] tracking-[0.5em] font-bold uppercase mt-2">Crea tu cuenta</p>
        </div>

        {/* Formulario del registro*/}
        <div className="w-full max-w-[480px] mx-auto">
          <RegisterForm />

          <p className="text-center mt-10 pt-8 border-t border-white/5 text-[11px] text-white/40 uppercase tracking-widest font-bold">
              ¿Ya tienes cuenta? <Link to="/login" className="text-oro hover:text-fuego transition-colors ml-2 font-black">Iniciar Sesión</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}