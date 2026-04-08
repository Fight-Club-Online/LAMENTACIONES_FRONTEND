import React from 'react';
import { useParams } from 'react-router-dom';
import { useFightWebsocket } from '../Hooks/useFightWebsocket';
import { useKeyboardControls } from '../Hooks/useKeyboardControls';
import ArenaCanvas from '../Components/ArenaCanvas';
import FightHUD from '../Components/FightHUD';

export const FightPage: React.FC = () => {
    const { fightId } = useParams<{ fightId: string }>();
    const userId = localStorage.getItem('userId') || 'player-1'; 

    const { 
        gameState, 
        isConnected, 
        sendAction, 
        startFight, 
        askForHelp, 
        claimHelp 
    } = useFightWebsocket(fightId || '', userId);

    // Conectamos los controles de teclado al websocket
    useKeyboardControls(sendAction, !!gameState?.isActive);

    if (!isConnected) {
        return (
            <div className="h-screen bg-black flex items-center justify-center">
                <h1 className="text-red-600 text-4xl font-black animate-pulse italic">
                    CONECTANDO AL SERVIDOR...
                </h1>
            </div>
        );
    }

    return (
        <main className="relative h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center p-4 overflow-hidden">
            {/* HUD: Capa Superior (Vidas y Botones) */}
            <FightHUD 
                gameState={gameState}
                userId={userId}
                onStart={startFight}
                onHelp={askForHelp}
                onClaim={claimHelp}
            />

            {/* Canvas: El Juego */}
            <ArenaCanvas gameState={gameState} />

            {/* Overlay de Victoria/Derrota */}
            {gameState && !gameState.isActive && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
                    <h2 className="text-8xl text-white font-black italic mb-8 drop-shadow-lg">K.O.</h2>
                    <button 
                        onClick={() => window.location.href = '/lobby'}
                        className="bg-white text-black px-8 py-3 font-bold hover:bg-red-500 transition-colors"
                    >
                        VOLVER AL LOBBY
                    </button>
                </div>
            )}
        </main>
    );
};