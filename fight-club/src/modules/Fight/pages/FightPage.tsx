import React, { useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Mic, MicOff, Radio } from 'lucide-react'; // Instala con: npm install lucide-react

import { getUserData } from '../../Lobby/Types/localUserData';
import { useFightWebsocket } from '../Hooks/useFightWebsocket';
import { useKeyboardControls } from '../Hooks/useKeyboardControls';
import ArenaCanvas from '../Components/ArenaCanvas';
import FightHUD from '../Components/FightHUD';
import { SelectCharacters } from './SelectCharacters';
import backgroundImage from '../../../assets/Background.jpeg';
import { FightResultScreen } from '../Components/FightResultScreen';

const FightPageInner: React.FC<{ fightId: string; userId: string }> = ({ fightId, userId }) => {
    const navigate = useNavigate();
    
    // Extraemos todo del hook, incluyendo las nuevas funciones de Voice Chat
    const { 
        gameState, isConnected, isLoading, error, sendAction, 
        selectCharacter, startFight, askForHelp, claimHelp, takeBack,
        isVoiceConnected, isMuted, toggleMute 
    } = useFightWebsocket(fightId, userId);

    // Los controles de teclado solo se activan si la pelea está "active"
    useKeyboardControls(sendAction, !!gameState?.active);
    
    const fightPhase = useMemo(() => {
        if (!gameState || !gameState.player1 || !gameState.player2) return 'loading';
        const bothReady = gameState.player1.hasCharacter && gameState.player2.hasCharacter;
        
        if (!gameState.active && bothReady) {
            const p1Dead = (gameState.player1.health?.currentHealth ?? 1) <= 0;
            const p2Dead = (gameState.player2.health?.currentHealth ?? 1) <= 0;
            if (p1Dead || p2Dead) return 'finished';
        }
        
        if (!gameState.active && !bothReady) return 'character-selection';
        if (!gameState.active && bothReady) return 'ready-to-start';
        return 'fighting';
    }, [gameState]);

    const fightResult = useMemo(() => {
        if (!gameState || gameState.active) return null;
        const p1 = gameState.player1?.health;
        const p2 = gameState.player2?.health;
        if (!p1 || !p2) return null;

        const p1Dead = p1.currentHealth <= 0;
        const p2Dead = p2.currentHealth <= 0;
        
        if (p1Dead && p2Dead) return 'DRAW';
        if (p1Dead) return gameState.player2.userId === userId ? 'WIN' : 'LOSE';
        if (p2Dead) return gameState.player1.userId === userId ? 'WIN' : 'LOSE';
        return null;
    }, [gameState, userId]);

    // 1. Pantalla de Carga
    if ((isLoading && !gameState) || fightPhase === 'loading') return (
        <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center">
            <div className="w-20 h-1 bg-red-600 animate-pulse mb-4" />
            <h1 className="text-white text-3xl font-black italic tracking-tighter animate-bounce text-center px-4">
                ENTRANDO A LA ARENA...
            </h1>
        </div>
    );

    // 2. Manejo de Errores
    if (error) return (
        <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center text-center p-6">
            <h2 className="text-red-500 text-2xl font-black mb-4 uppercase">Error de Sincronización</h2>
            <p className="text-zinc-400 mb-8 max-w-md">{error}</p>
            <button onClick={() => navigate('/lobby')} className="px-8 py-3 bg-white text-black font-bold uppercase hover:bg-zinc-200 transition-colors">
                Volver al Lobby
            </button>
        </div>
    );

    // 3. Pantalla de Resultados Finales
    if (fightPhase === 'finished' && fightResult) return (
        <FightResultScreen
            result={fightResult}
            gameState={gameState!}
            userId={userId}
        />
    );

    // 4. Selección de Personajes
    if (fightPhase === 'character-selection' || fightPhase === 'ready-to-start') return (
        <SelectCharacters 
            gameState={gameState!} 
            userId={userId} 
            isConnected={isConnected}
            onSelectCharacter={selectCharacter} 
            onStartFight={startFight} 
        />
    );

    // 5. Render de Combate Principal
    return (
        <main className="relative h-screen w-screen bg-black flex flex-col items-center overflow-hidden font-sans">
            
            {/* FONDO */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={backgroundImage} 
                    alt="Background Atmosphere" 
                    className="w-full h-full object-cover opacity-30 blur-lg scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
            </div>

            {/* PANEL DE ESTADO (Sync + Voice Chat) */}
            <div className="absolute top-4 right-6 flex flex-col items-end gap-2 z-50">
                {/* Indicador de Sincronización STOMP */}
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                    <span className="text-[10px] uppercase font-bold text-zinc-300 tracking-tighter">
                        {isConnected ? 'Sync: OK' : 'Sync: Error'}
                    </span>
                </div>

                {/* Controles de Voice Chat (Solo visibles durante el combate activo) */}
                {gameState?.active && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center gap-2 bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-md shadow-2xl">
                            <Radio size={14} className={isVoiceConnected ? 'text-blue-400 animate-pulse' : 'text-zinc-600'} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isVoiceConnected ? 'text-blue-400' : 'text-zinc-500'}`}>
                                {isVoiceConnected ? 'Voice Live' : 'Voice Off'}
                            </span>
                        </div>
                        
                        <button 
                            onClick={toggleMute}
                            title={isMuted ? "Activar Micrófono" : "Silenciar Micrófono"}
                            className={`p-2.5 rounded-xl border-2 transition-all duration-300 transform active:scale-90 ${
                                isMuted 
                                ? 'bg-red-600/20 border-red-600/40 text-red-500 hover:bg-red-600/30' 
                                : 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:bg-blue-500'
                            }`}
                        >
                            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                    </div>
                )}
            </div>

            {/* HUD SUPERIOR */}
            <div className="relative z-30 w-full max-w-7xl mt-6 px-8">
                <FightHUD 
                    gameState={gameState} 
                    userId={userId} 
                    onStart={startFight}
                    onHelp={askForHelp} 
                    onClaim={claimHelp} 
                    onTakeBack={takeBack}
                />
            </div>

            {/* ÁREA DE COMBATE (CANVAS) */}
            <div className="relative z-20 flex-1 w-full flex items-center justify-center p-4 md:p-12 mb-10">
                <div className={`relative w-full max-w-6xl aspect-video transition-all duration-700 transform 
                    ${fightResult ? 'scale-95 blur-[2px] grayscale-[0.5]' : 'scale-100'}
                    border-x-4 border-zinc-800 shadow-[0_0_100px_rgba(0,0,0,0.8)] bg-zinc-900 rounded-sm overflow-hidden`}
                >
                    <ArenaCanvas gameState={gameState} />
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%]" />
                </div>
            </div>

            {/* CONTROLES MOBILE */}
            <div className="absolute bottom-6 inset-x-6 flex justify-between items-end md:hidden z-40 pointer-events-none">
                <div className="grid grid-cols-3 gap-1 pointer-events-auto opacity-80">
                    <div />
                    <button onTouchStart={() => sendAction('JUMP')} className="w-16 h-16 bg-zinc-800/80 border-t-2 border-zinc-500 rounded-t-lg text-white font-black">W</button>
                    <div />
                    <button onTouchStart={() => sendAction('MOVE_LEFT')} onTouchEnd={() => sendAction('IDLE')} className="w-16 h-16 bg-zinc-800/80 border-l-2 border-zinc-500 text-white font-black">A</button>
                    <button onTouchStart={() => sendAction('BLOCK')} onTouchEnd={() => sendAction('IDLE')} className="w-16 h-16 bg-zinc-800/80 border-b-2 border-zinc-500 text-white font-black">S</button>
                    <button onTouchStart={() => sendAction('MOVE_RIGHT')} onTouchEnd={() => sendAction('IDLE')} className="w-16 h-16 bg-zinc-800/80 border-r-2 border-zinc-500 rounded-r-lg text-white font-black">D</button>
                </div>

                <div className="flex gap-4 pointer-events-auto opacity-90">
                    <button onTouchStart={() => sendAction('BASIC_ATTACK')} className="w-20 h-20 bg-red-600/60 border-4 border-red-500 rounded-full text-white font-black shadow-2xl active:scale-90 transition-transform">ATK</button>
                    <button onTouchStart={() => sendAction('SPECIAL_ATTACK')} className="w-20 h-20 bg-purple-600/60 border-4 border-purple-500 rounded-full text-white font-black shadow-2xl active:scale-90 transition-transform">SP</button>
                </div>
            </div>

            {/* OVERLAY DE RESULTADO */}
            {fightResult && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-[100] animate-in fade-in zoom-in duration-500 backdrop-blur-sm">
                    <div className="relative group">
                        <h2 className={`text-8xl md:text-9xl font-black italic tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,1)] ${
                            fightResult === 'WIN' ? 'text-green-500' : fightResult === 'LOSE' ? 'text-red-600' : 'text-yellow-500'
                        }`}>
                            {fightResult === 'WIN' ? 'VICTORY' : fightResult === 'LOSE' ? 'DEFEATED' : 'DRAW'}
                        </h2>
                        <div className="absolute -top-10 -right-10 bg-white text-black px-6 py-2 font-black -rotate-12 text-3xl border-4 border-black animate-bounce">
                            K.O.
                        </div>
                    </div>

                    <div className="mt-16 flex flex-col md:flex-row gap-6">
                        <button 
                            onClick={() => navigate('/lobby')} 
                            className="px-12 py-4 bg-zinc-100 text-black font-black uppercase tracking-tighter hover:bg-white transition-all transform hover:-translate-y-1 active:translate-y-0"
                        >
                            Back to Lobby
                        </button>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="px-12 py-4 bg-red-600 text-white font-black uppercase tracking-tighter hover:bg-red-500 shadow-[0_10px_20px_rgba(220,38,38,0.4)] transition-all transform hover:-translate-y-1 active:translate-y-0"
                        >
                            Rematch
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
    
    if (!userId) return <Navigate to="/login" replace />;
    return <FightPageInner fightId={fightId ?? ''} userId={userId} />;
};

export default FightPage;