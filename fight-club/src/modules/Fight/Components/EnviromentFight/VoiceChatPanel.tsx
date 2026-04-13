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

interface ListaSocketItem {
    socketId: string;
    userId: string;
    username: string | null;
    playerType: 'PLAYER' | 'SPECTATOR';
}

interface Props {
    socketRef: React.MutableRefObject<Socket | null>;
    userId: string;
    username: string;
    isPlayer?: boolean;
}

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
    ],
};

const PALABRAS_BANEADAS = [
    "tonto","feo","spam","maldito","idiota","estupido","imbecil","idiota",
    "mierda","puta","puto","cabron","hijueputa","hp","culero","pendejo",
    "maricon","hdp","gonorrea","malparido","mongolo","retrasado","inutil",
    "bastardo","desgraciado","animal","asco","basura","muerto","subnormal",
    "gilipollas","coño","joder","hostia","cagada","perra","perro","zorra",
    "fuck","shit","bitch","asshole","damn","crap","idiot","moron","loser",
];

function filtrarTexto(texto: string): { filtrado: string; huboInfraccion: boolean } {
    let filtrado = texto;
    let huboInfraccion = false;
    PALABRAS_BANEADAS.forEach(p => {
        const regex = new RegExp(`\\b${p}\\b`, 'gi');
        if (regex.test(filtrado)) { huboInfraccion = true; }
        filtrado = filtrado.replace(regex, '****');
    });
    return { filtrado, huboInfraccion };
}

