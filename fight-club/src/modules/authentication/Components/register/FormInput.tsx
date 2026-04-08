import React, { useState } from 'react';
import { type LucideIcon, Eye, EyeOff } from 'lucide-react';

interface Props {
  label: string;
  icon: LucideIcon;
  type: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FormInput = ({ label, icon: Icon, type, placeholder, onChange }: Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] text-white/40 uppercase tracking-[0.1em] ml-1">
        {label}
      </label>
      <div className="relative group">
        {/* Icono Principal */}
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-oro transition-colors" />
        
        <input 
          type={inputType} 
          placeholder={placeholder} 
          className="w-full bg-[#1a1816] border border-white/5 p-4 pl-12 pr-12 rounded-xl text-sm text-white outline-none focus:border-white/20 focus:bg-[#22201e] transition-all"
          onChange={onChange}
          required
        />

        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};