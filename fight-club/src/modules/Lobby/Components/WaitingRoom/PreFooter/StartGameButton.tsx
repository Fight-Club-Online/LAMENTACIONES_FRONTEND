import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useStartGame } from '../../../Hooks/useStartGame';
import type { Room } from '../../../Types/RoomTypes';

type props = {
    roomCode: string;
}

export const StartGameButton: React.FC<props> = ({ roomCode }) => {
    const navigate = useNavigate(); 
    const [loading, setLoading] = useState(false);
    const { startGame } = useStartGame({ code: roomCode });
    
    const iniciar = async () => {
        setLoading(true);
        try {
            const { room, error } = await startGame(roomCode);

            if (error) {
                console.error("Error al iniciar:", error);
                return;
            }


            navigate(`/fight/${roomCode}`); 

        } catch (err) {
            console.error("Error de conexión:", err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-[200px] md:max-w-xs px-2 pointer-events-auto">
            <button 
                onClick={iniciar} 
                disabled={loading}
                className={`w-full kinetic-gradient-fuego py-2 md:py-3 font-headline font-bold text-on-primary tracking-[0.15em] md:tracking-[0.2rem] uppercase text-xs md:text-sm shadow-[0_10px_30px_rgba(255,86,38,0.3)] active:scale-[0.98] transition-all cursor-pointer rounded-[14px] md:rounded-[18px] ${loading ? 'opacity-50 grayscale' : ''}`}
            >
                {loading ? 'Preparando arena...' : 'Comenzar Juego'}
            </button>
        </div>
    );
}