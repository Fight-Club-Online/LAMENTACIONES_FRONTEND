import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { SuccessCard } from './SuccessCard'
import { useLogin } from '../../Hooks/useLogin'
import { useNavigate } from 'react-router-dom'
import { ErrorToast } from '../ui/ErrorToast'

export const LoginForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false)
  const { email, setEmail, password, setPassword, isLoading, isSuccess, profileRoute, error, handleSubmit } = useLogin()

  if (isSuccess) {
    return (
      <SuccessCard 
        onConfirm={() => navigate(profileRoute)} 
      />
    );
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <Header ArenaLabel="Acceso al Arena" />
      
       <ErrorToast message={error} /> 

      <InputField 
        label="Correo Electrónico" 
        icon={<Mail size={20}/>} 
        type="email" 
        value={email} 
        onChange={setEmail} 
        placeholder="combatiente@eci.edu.co" 
      />

      <div className="space-y-3">
        <label className="text-[11px] uppercase text-white/90 tracking-[0.2em] font-black ml-1">Contraseña</label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-fuego" size={20} />
          <input 
            required 
            type={showPassword ? "text" : "password"} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#161616] border border-white/10 rounded-xl py-5 pl-14 pr-14 text-white outline-none focus:border-fuego/60 transition-all"
            placeholder="••••••••••••"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-fuego">
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <button 
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-[#E25127] to-[#FF5722] text-white font-black py-5 rounded-xl shadow-lg hover:scale-[1.01] transition-all uppercase tracking-[0.3em] disabled:opacity-50"
      >
        {isLoading ? "Validando Combatiente..." : "Entrar al Combate"}
      </button>
    </form>
  )
}


const Header = ({ ArenaLabel }: { ArenaLabel: string }) => (
  <div className="relative py-2 text-center">
    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
    <span className="relative bg-[#12100e] px-4 text-[12px] uppercase text-white/60 tracking-[0.4em] font-black">{ArenaLabel}</span>
  </div>
)

const InputField = ({ label, icon, type, value, onChange, placeholder }: any) => (
  <div className="space-y-3">
    <label className="text-[11px] uppercase text-white/90 tracking-[0.2em] font-black ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-fuego transition-colors">{icon}</div>
      <input 
        required type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#161616] border border-white/10 rounded-xl py-5 pl-14 pr-4 text-white outline-none focus:border-fuego/60 transition-all"
        placeholder={placeholder}
      />
    </div>
  </div>
)