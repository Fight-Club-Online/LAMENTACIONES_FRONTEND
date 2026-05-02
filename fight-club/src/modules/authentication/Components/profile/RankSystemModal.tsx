import { useState } from 'react'
import { Trophy, X, ZoomIn } from 'lucide-react'
import rankImage from '../../../../assets/rank-system.png'

export const RankSystemModal = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* BOTÓN */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full bg-gradient-to-r 
          from-orange-500/10 to-yellow-500/10 border border-orange-500/30 
          hover:border-orange-500/60 rounded-xl px-4 py-3 transition-all 
          group cursor-pointer"
      >
        <Trophy size={14} className="text-orange-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] 
          text-white/60 group-hover:text-white/90 transition-colors">
          Ver Sistema de Rangos
        </span>
        <ZoomIn size={12} className="text-orange-500/50 ml-auto" />
      </button>

      {/* MODAL */}
      {open && (
        <div
          className="fixed inset-0 z-[999] flex items-center 
            justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-4 -right-4 z-10 bg-orange-600 
                hover:bg-orange-500 text-white rounded-full p-2 
                transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
            <img
              src={rankImage}
              alt="Sistema de Rangos Fight Club"
              className="w-full rounded-2xl shadow-2xl border 
                border-orange-500/20"
            />
          </div>
        </div>
      )}
    </>
  )
}