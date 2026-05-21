import React, { useEffect, useState } from 'react';
import type { Room } from '../../Types/RoomTypes';
import { SearchResultPopUp } from '../PrivateRoomPopUp/SearchResult';
import { useNavigate } from 'react-router-dom';

type Props = {
    rooms: Room[]
}

export const PublicRoomsSelectorPopUp: React.FC<Props> = ({ rooms }) => {   
    const navigate = useNavigate();
    const [roomsP, setRoomsP] = useState<Room[]>([]);
    
    // Estado para saber a qué sala se le quiere elegir el rol
    const [selectedRoomCode, setSelectedRoomCode] = useState<string | null>(null);
    
    useEffect(() => {
        if (rooms) {
            setRoomsP(rooms);
        }
    }, [rooms]);

    const JoinWaiting = (roomCode: string, playerType: 'PLAYER' | 'SPECTATOR') => {
        navigate(`/waiting-room?roomCode=${roomCode}&playerType=${playerType}`); 
    };

    return (
        <div className="max-h-[55vh] overflow-y-auto border border-orange-500/20 rounded-xl p-2 space-y-4 bg-background/40 backdrop-blur-md">
            {roomsP.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-label font-bold tracking-[0.15em] text-on-surface-variant uppercase">
                    No hay salas públicas disponibles
                </div>
            ) : (
                roomsP.map((room) => {
                    const isSelected = selectedRoomCode === room.roomCode;
                    const isPlayerFull = room.maxPlayers - room.currentPlayers === 0;
                    const isSpectatorFull = room.maxSpectators - room.currentSpectators === 0;

                    return (
                        <div 
                            key={room.roomCode} 
                            className="kinetic-glass fuego-border rounded-[14px] p-4 transition-all duration-300 flex flex-col gap-4 bg-surface/20"
                        >
                            {/* Header de la sala (Resultados actuales) */}
                            <div 
                                onClick={() => setSelectedRoomCode(isSelected ? null : room.roomCode)}
                                className="cursor-pointer hover:opacity-90 transition-opacity"
                            >
                                <SearchResultPopUp
                                    players={room.currentPlayers}
                                    spectators={room.currentSpectators}
                                    status={room.roomState}
                                />
                            </div>

                            {/* Panel Desplegable de Roles (Camino a elegir) */}
                            <div className={`transition-all duration-300 overflow-hidden flex flex-col items-center justify-center ${
                                isSelected ? "max-h-[140px] opacity-100 border-t border-orange-500/20 pt-4" : "max-h-0 opacity-0 pointer-events-none"
                            }`}>
                                <p className="text-center text-xs font-display tracking-widest text-gray-400 uppercase mb-3">
                                    ¿Cuál será tu siguiente camino?
                                </p>
                                
                                <div className="flex items-center justify-center gap-4 w-full max-w-sm">
                                    {/* Botón JUGADOR (Únete) */}
                                    <button
                                        disabled={isPlayerFull}
                                        onClick={() => JoinWaiting(room.roomCode, 'PLAYER')}
                                        className={`flex-1 py-2 px-4 rounded-xl font-display font-bold tracking-wider text-sm uppercase transition-all duration-200 
                                            ${isPlayerFull 
                                                ? "bg-gray-700/50 text-gray-500 cursor-not-allowed line-through" 
                                                : "bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:scale-105 shadow-[0_0_15px_rgba(234,88,12,0.4)]"
                                            }`}
                                    >
                                        {isPlayerFull ? "Lleno" : "Únete"}
                                    </button>

                                    <span className="text-orange-500/50 font-light">|</span>

                                    {/* Botón ESPECTADOR (Creala / Mirar) */}
                                    <button
                                        disabled={isSpectatorFull}
                                        onClick={() => JoinWaiting(room.roomCode, 'SPECTATOR')}
                                        className={`flex-1 py-2 px-4 rounded-xl font-display font-bold tracking-wider text-sm uppercase transition-all duration-200 border
                                            ${isSpectatorFull 
                                                ? "border-gray-700 text-gray-500 cursor-not-allowed" 
                                                : "border-orange-500 text-orange-500 bg-orange-500/10 hover:bg-orange-500 hover:text-white hover:scale-105"
                                            }`}
                                    >
                                        {isSpectatorFull ? "Lleno" : "Espectador"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}