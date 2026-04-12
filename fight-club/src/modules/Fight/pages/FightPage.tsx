import React, { useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { getUserData } from '../../Lobby/Types/localUserData';
import { useFightWebsocket } from '../Hooks/useFightWebsocket';
import { useKeyboardControls } from '../Hooks/useKeyboardControls';
import ArenaCanvas from '../Components/EnviromentFight/ArenaCanvas';
import FightHUD from '../Components/EnviromentFight/FightHUD';
import { SelectCharacters } from './SelectCharacters';
import backgroundImage from '../../../assets/Background.jpeg';

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

    useKeyboardControls(sendAction, !!gameState?.active);

    const fightPhase = useMemo(() => {
        if (!gameState) return 'loading';
        const bothHaveCharacters = gameState.player1.hasCharacter && gameState.player2.hasCharacter;
        if (!gameState.active && !bothHaveCharacters) return 'character-selection';
        if (!gameState.active && bothHaveCharacters) return 'ready-to-start';
        return 'fighting';
    }, [gameState]);

    const fightResult = useMemo(() => {
        if (!gameState || gameState.active) return null;
        if (!gameState.player1.health || !gameState.player2.health) return null;

        const p1Dead = gameState.player1.health.currentHealth <= 0;
        const p2Dead = gameState.player2.health.currentHealth <= 0;

        if (p1Dead && p2Dead) return 'DRAW';
        if (p1Dead) return gameState.player2.userId === userId ? 'WIN' : 'LOSE';
        if (p2Dead) return gameState.player1.userId === userId ? 'WIN' : 'LOSE';

        return null;
    }, [gameState, userId]);

    if (isLoading && !gameState) {
        return (
            <div className="h-screen bg-black flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                <h1 className="text-white text-2xl font-black italic tracking-widest animate-pulse">
                    CARGANDO PELEA...
                </h1>
            </div>
        );
    }

    if (error && !gameState) {
        return (
            <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6">
                <h1 className="text-red-600 text-6xl font-black italic drop-shadow-2xl">ERROR</h1>
                <p className="text-white/60 text-lg font-mono">{error}</p>
                <button 
                    onClick={() => navigate('/lobby')}
                    className="bg-white text-black hover:bg-red-600 hover:text-white px-10 py-3 font-black uppercase italic transition-all transform hover:scale-105 active:scale-95"
                >
                    VOLVER AL LOBBY
                </button>
            </div>
        );
    }

    if (!isConnected && gameState) {
        return (
            <div className="h-screen bg-black/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-[100]">
                <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                <h1 className="text-yellow-500 text-2xl font-black animate-pulse italic">
                    RECONECTANDO...
                </h1>
            </div>
        );
    }

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

    return (
        <main className="relative h-screen w-screen bg-black flex flex-col items-center justify-center p-4 overflow-hidden">
            
            {/* BACKGROUND LAYER: Imagen borrosa con oscurecimiento */}
            <div 
                className="absolute inset-0 z-0 scale-110"
                style={{
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(12px) brightness(0.3) saturate(1.2)',
                }}
            />

            {/* Status de Conexión Estilizado */}
            <div className="absolute top-4 right-6 flex items-center gap-3 z-50 bg-black/40 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
                <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'} animate-pulse`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                    {isConnected ? 'Sistema Online' : 'Fallo de Red'}
                </span>
            </div>

            {/* HUD Inferior: Controles Desktop */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex gap-6 text-white/30 text-[10px] font-black tracking-[0.2em] uppercase z-10">
                <span className="px-2 py-1 border border-white/5 rounded">WASD: Mover</span>
                <span className="px-2 py-1 border border-white/5 rounded">J: Ataque</span>
                <span className="px-2 py-1 border border-white/5 rounded">K: Especial</span>
            </div>

            {/* Capa de juego principal */}
            <div className="relative z-20 flex flex-col items-center justify-center w-full h-full">
                <FightHUD 
                    gameState={gameState}
                    userId={userId}
                    onStart={startFight}
                    onHelp={askForHelp}
                    onClaim={claimHelp}
                    onTakeBack={takeBack}
                />
                <ArenaCanvas gameState={gameState} />
            </div>

            {/* Mobile Controls: Rediseño más limpio y con feedback visual */}
            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end pointer-events-none md:hidden z-30">
                <div className="flex flex-col gap-4 pointer-events-auto">
                    <button 
                        onTouchStart={() => sendAction('JUMP')}
                        className="w-16 h-16 bg-white/10 backdrop-blur-md text-white font-black rounded-2xl border-2 border-white/20 active:scale-90 active:bg-white/30 transition-transform flex items-center justify-center"
                    >
                        W
                    </button>
                    <div className="flex gap-3">
                        <button 
                            onTouchStart={() => sendAction('MOVE_LEFT')}
                            onTouchEnd={() => sendAction('IDLE')}
                            className="w-16 h-16 bg-white/10 backdrop-blur-md text-white font-black rounded-2xl border-2 border-white/20 active:scale-90 active:bg-white/30 transition-transform"
                        >
                            A
                        </button>
                        <button 
                            onTouchStart={() => sendAction('BLOCK')}
                            onTouchEnd={() => sendAction('IDLE')}
                            className="w-16 h-16 bg-white/10 backdrop-blur-md text-white font-black rounded-2xl border-2 border-white/20 active:scale-90 active:bg-white/30 transition-transform"
                        >
                            S
                        </button>
                        <button 
                            onTouchStart={() => sendAction('MOVE_RIGHT')}
                            onTouchEnd={() => sendAction('IDLE')}
                            className="w-16 h-16 bg-white/10 backdrop-blur-md text-white font-black rounded-2xl border-2 border-white/20 active:scale-90 active:bg-white/30 transition-transform"
                        >
                            D
                        </button>
                    </div>
                </div>

                <div className="flex gap-4 pointer-events-auto">
                    <button 
                        onTouchStart={() => sendAction('BASIC_ATTACK')}
                        className="w-20 h-20 bg-red-600/40 backdrop-blur-md text-white font-black rounded-full border-4 border-red-500/50 active:scale-75 transition-transform shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                    >
                        J
                    </button>
                    <button 
                        onTouchStart={() => sendAction('SPECIAL_ATTACK')}
                        className="w-20 h-20 bg-purple-600/40 backdrop-blur-md text-white font-black rounded-full border-4 border-purple-500/50 active:scale-75 transition-transform shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                    >
                        K
                    </button>
                </div>
            </div>

            {/* Overlay de Victoria/Derrota: Mejorado con Blur y Tipografía Masiva */}
            {fightResult && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center z-[100] animate-fadeIn">
                    <div className="relative group">
                        <h2 className={`text-9xl font-black italic mb-2 tracking-tighter transition-all ${
                            fightResult === 'WIN' ? 'text-green-500 drop-shadow-[0_0_30px_#22c55e]' : 
                            fightResult === 'LOSE' ? 'text-red-600 drop-shadow-[0_0_30px_#dc2626]' : 
                            'text-yellow-500 drop-shadow-[0_0_30px_#eab308]'
                        }`}>
                            {fightResult === 'WIN' ? 'VICTORIA' : 
                             fightResult === 'LOSE' ? 'DERROTA' : 
                             'EMPATE'}
                        </h2>
                        <div className="absolute -bottom-2 left-0 w-full h-1 bg-current opacity-50" />
                    </div>
                    
                    <p className="text-white font-black text-4xl mt-4 mb-12 tracking-[0.5em] opacity-80">K.O.</p>
                    
                    <div className="flex gap-6">
                        <button 
                            onClick={() => navigate('/lobby')}
                            className="bg-white text-black px-12 py-4 font-black italic uppercase hover:bg-zinc-200 transition-all transform hover:-skew-x-12 active:scale-95 cursor-pointer"
                        >
                            VOLVER AL LOBBY
                        </button>
                        <button 
                            onClick={() => window.location.reload()}
                            className="bg-red-600 text-white px-12 py-4 font-black italic uppercase hover:bg-red-500 transition-all transform hover:-skew-x-12 active:scale-95 shadow-lg shadow-red-600/20 cursor-pointer"
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