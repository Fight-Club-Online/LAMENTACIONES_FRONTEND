import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';

interface Message {
    id: string;
    username: string;
    texto: string;
    esMio: boolean;
    isSystem?: boolean;
}

interface Props {
    socketRef: React.MutableRefObject<Socket | null>;
    userId: string;
    username: string;
    isPlayer?: boolean; // Solo jugadores acceden a voz
}

export const VoiceChatPanel: React.FC<Props> = ({ socketRef, userId, username, isPlayer = true }) => {
    const [messages, setMessages]     = useState<Message[]>([]);
    const [input, setInput]           = useState('');
    const [isTalking, setIsTalking]   = useState(false);
    const [isMuted, setIsMuted]       = useState(false);
    const [deafened, setDeafened]     = useState(false); // silenciar audio entrante
    const [chatActive, setChatActive] = useState(false);
    const [isBanned, setIsBanned]     = useState(false);
    const messagesEndRef              = useRef<HTMLDivElement>(null);
    const inputRef                    = useRef<HTMLInputElement>(null);

    // ── WebRTC / Audio
    const localStreamRef  = useRef<MediaStream | null>(null);
    const peerRef         = useRef<any>(null);          // PeerJS instance
    const peerListRef     = useRef<string[]>([]);
    const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());

    const getLocalStream = useCallback(async () => {
        if (localStreamRef.current) return localStreamRef.current;
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: false,
        });
        stream.getAudioTracks()[0].enabled = false; // Empieza silenciado
        localStreamRef.current = stream;
        return stream;
    }, []);

    // Inicializar PeerJS cuando el chat se activa
    useEffect(() => {
        if (!chatActive || !isPlayer) return;
        const s = socketRef.current;
        if (!s) return;

        const PeerClass = (window as any).Peer;
        if (!PeerClass) {
            console.warn('[VOICE] PeerJS no está cargado. Agrega el script CDN al index.html');
            return;
        }

        const peer = new PeerClass(s.id);
        peerRef.current = peer;

        peer.on('open', (id: string) => {
            console.log('[PEER] Abierto con ID:', id);
            listenForCalls(peer);
        });

        peer.on('error', (err: any) => console.error('[PEER]', err));

        return () => {
            try { peer.destroy(); } catch (_) {}
            peerRef.current = null;
            peerListRef.current = [];
        };
    }, [chatActive, isPlayer]);

    const listenForCalls = (peer: any) => {
        peer.on('call', async (call: any) => {
            const stream = await getLocalStream().catch(() => null);
            if (!stream) return;
            call.answer(stream);
            call.on('stream', (remote: MediaStream) => {
                handleRemoteStream(remote, call.peer);
            });
        });
    };

    const makeCall = useCallback(async (peerId: string) => {
        const peer = peerRef.current;
        if (!peer || peerListRef.current.includes(peerId)) return;
        const stream = await getLocalStream().catch(() => null);
        if (!stream) return;
        const call = peer.call(peerId, stream);
        if (!call) return;
        call.on('stream', (remote: MediaStream) => {
            handleRemoteStream(remote, call.peer);
        });
    }, [getLocalStream]);

    const handleRemoteStream = (stream: MediaStream, peerId: string) => {
        if (peerListRef.current.includes(peerId)) return;
        peerListRef.current.push(peerId);
        const audio = document.createElement('audio');
        audio.autoplay = true;
        audio.muted = deafened;
        audio.srcObject = stream;
        audio.style.display = 'none';
        document.body.appendChild(audio);
        remoteAudiosRef.current.set(peerId, audio);
    };

    // ── Socket events 
    useEffect(() => {
        const s = socketRef.current;
        if (!s) return;

        const onEstado = ({ activo }: { activo: boolean }) => {
            setChatActive(activo);
            if (activo) {
                setTimeout(() => {
                    // Llamar a todos cuando el chat se activa
                    const socket = socketRef.current;
                    if (!socket) return;
                    // El servidor envía listaSockets; llamamos en ese evento
                }, 600);
            }
        };

        const onListaSockets = (lista: { socketId: string; username: string }[]) => {
            if (!chatActive) return;
            lista.forEach(({ socketId }) => {
                if (socketId !== s.id && !peerListRef.current.includes(socketId)) {
                    makeCall(socketId);
                }
            });
        };

        const onMessage = (msg: any) => {
            setMessages(prev => [...prev, {
                id:       crypto.randomUUID(),
                username: msg.username || 'Anon',
                texto:    msg.texto || '',
                esMio:    msg.userId === userId,
            }]);
        };

        const onAdvertencia = (data: { mensaje: string }) => {
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(), username: '⚠️ Sistema',
                texto: data.mensaje, esMio: false, isSystem: true,
            }]);
        };

        const onSilenciar = (targetId: string) => {
            if (targetId === s.id) {
                setIsBanned(true);
                setIsMuted(true);
                if (localStreamRef.current) {
                    localStreamRef.current.getAudioTracks().forEach(t => t.enabled = false);
                }
                setMessages(prev => [...prev, {
                    id: crypto.randomUUID(), username: '🚫 Sistema',
                    texto: 'Has sido silenciado por un moderador.', esMio: false, isSystem: true,
                }]);
            }
            // Silenciar audio del peer específico
            const audio = remoteAudiosRef.current.get(targetId);
            if (audio) audio.muted = true;
        };

        s.on('estado_chat',       onEstado);
        s.on('listaSockets',      onListaSockets);
        s.on('chat message',      onMessage);
        s.on('advertencia_sistema', onAdvertencia);
        s.on('comando_silenciar', onSilenciar);

        return () => {
            s.off('estado_chat',       onEstado);
            s.off('listaSockets',      onListaSockets);
            s.off('chat message',      onMessage);
            s.off('advertencia_sistema', onAdvertencia);
            s.off('comando_silenciar', onSilenciar);
        };
    }, [socketRef.current, userId, chatActive, makeCall]);

    // Scroll al último mensaje
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Acciones ──────────────────────────────────────────────────
    const startTalking = useCallback(async () => {
        if (!chatActive || isMuted || isBanned || !isPlayer) return;
        const stream = await getLocalStream().catch(() => null);
        if (!stream) return;
        stream.getAudioTracks()[0].enabled = true;
        setIsTalking(true);
    }, [chatActive, isMuted, isBanned, isPlayer, getLocalStream]);

    const stopTalking = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks()[0].enabled = false;
        }
        setIsTalking(false);
    }, []);

    const toggleMute = () => {
        if (isBanned) return;
        const next = !isMuted;
        setIsMuted(next);
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks()[0].enabled = false; // siempre off al cambiar
        }
        socketRef.current?.emit('toggle_mute_local', { mutedSelf: next });
    };

    const toggleDeafen = () => {
        const next = !deafened;
        setDeafened(next);
        remoteAudiosRef.current.forEach(audio => { audio.muted = next; });
    };

    const sendMessage = () => {
        const s = socketRef.current;
        if (!s || !input.trim() || !chatActive) return;
        s.emit('chat message', { userId, username, texto: input.trim() });
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation(); // ← evita que WASD/espacio lleguen al juego
        if (e.key === 'Enter') sendMessage();
    };

    // ── Render ────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full select-none">

            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 bg-black/40">
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${chatActive ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-red-500'}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                        Arena Chat
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {/* Deafen (silenciar audio entrante) */}
                    <button
                        onClick={toggleDeafen}
                        title={deafened ? 'Escuchar rivales' : 'Silenciar rivales'}
                        className={`p-1.5 rounded-lg transition-all ${deafened ? 'bg-yellow-600/80 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'}`}
                    >
                        {deafened ? <VolumeX size={11} /> : <Volume2 size={11} />}
                    </button>
                    {/* Self mute */}
                    <button
                        onClick={toggleMute}
                        disabled={isBanned}
                        title={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
                        className={`p-1.5 rounded-lg transition-all ${isMuted ? 'bg-red-600/80 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'} disabled:opacity-30`}
                    >
                        {isMuted ? <MicOff size={11} /> : <Mic size={11} />}
                    </button>
                </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0 scrollbar-thin">
                {messages.length === 0 && (
                    <p className="text-center text-[10px] text-white/15 mt-6 uppercase tracking-widest">
                        {chatActive ? 'Sin mensajes aún' : 'Esperando inicio...'}
                    </p>
                )}
                {messages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.isSystem ? 'items-center' : m.esMio ? 'items-end' : 'items-start'}`}>
                        {!m.isSystem && (
                            <span className="text-[8px] text-white/25 mb-0.5 px-1">{m.username}</span>
                        )}
                        <div className={`px-2.5 py-1.5 rounded-lg text-[11px] max-w-[88%] break-words leading-relaxed ${
                            m.isSystem
                                ? 'bg-red-900/40 text-red-300 border border-red-500/20 text-center text-[10px]'
                                : m.esMio
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-white/8 text-white/75 border border-white/5'
                        }`}>
                            {m.texto}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* PTT — solo si es jugador */}
            {isPlayer && (
                <div className="px-2 py-2 border-t border-white/5">
                    {isBanned ? (
                        <div className="w-full py-2 text-center text-[10px] text-red-400 font-black uppercase tracking-wider bg-red-900/20 rounded-lg border border-red-500/20">
                            🚫 Micrófono bloqueado
                        </div>
                    ) : (
                        <button
                            onMouseDown={startTalking}
                            onMouseUp={stopTalking}
                            onMouseLeave={stopTalking}
                            onTouchStart={e => { e.preventDefault(); startTalking(); }}
                            onTouchEnd={e => { e.preventDefault(); stopTalking(); }}
                            disabled={!chatActive || isMuted}
                            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all
                                ${isTalking
                                    ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.5)]'
                                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 border border-white/5'
                                }
                                disabled:opacity-25 disabled:cursor-not-allowed`}
                        >
                            <Mic size={11} />
                            {isTalking ? 'Hablando...' : !chatActive ? 'Esperando partida...' : 'PTT — Mantener'}
                        </button>
                    )}
                </div>
            )}

            {/* Input texto */}
            <div className="flex gap-1.5 px-2 py-2 border-t border-white/5 bg-black/20">
                <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!chatActive}
                    placeholder={chatActive ? 'Mensaje...' : 'Chat inactivo'}
                    className="flex-1 bg-white/5 border border-white/8 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-orange-500/40 placeholder:text-white/15 disabled:opacity-30 transition-colors"
                />
                <button
                    onClick={sendMessage}
                    disabled={!chatActive || !input.trim()}
                    className="p-1.5 bg-orange-600 hover:bg-orange-500 rounded-lg disabled:opacity-25 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    <Send size={11} className="text-white" />
                </button>
            </div>
        </div>
    );
};