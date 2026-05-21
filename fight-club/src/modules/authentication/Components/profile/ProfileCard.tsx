import { useState, useEffect, useRef } from 'react';
import { MapPin, Settings, Save, X, Shield } from 'lucide-react';
import type { UserProfile } from '../../types/dashboard.types';
import { ErrorToast } from '../ui/ErrorToast';
import { getUserData } from '../../../Lobby/Types/localUserData';

interface ProfileCardProps {
    profile: UserProfile | null;
    onUpdate: (newData: Partial<UserProfile>) => Promise<void>;
    isAdmin?: boolean;
}

export const ProfileCard = ({ profile, onUpdate, isAdmin = false }: ProfileCardProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<UserProfile>>({});
    const [saveError, setSaveError] = useState<string | null>(null);
    const [imageMode, setImageMode] = useState<'url' | 'file'>('url');
    const fileRef = useRef<HTMLInputElement>(null);

    // email viene del localStorage, no de UserProfile
    const email = getUserData()?.email ?? '—';

    useEffect(() => {
        if (profile) setFormData(profile);
    }, [profile]);

    const handleSave = async () => {
        try {
            await onUpdate(formData);
            setIsEditing(false);
            setSaveError(null);
        } catch {
            setSaveError('No se pudo actualizar el perfil');
        }
    };

    if (!profile && !isEditing) {
        return (
            <div className="bg-[#161616] border border-white/5 rounded-2xl p-6 animate-pulse flex flex-col items-center">
                <div className="w-28 h-28 bg-white/5 rounded-2xl mb-4" />
                <div className="h-6 w-32 bg-white/5 rounded mb-2" />
                <div className="h-4 w-24 bg-white/5 rounded" />
            </div>
        );
    }

    return (
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-6 relative overflow-hidden group shadow-2xl">

            {/* Franja naranja superior solo para admin */}
            {isAdmin && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-600 via-orange-400 to-transparent" />
            )}

            {/* Botón editar: oculto para admin */}
            {!isAdmin && (
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="absolute top-4 right-4 z-10 p-2 hover:bg-white/10 rounded-full transition-all duration-300"
                    title={isEditing ? 'Cancelar' : 'Editar Perfil'}
                >
                    {isEditing
                        ? <X size={18} className="text-white/50 hover:text-white" />
                        : <Settings size={18} className="text-white/20 group-hover:text-orange-500 transition-colors" />
                    }
                </button>
            )}

            {/* Modo edición (solo jugadores) */}
            {!isAdmin && isEditing ? (
                <div className="space-y-4 pt-4 animate-in fade-in zoom-in duration-300">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-2">Editar Guerrero</h3>

                    <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-white/30 ml-1">Nombre de combate</label>
                        <input
                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-orange-500 outline-none transition-all"
                            value={formData.username || ''}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-white/30 ml-1">Manifiesto (Bio)</label>
                        <textarea
                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm h-20 focus:border-orange-500 outline-none transition-all resize-none"
                            value={formData.bio || ''}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-white/30 ml-1">Foto de perfil</label>

                        <div className="flex gap-2 mb-2">
                            <button
                                type="button"
                                onClick={() => setImageMode('url')}
                                className={`text-[9px] uppercase font-black px-3 py-1.5 rounded-lg transition-all ${
                                    imageMode === 'url'
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-white/5 text-white/40'
                                }`}
                            >
                                URL
                            </button>

                            <button
                                type="button"
                                onClick={() => setImageMode('file')}
                                className={`text-[9px] uppercase font-black px-3 py-1.5 rounded-lg transition-all ${
                                    imageMode === 'file'
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-white/5 text-white/40'
                                }`}
                            >
                                Subir archivo
                            </button>
                        </div>

                        {imageMode === 'url' ? (
                            <input
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-orange-500 outline-none transition-all"
                                placeholder="https://..."
                                value={formData.avatarURL || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        avatarURL: e.target.value,
                                    })
                                }
                            />
                        ) : (
                            <div>
                                <input
                                    type="file"
                                    ref={fileRef}
                                    hidden
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];

                                        if (!file || !profile?.userId) return;

                                        const reader = new FileReader();

                                        reader.onloadend = () => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                avatarURL: reader.result as string,
                                            }));
                                        };

                                        reader.readAsDataURL(file);

                                        try {
                                            const formDataUpload = new FormData();
                                            formDataUpload.append('file', file);

                                            const token = localStorage.getItem('fight_club_token');

                                            const res = await fetch(
                                                `${import.meta.env.VITE_API_URL}/api/v1/users/${profile.userId}/avatar`,
                                                {
                                                    method: 'POST',
                                                    headers: {
                                                        Authorization: `Bearer ${token}`,
                                                    },
                                                    body: formDataUpload,
                                                }
                                            );

                                            const data = await res.json();

                                            setFormData((prev) => ({
                                                ...prev,
                                                avatarURL: data.avatarURL,
                                            }));

                                            localStorage.setItem(
                                                'player_avatar',
                                                data.avatarURL
                                            );
                                        } catch {
                                            setSaveError(
                                                'No se pudo subir la imagen al servidor'
                                            );
                                        }
                                    }}
                                />

                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    className="w-full bg-black border border-dashed border-white/20 rounded-xl p-3 text-[10px] text-white/40 hover:border-orange-500/40 hover:text-white/60 transition-all uppercase tracking-widest font-bold"
                                >
                                    {formData.avatarURL
                                        ? '✓ Imagen cargada'
                                        : 'Seleccionar imagen'}
                                </button>

                                {formData.avatarURL && (
                                    <img
                                        src={formData.avatarURL}
                                        className="w-16 h-16 rounded-xl object-cover mt-2 border border-orange-500/30"
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    <ErrorToast
                        message={saveError}
                        onDismiss={() => setSaveError(null)}
                    />

                    <button
                        onClick={handleSave}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 uppercase text-[10px] tracking-widest"
                    >
                        <Save size={14} /> Actualizar Datos
                    </button>
                </div>
            ) : (
                /* Vista de perfil — ambos roles */
                <div className="flex flex-col items-center animate-in fade-in duration-500">

                    <div
                        className={`w-28 h-28 rounded-2xl border-2 p-1 mb-4 overflow-hidden bg-black
                        ${isAdmin
                            ? 'border-orange-500/50'
                            : 'border-orange-500/30'
                        }`}
                    >
                        <img
                            src={
                                profile?.avatarURL?.startsWith('http') ||
                                profile?.avatarURL?.startsWith('data:')
                                    ? profile.avatarURL
                                    : `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile?.userId}`
                            }
                            alt="Avatar"
                            onError={(e) => {
                                e.currentTarget.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile?.userId}`;
                            }}
                            className="w-full h-full object-cover rounded-xl opacity-80 hover:opacity-100 transition-opacity"
                        />
                    </div>

                    <h2 className="text-2xl font-black tracking-tighter uppercase italic text-white drop-shadow-md text-center">
                        {profile?.username || 'Cargando...'}
                    </h2>

                    {isAdmin ? (
                        <span
                            className="flex items-center gap-1.5 mt-2 bg-orange-500/15 border border-orange-500/30
                            px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-400"
                        >
                            <Shield size={10} /> Administrador
                        </span>
                    ) : (
                        <div className="flex items-center gap-2 text-white/40 text-[10px] mt-2 uppercase tracking-[0.2em] font-bold">
                            <MapPin size={12} className="text-orange-500" />
                            {profile?.city || 'SECTOR'}, {profile?.country || 'NA'}
                        </div>
                    )}

                    <div className="w-full mt-6 border-t border-white/5 pt-4">
                        {isAdmin ? (
                            /* Admin: email (de localStorage) + userId */
                            <div className="space-y-2">
                                <div className="bg-black/30 rounded-xl p-3">
                                    <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/20 mb-0.5">
                                        Email
                                    </p>

                                    <p className="text-xs text-white/50 truncate">
                                        {email}
                                    </p>
                                </div>

                                <div className="bg-black/30 rounded-xl p-3">
                                    <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/20 mb-0.5">
                                        User ID
                                    </p>

                                    <p className="text-[10px] text-white/40 font-mono truncate">
                                        {profile?.userId ?? '—'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-sm text-white/50 italic leading-relaxed px-2">
                                "{profile?.bio || 'Sin manifiesto de combate...'}"
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};