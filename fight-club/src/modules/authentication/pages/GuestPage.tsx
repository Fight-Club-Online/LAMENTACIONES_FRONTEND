import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BackgroundRays } from '../Components/ui/BackgroundRays';
import { GuestForm } from '../Components/register/GuestForm';

export const GuestPage = () => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden py-10">
      <div className="absolute inset-0 bg-[#080706] -z-20" />
      <BackgroundRays />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 z-0 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-[92%] max-w-[480px] py-16 px-8 bg-[#12100e]/40 border border-white/10 rounded-[3.5rem] backdrop-blur-2xl shadow-[0_0_120px_rgba(0,0,0,0.9)]"
      >
        <div className="absolute top-10 left-10">
          <Link to="/login" className="group flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold hover:text-white transition-colors">
            <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span> Volver
          </Link>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-tighter italic">MODO INVITADO</h1>
          <p className="text-white/40 text-[10px] tracking-[0.5em] font-bold uppercase mt-2">Acceso temporal</p>
        </div>

        <GuestForm />

        <p className="text-center mt-8 text-[11px] text-white/40 uppercase tracking-widest font-bold">
          ¿Quieres una cuenta permanente?{' '}
          <Link to="/register" className="text-oro hover:text-fuego transition-colors font-black ml-1">Regístrate</Link>
        </p>
      </motion.div>
    </div>
  );
};