export const VoiceChatPanel: React.FC<Props> = ({
    socketRef, userId, username, isPlayer = true
}) => {
    const [messages, setMessages]       = useState<Message[]>([]);
    const [input, setInput]             = useState('');
    const [isTalking, setIsTalking]     = useState(false);
    const [isMuted, setIsMuted]         = useState(false);
    const [deafened, setDeafened]       = useState(false);
    const [chatActive, setChatActive]   = useState(false);
    const [isBanned, setIsBanned]       = useState(false);
    const [peers, setPeers]             = useState<string[]>([]);

    const messagesEndRef    = useRef<HTMLDivElement>(null);
    const localStreamRef    = useRef<MediaStream | null>(null);
    const peerConnsRef      = useRef<Map<string, RTCPeerConnection>>(new Map());
    const remoteAudiosRef   = useRef<Map<string, HTMLAudioElement>>(new Map());
    const chatActiveRef     = useRef(false);
    const pendingPeersRef   = useRef<{ userId: string; isInitiator: boolean }[]>([]);
    const currentFightIdRef = useRef<string | null>(null);
    const cleanupAllConnections = useCallback(() => {
        peerConnsRef.current.forEach(pc => pc.close());
        peerConnsRef.current.clear();
        remoteAudiosRef.current.forEach(a => a.remove());
        remoteAudiosRef.current.clear();
        setPeers([]);
        pendingPeersRef.current = [];
    }, []);

    // ── Auto-scroll ──────────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addSystemMsg = (texto: string) => {
        setMessages(prev => [...prev, {
            id: crypto.randomUUID(), username: '⚙️ Sistema',
            texto, esMio: false, isSystem: true,
        }]);
    };

    // ── Stream local ──────────────────────────────────────────────
    const getLocalStream = useCallback(async (): Promise<MediaStream> => {
        if (localStreamRef.current) return localStreamRef.current;
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: false,
        });
        stream.getAudioTracks()[0].enabled = false; // empieza muteado
        localStreamRef.current = stream;
        return stream;
    }, []);

    // ── Crear RTCPeerConnection con un usuario ───────────────────
    const createPeerConn = useCallback((targetUserId: string, isInitiator: boolean) => {
        const s = socketRef.current;
        if (!s || peerConnsRef.current.has(targetUserId)) return;

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnsRef.current.set(targetUserId, pc);

        // ICE candidates → servidor
        pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
                s.emit('rtc-ice-candidate', { toUserId: targetUserId, candidate });
            }
        };

        // Audio remoto
        pc.ontrack = ({ streams }) => {
            console.log('[ONTRACK] Stream remoto recibido de:', targetUserId);
            const stream = streams[0];
            let audio = remoteAudiosRef.current.get(targetUserId);
            if (!audio) {
                audio = document.createElement('audio');
                audio.autoplay = true;
                audio.style.display = 'none';
                document.body.appendChild(audio);
                remoteAudiosRef.current.set(targetUserId, audio);
            }
            audio.srcObject = stream;
            audio.muted = deafened;
            audio.play().catch(e => console.error('[AUDIO] Autoplay bloqueado:', e));
            setPeers(prev => prev.includes(targetUserId) ? prev : [...prev, targetUserId]);
        };

        pc.onconnectionstatechange = () => {
            console.log(`[WebRTC] Estado con ${targetUserId}:`, pc.connectionState);
            if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                peerConnsRef.current.delete(targetUserId);
                setPeers(prev => prev.filter(id => id !== targetUserId));
                const audio = remoteAudiosRef.current.get(targetUserId);
                if (audio) { audio.remove(); remoteAudiosRef.current.delete(targetUserId); }
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`[ICE] Estado con ${targetUserId}:`, pc.iceConnectionState);
        };

        // Solo jugadores agregan audio local; espectadores solo reciben
        if (isPlayer) {
            getLocalStream().then(stream => {
                stream.getTracks().forEach(t => {
                    if (!pc.getSenders().find(s => s.track === t)) {
                        pc.addTrack(t, stream);
                    }
                });
                if (isInitiator) {
                    setTimeout(() => {
                        pc.createOffer()
                        .then(offer => pc.setLocalDescription(offer))
                        .then(() => {
                            console.log('[VOICE] rtc-offer ENVIADO a:', targetUserId);
                            s.emit('rtc-offer', { toUserId: targetUserId, offer: pc.localDescription });
                        });
                    }, 1500);
                }
            });
        }

        return pc;
    }, [socketRef, deafened, getLocalStream]);

        const tryConnectPendingPeers = useCallback(() => {
        pendingPeersRef.current.forEach(({ userId: peerId, isInitiator }) => {
            if (!peerConnsRef.current.has(peerId)) {
                getLocalStream()
                    .then(() => createPeerConn(peerId, isInitiator))
                    .catch(err => addSystemMsg(`🎤 Sin acceso al micrófono: ${err.message}`));
            }
        });
        pendingPeersRef.current = [];
    }, [createPeerConn, getLocalStream]);

    // ── Socket events ─────────────────────────────────────────────
    useEffect(() => {
        const s = socketRef.current;
        if (!s) return;

        if (s.connected) {
            const pathParts = window.location.pathname.split('/');
            const fightIndex = pathParts.indexOf('fight');
            const fightId = fightIndex !== -1 ? pathParts[fightIndex + 1] : null;
            if (fightId) {
                s.emit('join_fight', { fightId, userId, username });
            }
        }

        // Estado de partida
        const onEstado = ({ activo, fightId: newFightId }: { activo: boolean; fightId?: string }) => {
            console.log('[VOICE] estado_chat recibido:', activo, '| pendingPeers:', pendingPeersRef.current.length);
            if (!activo) {
                cleanupAllConnections();
                setChatActive(false);
                chatActiveRef.current = false;
                currentFightIdRef.current = null;
                return;
            }
            // Si cambió el fightId, limpiar conexiones de la pelea anterior
            if (newFightId && currentFightIdRef.current && currentFightIdRef.current !== newFightId) {
                console.log(`[VOICE] Nueva pelea detectada, limpiando conexiones antiguas`);
                cleanupAllConnections();
            }
            if (newFightId) currentFightIdRef.current = newFightId;
            setChatActive(true);
            chatActiveRef.current = true;
            tryConnectPendingPeers();
        };

        // Lista de usuarios autorizados → iniciar conexiones
        const onListaSockets = (lista: ListaSocketItem[]) => {
            console.log('[VOICE] listaSockets recibido:', lista, '| chatActive:', chatActiveRef.current, '| isPlayer:', isPlayer);
            lista.forEach(item => {
                if (!item.userId || item.userId === userId) return;
                if (peerConnsRef.current.has(item.userId)) return;

                let isInitiator = false;
                if (isPlayer) {
                    isInitiator = item.playerType === 'SPECTATOR' ? true : userId > item.userId;
                }

                console.log(`[VOICE] Conectando con ${item.userId} [${item.playerType}] | soyIniciador: ${isInitiator}`);

                if (chatActiveRef.current) {
                    if (isPlayer) {
                        getLocalStream()
                            .then(() => createPeerConn(item.userId, isInitiator))
                            .catch(err => addSystemMsg(`🎤 Sin acceso al micrófono: ${err.message}`));
                    } else {
                        // Espectador conecta sin micrófono para recibir audio
                        createPeerConn(item.userId, false);
                    }
                } else {
                    if (!pendingPeersRef.current.find(p => p.userId === item.userId)) {
                        pendingPeersRef.current.push({ userId: item.userId, isInitiator });
                    }
                }
            });
        };

        // Señalización WebRTC
        const onOffer = async ({ fromUserId, offer }: any) => {
            console.log('[VOICE] rtc-offer RECIBIDO de:', fromUserId);
        const stream = isPlayer ? await getLocalStream().catch(() => null) : null;

        // Reutiliza la pc existente o crea una nueva
        let pc = peerConnsRef.current.get(fromUserId);
        if (!pc) {
            pc = new RTCPeerConnection(ICE_SERVERS);
            peerConnsRef.current.set(fromUserId, pc);

            pc.onicecandidate = ({ candidate }) => {
            if (candidate) s.emit('rtc-ice-candidate', { toUserId: fromUserId, candidate });
            };
            pc.ontrack = ({ streams }) => {
                console.log('[ONTRACK] Stream remoto recibido de:', fromUserId);
                let audio = remoteAudiosRef.current.get(fromUserId);
                if (!audio) {
                    audio = document.createElement('audio');
                    audio.autoplay = true;
                    audio.style.display = 'none';
                    document.body.appendChild(audio);
                    remoteAudiosRef.current.set(fromUserId, audio);
                }
                audio.srcObject = streams[0];
                audio.muted = deafened;
                audio.play().catch(e => console.error('[AUDIO] Error autoplay:', e));
                setPeers(prev => prev.includes(fromUserId) ? prev : [...prev, fromUserId]);
            };
        }
        
        // Solo agrega tracks si no están ya
        if (stream && isPlayer) {
            stream.getTracks().forEach(t => {
                if (!pc!.getSenders().find(sender => sender.track === t)) {
                    pc!.addTrack(t, stream);
                }
            });
        }
        
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        s.emit('rtc-answer', { toUserId: fromUserId, answer: pc.localDescription });
    };

        const onAnswer = async ({ fromUserId, answer }: any) => {
            const pc = peerConnsRef.current.get(fromUserId);
            if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
        };

        const onIce = async ({ fromUserId, candidate }: any) => {
            const pc = peerConnsRef.current.get(fromUserId);
            if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        };

        // Mensajes de chat
        const onMessage = (msg: any) => {
            const { filtrado } = filtrarTexto(msg.texto || '');
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                username: msg.username || 'Anon',
                texto: filtrado,
                esMio: msg.userId === userId,
            }]);
        };

        const onAdvertencia = (data: { mensaje: string }) => {
            addSystemMsg(`⚠️ ${data.mensaje}`);
        };

        const onSilenciar = (targetSocketId: string) => {
            if (targetSocketId === s.id) {
                setIsBanned(true);
                setIsMuted(true);
                localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = false);
                addSystemMsg('🚫 Tu micrófono ha sido bloqueado por un moderador.');
            }
        };

        const onNotificacion = (msg: string) => addSystemMsg(msg);

        const onConnect = () => {
            const pathParts = window.location.pathname.split('/');
            const fightIndex = pathParts.indexOf('fight');
            const fightId = fightIndex !== -1 ? pathParts[fightIndex + 1] : null;

    
            if (fightId) {
                s.emit('join_fight', { fightId, userId, username });
            } else {
                s.emit('identificar', { userId, username });
   
            }
        };

        const onIdentificado = ({ ok }: { ok: boolean }) => {
            if (ok) {
                setChatActive(true);
                chatActiveRef.current = true;
                tryConnectPendingPeers();
            }
        };
        
        s.on('connect',      onConnect);
        s.on('identificado', onIdentificado);
        s.on('estado_chat',         onEstado);
        s.on('listaSockets',        onListaSockets);
        s.on('rtc-offer',           onOffer);
        s.on('rtc-answer',          onAnswer);
        s.on('rtc-ice-candidate',   onIce);
        s.on('chat message',        onMessage);
        s.on('advertencia_sistema', onAdvertencia);
        s.on('comando_silenciar',   onSilenciar);
        s.on('notificacion_sistema', onNotificacion);

        return () => {
            s.off('estado_chat',         onEstado);
            s.off('listaSockets',        onListaSockets);
            s.off('rtc-offer',           onOffer);
            s.off('rtc-answer',          onAnswer);
            s.off('rtc-ice-candidate',   onIce);
            s.off('chat message',        onMessage);
            s.off('advertencia_sistema', onAdvertencia);
            s.off('comando_silenciar',   onSilenciar);
            s.off('notificacion_sistema', onNotificacion);
            s.off('connect',             onConnect);      
            s.off('identificado',        onIdentificado);
        };
    }, [socketRef.current, userId, isPlayer, deafened, createPeerConn, getLocalStream, cleanupAllConnections]);

    // ── PTT ───────────────────────────────────────────────────────
    const startTalking = useCallback(async () => {
        if (!chatActiveRef.current || isMuted || isBanned || !isPlayer) return; 
        const stream = await getLocalStream().catch(() => null);
        if (!stream) return;
        stream.getAudioTracks()[0].enabled = true;
        console.log('[PTT] Track habilitado:', stream.getAudioTracks()[0].enabled); 
        setIsTalking(true);
    }, [isMuted, isBanned, isPlayer, getLocalStream]);

    const stopTalking = useCallback(() => {
        localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = false);
        setIsTalking(false);
    }, []);

    const toggleMute = () => {
        if (isBanned) return;
        const next = !isMuted;
        setIsMuted(next);
        if (next) localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = false);
        socketRef.current?.emit('toggle_mute_local', { mutedSelf: next });
    };

    const toggleDeafen = () => {
        const next = !deafened;
        setDeafened(next);
        remoteAudiosRef.current.forEach(audio => { audio.muted = next; });
    };

    const sendMessage = () => {
        const s = socketRef.current;
        if (!s || !input.trim() || !chatActive || !isPlayer) return;
        const { filtrado, huboInfraccion } = filtrarTexto(input.trim());
        s.emit('chat message', { userId, username, texto: filtrado });
        if (huboInfraccion) addSystemMsg('⚠️ Mensaje filtrado por lenguaje inapropiado.');
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation();
        if (e.key === 'Enter') sendMessage();
    };

    // ── Render 
    return (
        <div className="flex flex-col h-full bg-[#0d0d0f] select-none">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${
                        chatActive ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-white/20'
                    }`} />
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">
                        Arena Chat
                    </span>
                    {peers.length > 0 && (
                        <span className="text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full border border-green-500/20">
                            {peers.length} en voz
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={toggleDeafen} title={deafened ? 'Escuchar' : 'Silenciar rivales'}
                        className={`p-1.5 rounded-md transition-all ${deafened ? 'bg-yellow-500/20 text-yellow-400' : 'text-white/20 hover:text-white/50 hover:bg-white/5'}`}>
                        {deafened ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                    <button onClick={toggleMute} disabled={isBanned} title={isMuted ? 'Activar mic' : 'Silenciar mic'}
                        className={`p-1.5 rounded-md transition-all ${isMuted ? 'bg-red-500/20 text-red-400' : 'text-white/20 hover:text-white/50 hover:bg-white/5'} disabled:opacity-20`}>
                        {isMuted ? <MicOff size={12} /> : <Mic size={12} />}
                    </button>
                </div>
            </div>

            {/* ── Mensajes ── */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2 min-h-0">
                {messages.length === 0 && (
                    <p className="text-center text-[9px] text-white/10 mt-8 uppercase tracking-widest leading-relaxed">
                        {chatActive ? 'Sin mensajes aún...' : 'Esperando inicio\nde la partida'}
                    </p>
                )}
   
                {messages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.isSystem ? 'items-center' : m.esMio ? 'items-end' : 'items-start'}`}>
                        {!m.isSystem && (
                            <span className="text-[8px] text-white/20 mb-0.5 px-1 font-medium">
                                {m.esMio ? 'Tú' : m.username}
                            </span>
                        )}
                        <div className={`
                            max-w-[90%] break-words rounded-xl px-2.5 py-1.5 text-[11px] leading-relaxed
                            ${m.isSystem
                                ? 'bg-white/5 text-white/40 text-[9px] border border-white/5 italic px-3'
                                : m.esMio
                                    ? 'bg-orange-600 text-white rounded-br-sm'
                                    : 'bg-white/8 text-white/70 border border-white/5 rounded-bl-sm'
                            }
                        `}>
                            {m.texto}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* ── PTT ── */}
            {isPlayer && (
                <div className="px-2 py-1.5 border-t border-white/5">
                    {isBanned ? (
                        <div className="w-full py-2 text-center text-[9px] text-red-400 font-black uppercase tracking-wider bg-red-900/10 rounded-lg border border-red-500/10">
                            🚫 Micrófono bloqueado
                        </div>
                    ) : (
                        <button
                            onMouseDown={startTalking}
                            onMouseUp={stopTalking}
                            onMouseLeave={stopTalking}
                            onTouchStart={e => { e.preventDefault(); startTalking(); }}
                            onTouchEnd={e => { e.preventDefault(); stopTalking(); }}
                            disabled={isMuted}
                            className={`
                                w-full flex items-center justify-center gap-1.5 py-2 rounded-lg
                                text-[9px] font-black uppercase tracking-wider transition-all
                                ${isTalking
                                    ? 'bg-red-600 text-white shadow-[0_0_16px_rgba(220,38,38,0.4)]'
                                    : 'bg-white/4 text-white/25 hover:bg-white/8 hover:text-white/50 border border-white/5'
                                }
                                disabled:opacity-20 disabled:cursor-not-allowed
                            `}
                        >
                            <Mic size={10} />
                            {isTalking ? 'Hablando...' : 'Mantener — Hablar'}
                        </button>
                    )}
                </div>
            )}

            {/* ── Input texto ── */}
            {isPlayer && (
                <div className="flex gap-1.5 px-2 pb-2 pt-1 border-t border-white/5">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={false}
                        maxLength={200}
                       placeholder="Mensaje..."
                        className="
                            flex-1 bg-white/4 border border-white/8 rounded-lg
                            px-2.5 py-1.5 text-[11px] text-white outline-none
                            focus:border-orange-500/30 focus:bg-white/6
                            placeholder:text-white/15 disabled:opacity-20
                            transition-colors
                        "
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim()}
                        className="p-1.5 bg-orange-600 hover:bg-orange-500 active:scale-95 rounded-lg disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                        <Send size={11} className="text-white" />
                    </button>
                </div>
            )}

            {/* Mensaje para espectadores */}
            {!isPlayer && (
                <div className="px-3 py-3 border-t border-white/5 text-center">
                    <p className="text-[9px] text-white/20 uppercase tracking-widest">
                        Solo los jugadores pueden chatear
                    </p>
                </div>
            )}
        </div>
    );
};