import React, { useMemo, useRef } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { getUserData } from '../../Lobby/Types/localUserData';
import { useFightWebsocket } from '../Hooks/useFightWebsocket';
import { useKeyboardControls } from '../Hooks/useKeyboardControls';
import ArenaCanvas from '../Components/EnviromentFight/ArenaCanvas';
import FightHUD from '../Components/EnviromentFight/FightHUD';
import { SelectCharacters } from './SelectCharacters';
import backgroundImage from '../../../assets/Background.jpeg';
import { FightResultScreen } from '../Components/EnviromentFight/FightResultScreen';
import { useVoiceChat } from '../Hooks/useVoiceChat';
import { VoiceChatPanel } from '../Components/EnviromentFight/VoiceChatPanel';


type FightPageInnerProps = {
    fightId: string;
    userId: string;
};

const FightPageInner: React.FC<FightPageInnerProps> = ({ fightId, userId }) => {
    const navigate = useNavigate();
    const fightResultRef = useRef<'WIN' | 'LOSE' | 'DRAW' | null>(null)
    const [showChat, setShowChat] = React.useState(true);


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

    const userData = getUserData();
    const voiceSocketRef = useVoiceChat(fightId || null, userId, userData?.username ?? null);

    useKeyboardControls(sendAction, !!gameState?.active);

    const fightPhase = useMemo(() => {
        if (fightResultRef.current) return 'finished';
        if (!gameState) return 'loading';
        const bothHaveCharacters = gameState.player1.hasCharacter && gameState.player2.hasCharacter;
        if (!gameState.active && bothHaveCharacters) {
            const p1Dead = (gameState.player1.health?.currentHealth ?? 1) <= 0;
            const p2Dead = (gameState.player2.health?.currentHealth ?? 1) <= 0;
            if (p1Dead || p2Dead) return 'finished';
        }
        if (!gameState.active && !bothHaveCharacters) return 'character-selection';
        if (!gameState.active && bothHaveCharacters) return 'ready-to-start';
        return 'fighting';
    }, [gameState]);

    const fightResult = useMemo(() => {
        if (fightResultRef.current) return fightResultRef.current
        if (!gameState || gameState.active) return null;
        if (!gameState.player1.health || !gameState.player2.health) return null;

        const p1Dead = gameState.player1.health.currentHealth <= 0;
        const p2Dead = gameState.player2.health.currentHealth <= 0;
        if (!p1Dead && !p2Dead) return null;
        
        let result: 'WIN' | 'LOSE' | 'DRAW';
        if (p1Dead && p2Dead) result = 'DRAW';
        else if (p1Dead) result = gameState.player2.userId === userId ? 'WIN' : 'LOSE';
        else result = gameState.player1.userId === userId ? 'WIN' : 'LOSE';
        
        fightResultRef.current = result; 
        return result;
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

    if (fightPhase === 'finished' && fightResult) {
        return (
        <FightResultScreen
         result={fightResult}
         gameState={gameState!}
         userId={userId}
        />
       );
    }

    return (
        <main className="relative h-screen w-screen bg-black flex overflow-hidden">
            
            {/*  ARENA */}
            <div className="relative flex-1 flex flex-col overflow-hidden">

                {/* Fondo borroso */}
                <div
                    className="absolute inset-0 z-0 scale-110"
                    style={{
                        backgroundImage: `url(${backgroundImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(12px) brightness(0.3) saturate(1.2)',
                    }}
                />

                {/* Status conexión — ahora right-4 para no solapar el chat */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-50 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                        {isConnected ? 'Online' : 'Error'}
                    </span>
                </div>

                {/* HUD + Canvas */}
                <div className="relative z-20 flex-1 flex flex-col">
                    <FightHUD
                        gameState={gameState}
                        userId={userId}
                        onStart={startFight}
                        onHelp={askForHelp}
                        onClaim={claimHelp}
                        onTakeBack={takeBack}
                    />
                    <div className="flex-1 flex items-center justify-center px-4 pb-16">
                        <ArenaCanvas gameState={gameState} />
                    </div>
                </div>

                {/* Hint controles desktop */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex gap-4 text-white/20 text-[9px] font-black tracking-[0.2em] uppercase z-10">
                    <span className="px-2 py-1 border border-white/5 rounded">WASD: Mover</span>
                    <span className="px-2 py-1 border border-white/5 rounded">J: Ataque</span>
                    <span className="px-2 py-1 border border-white/5 rounded">K: Especial</span>
                </div>

                {/* Mobile Controls */}
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end pointer-events-none md:hidden z-30">
                    <div className="flex flex-col gap-4 pointer-events-auto">
                        <button
                            onTouchStart={() => sendAction('JUMP')}
                            className="w-16 h-16 bg-white/10 backdrop-blur-md text-white font-black rounded-2xl border-2 border-white/20 active:scale-90 active:bg-white/30 transition-transform flex items-center justify-center"
                        >
                            W
                        </button>
                        <div className="flex gap-3">
                            <button onTouchStart={() => sendAction('MOVE_LEFT')} onTouchEnd={() => sendAction('IDLE')}
                                className="w-16 h-16 bg-white/10 backdrop-blur-md text-white font-black rounded-2xl border-2 border-white/20 active:scale-90 active:bg-white/30 transition-transform">A</button>
                            <button onTouchStart={() => sendAction('BLOCK')} onTouchEnd={() => sendAction('IDLE')}
                                className="w-16 h-16 bg-white/10 backdrop-blur-md text-white font-black rounded-2xl border-2 border-white/20 active:scale-90 active:bg-white/30 transition-transform">S</button>
                            <button onTouchStart={() => sendAction('MOVE_RIGHT')} onTouchEnd={() => sendAction('IDLE')}
                                className="w-16 h-16 bg-white/10 backdrop-blur-md text-white font-black rounded-2xl border-2 border-white/20 active:scale-90 active:bg-white/30 transition-transform">D</button>
                        </div>
                    </div>
                    <div className="flex gap-4 pointer-events-auto">
                        <button onTouchStart={() => sendAction('BASIC_ATTACK')}
                            className="w-20 h-20 bg-red-600/40 backdrop-blur-md text-white font-black rounded-full border-4 border-red-500/50 active:scale-75 transition-transform shadow-[0_0_20px_rgba(220,38,38,0.3)]">J</button>
                        <button onTouchStart={() => sendAction('SPECIAL_ATTACK')}
                            className="w-20 h-20 bg-purple-600/40 backdrop-blur-md text-white font-black rounded-full border-4 border-purple-500/50 active:scale-75 transition-transform shadow-[0_0_20px_rgba(147,51,234,0.3)]">K</button>
                    </div>
                </div>
            </div>
            
            {/* ── BOTÓN TOGGLE CHAT ── */}
            <button
            onClick={() => setShowChat(p => !p)}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-50 flex-col items-center justify-center w-5 h-16 bg-white/5 hover:bg-white/10 border-l border-t border-b border-white/10 rounded-l-lg transition-all"
            style={{ right: showChat ? '288px' : '0px' }}
            title={showChat ? 'Ocultar chat' : 'Mostrar chat'}
            >
                <span className="text-white/40 text-[10px]">{showChat ? '›' : '‹'}</span>
                </button>
                
            {/* ── PANEL DE CHAT (columna derecha fija) ── */}
            <div className={`hidden md:flex flex-shrink-0 flex-col border-l border-white/5 bg-black/70 backdrop-blur-md transition-all duration-300 overflow-hidden ${showChat ? 'w-72' : 'w-0'}`}>
            <div className="w-72 h-full flex flex-col">
                <VoiceChatPanel
                socketRef={voiceSocketRef}
                userId={userId}
                username={userData?.username || userId}
                isPlayer={true}
                />
                </div>
            </div>
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