import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { BackgroundRays } from '../Components/ui/BackgroundRays';
import { AuthHeader } from '../Components/auth/AuthHeader';
import { LoginForm } from '../Components/auth/LoginForm';
import { SocialAuth } from '../Components/auth/SocialAuth';

export const LoginPage: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#080706]">
      
      {/* 1. Fondo y Efectos Visuales */}
      <div className="absolute inset-0 pointer-events-none">
        <BackgroundRays />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 z-0" />
      </div>

      {/* 2. Tarjeta de Login */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-[92%] max-w-[820px] min-h-[780px] py-16 px-8 sm:px-12 bg-[#12100e]/40 border border-white/10 rounded-[3.5rem] backdrop-blur-2xl shadow-[0_0_120px_rgba(0,0,0,0.9)] flex flex-col justify-center"
      >
        <AuthHeader />
        
        <div className="space-y-8">
          <LoginForm />
          
          <div className="relative">
            <SocialAuth />
          </div>
          
          {/* Footer de la tarjeta */}
          <footer className="text-center pt-8 border-t border-white/5">
            <p>
              <span className="text-[12px] text-white/40 uppercase tracking-[0.2em] font-bold">
                ¿Sin cuenta aún?{" "}
              </span>
              <Link 
                to="/register" 
                className="text-[12px] text-oro uppercase tracking-[0.2em] font-black hover:text-fuego transition-all duration-300 underline underline-offset-8 decoration-fuego/40 hover:decoration-fuego"
              >
                Regístrate ahora
              </Link>
            </p>
            <p>
              <Link to="/guest" className="text-[11px] text-white/30 uppercase tracking-[0.2em] font-bold hover:text-white/60 transition-all">
              Entrar como invitado →
              </Link>
            </p>
          </footer>
        </div>
      </motion.div>
    </div>
  );
};