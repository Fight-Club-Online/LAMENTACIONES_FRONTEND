import React, { useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { getUserData } from '../../Lobby/Types/localUserData';
import { useFightWebsocket } from '../Hooks/useFightWebsocket';
import { useKeyboardControls } from '../Hooks/useKeyboardControls';
import ArenaCanvas from '../Components/ArenaCanvas';
import FightHUD from '../Components/FightHUD';
import { SelectCharacters } from './SelectCharacters';

type FightPageInnerProps = {
    fightId: string;
    userId: string;
};

const FightPageInner: React.FC<FightPageInnerProps> = ({ fightId, userId }) => {
    const navigate = useNavigate();

    const { 
        gameState, 
        isConnected,
        isLoading,
        error,
        sendAction,
        selectCharacter,
        startFight, 
        askForHelp, 
        claimHelp,
        takeBack
    } = useFightWebsocket(fightId || '', userId);

    // Conectamos los controles de teclado al websocket
    // Solo activos si la pelea está en progreso
    useKeyboardControls(sendAction, !!gameState?.active);

    // Determinar la fase actual de la pelea
    const fightPhase = useMemo(() => {
        if (!gameState) return 'loading';
        
        // Si la pelea no está activa y algún jugador no tiene personaje -> selección
        const bothHaveCharacters = gameState.player1.hasCharacter && gameState.player2.hasCharacter;
        
        if (!gameState.active && !bothHaveCharacters) {
            return 'character-selection';
        }
        
        // Si ambos tienen personaje pero la pelea no está activa -> listo para empezar
        if (!gameState.active && bothHaveCharacters) {
            return 'ready-to-start';
        }
        
        // Pelea activa
        return 'fighting';
    }, [gameState]);

    // Determinar el resultado de la pelea
    // Solo evaluar si ambos fighters tienen health (personaje seleccionado)
    const fightResult = useMemo(() => {
        if (!gameState || gameState.active) return null;
        
        // No evaluar resultado si los fighters no tienen health aún
        if (!gameState.player1.health || !gameState.player2.health) return null;

        const p1Dead = gameState.player1.health.currentHealth <= 0;
        const p2Dead = gameState.player2.health.currentHealth <= 0;

        if (p1Dead && p2Dead) return 'DRAW';
        if (p1Dead) return gameState.player2.userId === userId ? 'WIN' : 'LOSE';
        if (p2Dead) return gameState.player1.userId === userId ? 'WIN' : 'LOSE';

        return null; // Pelea pausada o no terminada
    }, [gameState, userId]);

    // Pantalla de carga inicial
    if (isLoading && !gameState) {
        return (
            <div className="h-screen bg-black flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                <h1 className="text-white text-2xl font-black italic">
                    CARGANDO PELEA...
                </h1>
            </div>
        );
    }

    // Pantalla de error
    if (error && !gameState) {
        return (
            <div className="h-screen bg-black flex flex-col items-center justify-center gap-6">
                <h1 className="text-red-600 text-4xl font-black italic">
                    ERROR
                </h1>
                <p className="text-white text-lg">{error}</p>
                <button 
                    onClick={() => navigate('/lobby')}
                    className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 font-bold rounded transition-colors"
                >
                    VOLVER AL LOBBY
                </button>
            </div>
        );
    }

    // Indicador de conexión WebSocket
    if (!isConnected && gameState) {
        return (
            <div className="h-screen bg-black flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                <h1 className="text-yellow-500 text-2xl font-black animate-pulse italic">
                    RECONECTANDO...
                </h1>
            </div>
        );
    }

    // Fase de selección de personajes
    if (fightPhase === 'character-selection' || fightPhase === 'ready-to-start') {
        return (
            <SelectCharacters
                gameState={gameState!}
                userId={userId}
                isConnected={isConnected}
                onSelectCharacter={selectCharacter}
                onStartFight={startFight}
            />
        );
    }

    // Fase de pelea activa
    return (
        <main className="relative h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center p-4 overflow-hidden">
            {/* Indicador de estado de conexión */}
            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                <span 
                    className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} 
                />
                <span className="text-xs text-zinc-400">
                    {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
            </div>

            {/* HUD: Capa Superior (Vidas y Botones) */}
            <FightHUD 
                gameState={gameState}
                userId={userId}
                onStart={startFight}
                onHelp={askForHelp}
                onClaim={claimHelp}
                onTakeBack={takeBack}
            />

            {/* Canvas: El Juego */}
            <ArenaCanvas gameState={gameState} />

            {/* Controles en pantalla para mobile */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none md:hidden">
                <div className="flex flex-col gap-2 pointer-events-auto">
                    <div className="flex gap-2">
                        <button 
                            onTouchStart={() => sendAction('JUMP')}
                            className="w-14 h-14 bg-zinc-800/80 text-white font-bold rounded-lg border-2 border-zinc-600 active:bg-zinc-600"
                        >
                            W
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onTouchStart={() => sendAction('MOVE_LEFT')}
                            onTouchEnd={() => sendAction('IDLE')}
                            className="w-14 h-14 bg-zinc-800/80 text-white font-bold rounded-lg border-2 border-zinc-600 active:bg-zinc-600"
                        >
                            A
                        </button>
                        <button 
                            onTouchStart={() => sendAction('BLOCK')}
                            onTouchEnd={() => sendAction('IDLE')}
                            className="w-14 h-14 bg-zinc-800/80 text-white font-bold rounded-lg border-2 border-zinc-600 active:bg-zinc-600"
                        >
                            S
                        </button>
                        <button 
                            onTouchStart={() => sendAction('MOVE_RIGHT')}
                            onTouchEnd={() => sendAction('IDLE')}
                            className="w-14 h-14 bg-zinc-800/80 text-white font-bold rounded-lg border-2 border-zinc-600 active:bg-zinc-600"
                        >
                            D
                        </button>
                    </div>
                </div>
                <div className="flex gap-2 items-end pointer-events-auto">
                    <button 
                        onTouchStart={() => sendAction('BASIC_ATTACK')}
                        className="w-16 h-16 bg-red-600/80 text-white font-bold rounded-full border-2 border-red-400 active:bg-red-500"
                    >
                        J
                    </button>
                    <button 
                        onTouchStart={() => sendAction('SPECIAL_ATTACK')}
                        className="w-16 h-16 bg-purple-600/80 text-white font-bold rounded-full border-2 border-purple-400 active:bg-purple-500"
                    >
                        K
                    </button>
                </div>
            </div>

            {/* Instrucciones de controles para desktop */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex gap-4 text-zinc-500 text-xs">
                <span>WASD: Moverse</span>
                <span>J: Ataque</span>
                <span>K: Especial</span>
            </div>

            {/* Overlay de Victoria/Derrota */}
            {fightResult && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-fadeIn">
                    <h2 className={`text-8xl font-black italic mb-4 drop-shadow-lg ${
                        fightResult === 'WIN' ? 'text-green-500' : 
                        fightResult === 'LOSE' ? 'text-red-500' : 
                        'text-yellow-500'
                    }`}>
                        {fightResult === 'WIN' ? 'VICTORIA' : 
                         fightResult === 'LOSE' ? 'DERROTA' : 
                         'EMPATE'}
                    </h2>
                    <p className="text-white text-2xl mb-8">K.O.</p>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => navigate('/lobby')}
                            className="bg-white text-black px-8 py-3 font-bold hover:bg-zinc-200 transition-colors rounded"
                        >
                            VOLVER AL LOBBY
                        </button>
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-red-600 text-white px-8 py-3 font-bold hover:bg-red-500 transition-colors rounded"
                        >
                            REVANCHA
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
};

export const FightPage: React.FC = () => {
    const { fightId } = useParams<{ fightId: string }>();
    const userId = getUserData()?.userId ?? null;
    if (!userId) {
        return <Navigate to="/login" replace />;
    }
    return <FightPageInner fightId={fightId ?? ''} userId={userId} />;
};
