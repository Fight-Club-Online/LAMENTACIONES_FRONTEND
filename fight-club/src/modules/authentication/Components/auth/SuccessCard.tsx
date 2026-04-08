import { ShieldCheck, ArrowRight } from 'lucide-react'

interface SuccessCardProps {
  onConfirm: () => void;
}

export const SuccessCard = ({ onConfirm }: SuccessCardProps) => (
  <div className="flex flex-col items-center py-10 px-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="relative mb-8">
      <div className="absolute inset-0 bg-fuego/20 blur-3xl rounded-full" />
      <div className="relative bg-[#161616] border-2 border-fuego p-8 rounded-full shadow-[0_0_50px_rgba(226,81,39,0.3)]">
        <ShieldCheck className="text-fuego" size={70} />
      </div>
    </div>
    
    <div className="text-center space-y-4 mb-10">
      <h2 className="text-3xl font-black text-white uppercase tracking-[0.4em]">¡USUARIO CONECTADO!</h2>
      <div className="h-1 w-20 bg-fuego mx-auto rounded-full" />
      <p className="text-white/60 text-[11px] font-bold uppercase tracking-[0.3em] max-w-[250px] leading-relaxed">
        Tu perfil ha sido validado. La Arena te espera, combatiente.
      </p>
    </div>

    <button 
      onClick={onConfirm}
      className="group w-full bg-white text-black font-black py-5 rounded-xl flex items-center justify-center gap-3 hover:bg-fuego hover:text-white transition-all duration-300 uppercase tracking-[0.3em] text-[14px] shadow-xl"
    >
      Vale, entrar al Arena
      <ArrowRight className="group-hover:translate-x-2 transition-transform" size={20} />
    </button>
  </div>
)