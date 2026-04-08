import { Plus } from 'lucide-react';

interface Props {
  selected: string;
  onSelect: (val: string) => void;
  onFileClick: () => void;
  presets: string[];
}

export const AvatarSelector = ({ selected, onSelect, onFileClick, presets }: Props) => (
  <div className="space-y-3">
    <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold italic">
      Identidad de Combate
    </label>
    <div className="flex flex-wrap gap-2 justify-start">
      {presets.map(val => (
        <button 
          key={val} type="button"
          onClick={() => onSelect(val)}
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all border ${
            selected === val ? 'border-oro bg-oro/10 shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'border-white/5 bg-white/5 hover:border-white/20'
          }`}
        >
          {val}
        </button>
      ))}
      <button 
        type="button" onClick={onFileClick}
        className={`w-10 h-10 rounded-xl border border-dashed flex items-center justify-center overflow-hidden transition-all ${
          selected.startsWith('data:') ? 'border-oro bg-oro/10' : 'border-white/20 bg-white/5 hover:border-oro/40'
        }`}
      >
        {selected.startsWith('data:') ? <img src={selected} className="w-full h-full object-cover" /> : <Plus className="w-4 h-4 text-white/40" />}
      </button>
    </div>
  </div>
);