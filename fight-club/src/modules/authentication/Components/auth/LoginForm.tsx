import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { SuccessCard } from './SuccessCard'
import { useLogin } from '../../Hooks/useLogin'
import { useNavigate } from 'react-router-dom'
import { ErrorToast } from '../ui/ErrorToast'

export const LoginForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false)
  const [isBlinking, setIsBlinking] = useState(false) 

  const { email, setEmail, password, setPassword, isLoading, isSuccess, profileRoute, error, handleSubmit } = useLogin()

  const togglePassword = () => {
    setIsBlinking(true)
    setShowPassword(!showPassword)
    setTimeout(() => setIsBlinking(false), 300)
  }

  if (isSuccess) {
    return (
      <SuccessCard 
        onConfirm={() => navigate(profileRoute)} 
      />
    );
  }

  return (
    <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
      <Header ArenaLabel="Acceso al Arena" />
      
       <ErrorToast message={error} /> 

      <InputField 
        label="Correo Electrónico" 
        icon={<Mail size={18} className="sm:size-5"/>} 
        type="email" 
        value={email} 
        onChange={setEmail} 
        placeholder="combatiente@eci.edu.co" 
      />

      <div className="space-y-2 sm:space-y-3">
        <label className="text-[10px] sm:text-[11px] uppercase text-white/90 tracking-[0.2em] font-black ml-1">
          Contraseña
        </label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-fuego transition-colors size-[18px] sm:size-[20px]" />
          <input 
            required 
            type={showPassword ? "text" : "password"} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            // py-4 en móvil, py-5 en desktop. Texto más pequeño en móvil.
            className="w-full bg-[#161616] border border-white/10 rounded-xl py-4 sm:py-5 pl-12 sm:pl-14 pr-12 sm:pr-14 text-sm sm:text-base text-white outline-none focus:border-fuego/60 transition-all placeholder:text-white/20"
            placeholder="••••••••••••"
          />
          
          <button 
            type="button" 
            onClick={togglePassword} 
            className={`absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-fuego cursor-pointer transition-all ${isBlinking ? 'animate-blink' : ''}`}
          >
            {showPassword ? <Eye size={18} className="sm:size-5" /> : <EyeOff size={18} className="sm:size-5" />}
          </button>
        </div>
      </div>

      <button 
        disabled={isLoading}
        // Botón más compacto en móvil (py-4) y texto un poco más pequeño (text-xs)
        className="w-full bg-gradient-to-r from-[#E25127] to-[#FF5722] text-white font-black py-4 sm:py-5 rounded-xl shadow-lg hover:scale-[1.01] hover:brightness-110 active:scale-[0.98] transition-all uppercase tracking-[0.2em] sm:tracking-[0.3em] text-xs sm:text-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {isLoading ? "Validando..." : "Entrar al Combate"}
      </button>
    </form>
  )
}

const Header = ({ ArenaLabel }: { ArenaLabel: string }) => (
  <div className="relative py-2 text-center">
    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
    {/* Texto más pequeño en móvil */}
    <span className="relative bg-[#12100e] px-4 text-[10px] sm:text-[12px] uppercase text-white/60 tracking-[0.3em] sm:tracking-[0.4em] font-black">
      {ArenaLabel}
    </span>
  </div>
)

const InputField = ({ label, icon, type, value, onChange, placeholder }: any) => (
  <div className="space-y-2 sm:space-y-3">
    <label className="text-[10px] sm:text-[11px] uppercase text-white/90 tracking-[0.2em] font-black ml-1">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-fuego transition-colors">
        {icon}
      </div>
      <input 
        required type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#161616] border border-white/10 rounded-xl py-4 sm:py-5 pl-12 sm:pl-14 pr-4 text-sm sm:text-base text-white outline-none focus:border-fuego/60 transition-all placeholder:text-white/20"
        placeholder={placeholder}
      />
    </div>
  </div>
)