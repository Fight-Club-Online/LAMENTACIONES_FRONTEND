import React, { useState, useRef} from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock } from 'lucide-react';
import { useRegister } from '../../Hooks/useRegister';

import { AvatarSelector } from './AvatarSelector';
import { FormInput } from './FormInput';
import { SuccessCard } from '../auth/SuccessCard';
import { ErrorToast } from '../ui/ErrorToast';

const PRESET_AVATARS = ['👊', '🥷', '🤼', '😈', '🦁', '🐉', '💀', '⚡'];

export const RegisterForm = () => {
    const { register, isLoading, isSuccess, profileRoute, error, setError } = useRegister();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [form, setForm] = useState({
        username: '', 
        email: '', 
        password: '', 
        confirmPassword: '', 
        avatarURL: PRESET_AVATARS[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (form.password !== form.confirmPassword) {
            setError("Las contraseñas no coinciden, combatiente.");
            return;
        }

        if (form.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        const { confirmPassword, ...submitData } = form;
        // Llamamos a register, el hook se encarga del localStorage
        await register(submitData);
    };

    // Si el registro fue exitoso, mostramos la tarjeta de éxito
    if (isSuccess) {
        return (
            <SuccessCard 
            onConfirm={() => navigate(profileRoute)}
            />
        );
    }

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-6">
            <AvatarSelector 
                selected={form.avatarURL}
                presets={PRESET_AVATARS}
                onSelect={(val) => setForm({...form, avatarURL: val})}
                onFileClick={() => fileInputRef.current?.click()}
            />
            
            <input 
                type="file" 
                ref={fileInputRef} 
                hidden 
                accept="image/*" 
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setForm(prev => ({ ...prev, avatarURL: reader.result as string }));
                        reader.readAsDataURL(file);
                    }
                }} 
            />

            <div className="space-y-4">
                <FormInput 
                    label="Nombre de Usuario" 
                    icon={User} 
                    type="text" 
                    placeholder="Tu nombre de guerra" 
                    onChange={e => setForm({...form, username: e.target.value})} 
                />
                <FormInput 
                    label="Correo Electrónico" 
                    icon={Mail} 
                    type="email" 
                    placeholder="combate@ejemplo.com" 
                    onChange={e => setForm({...form, email: e.target.value})} 
                />
                <FormInput 
                    label="Contraseña" 
                    icon={Lock} 
                    type="password" 
                    placeholder="••••••••" 
                    onChange={e => setForm({...form, password: e.target.value})} 
                />
                <FormInput 
                    label="Confirmar Contraseña" 
                    icon={Lock} 
                    type="password" 
                    placeholder="••••••••" 
                    onChange={e => setForm({...form, confirmPassword: e.target.value})} 
                />
            </div>


            <ErrorToast message={error} onDismiss={() => setError(null)} />

            <div className="pt-4">
                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-[#d94826] to-[#bc3a1d] text-white font-bold uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-black/40 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {isLoading ? 'ENLISTANDO...' : 'UNIRSE AL COMBATE'}
                </button>
            </div>
        </form>
    );
};