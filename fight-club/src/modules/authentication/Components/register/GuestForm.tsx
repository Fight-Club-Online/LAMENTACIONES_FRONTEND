import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import authApi from '../../Config/axios';
import { ErrorToast } from '../ui/ErrorToast';

export const GuestForm = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await authApi.post('/api/v1/users/guest', { username });

      localStorage.setItem('fight_club_token', data.accessToken);
      localStorage.setItem('fight_club_refresh', data.refreshToken);
      localStorage.setItem('user_data', JSON.stringify({
        userId: data.userId,
        username: data.username,
        role: 'GUEST'
      }));

      navigate(`/lobby`);
    } catch (err: any) {
      const msg = err.response?.data?.message || "ERROR AL CREAR INVITADO";
      setError(msg.toUpperCase());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <div className="space-y-1.5">
        <label className="text-[10px] text-white/40 uppercase tracking-[0.1em] ml-1">
          Nombre de Invitado
        </label>
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-oro transition-colors" />
          <input
            type="text"
            placeholder="Nombre temporal de combate"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={35}
            required
            className="w-full bg-[#1a1816] border border-white/5 p-4 pl-12 rounded-xl text-sm text-white outline-none focus:border-white/20 transition-all"
          />
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <p className="text-yellow-500/80 text-[10px] uppercase tracking-widest font-bold">
          ⚠️ Cuenta temporal — expira en 1 hora
        </p>
      </div>

      <ErrorToast message={error} onDismiss={() => setError(null)} /> {/* ← reemplaza div de error */}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-gradient-to-r from-[#555] to-[#333] text-white font-bold uppercase tracking-[0.2em] rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
      >
        {isLoading ? 'PREPARANDO...' : 'ENTRAR COMO INVITADO'}
      </button>
    </form>
  );
};