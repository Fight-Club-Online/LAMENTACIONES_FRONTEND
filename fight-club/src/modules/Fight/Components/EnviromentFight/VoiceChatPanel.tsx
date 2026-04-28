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
    "tonto", "feo", "spam", "maldito", "idiota", "estupido", "imbecil", "idiota",
    "mierda", "puta", "puto", "cabron", "hijueputa", "hp", "culero", "pendejo",
    "maricon", "hdp", "gonorrea", "malparido", "mongolo", "retrasado", "inutil",
    "bastardo", "desgraciado", "animal", "asco", "basura", "muerto", "subnormal",
    "gilipollas", "coño", "joder", "hostia", "cagada", "perra", "perro", "zorra",
    "fuck", "shit", "bitch", "asshole", "damn", "crap", "idiot", "moron", "loser",
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
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTalking, setIsTalking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [deafened, setDeafened] = useState(false);
    const [chatActive, setChatActive] = useState(false);
    const [isBanned, setIsBanned] = useState(false);
    const [peers, setPeers] = useState<string[]>([]);
    const [opponent, setOpponent] = useState<{ userId: string; username: string } | null>(null);
    const [listaUsuarios, setListaUsuarios] = useState<ListaSocketItem[]>([]);
    const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());
    const chatActiveRef = useRef(false);
    const pendingPeersRef = useRef<{ userId: string; isInitiator: boolean }[]>([]);
    const currentFightIdRef = useRef<string | null>(null);
    const iceCandidateQueue = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
    const peerPlayerTypesRef = useRef<Map<string, string>>(new Map());
    const cleanupAllConnections = useCallback(() => {
        peerConnsRef.current.forEach(pc => pc.close());
        peerConnsRef.current.clear();
        remoteAudiosRef.current.forEach(a => a.remove());
        remoteAudiosRef.current.clear();
        iceCandidateQueue.current.clear();
        setPeers([]);
        pendingPeersRef.current = [];
    }, []);

    // Limpieza completa al desmontar el componente
    useEffect(() => {
        return () => {
            peerConnsRef.current.forEach(pc => pc.close());
            peerConnsRef.current.clear();
            remoteAudiosRef.current.forEach(audio => {
                audio.srcObject = null;
                audio.remove();
            });
            remoteAudiosRef.current.clear();
            // Detener el stream local 
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
            }
        };
    }, []);

    // ── Solicitar mic al montar si es jugador ─────────────────
    useEffect(() => {
        if (!isPlayer) return;
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                stream.getAudioTracks()[0].enabled = false;
                localStreamRef.current = stream;
                console.log('[MIC] Permiso concedido anticipadamente');
            })
            .catch(err => console.warn('[MIC] Permiso denegado:', err.message));
    }, [isPlayer]);

    // ── Cuando el rol cambia (SPECTATOR ↔ PLAYER), forzar reconexión total ──
    const prevIsPlayerRef = useRef<boolean | null>(null);
    useEffect(() => {
        if (prevIsPlayerRef.current === null) {
            prevIsPlayerRef.current = isPlayer;
            return;
        }
        if (prevIsPlayerRef.current === isPlayer) return;
        const wasPlayer = prevIsPlayerRef.current;
        prevIsPlayerRef.current = isPlayer;
        console.log(`[VOICE] Rol: ${wasPlayer ? 'PLAYER' : 'SPECTATOR'} → ${isPlayer ? 'PLAYER' : 'SPECTATOR'} | Cerrando conexiones`);

        peerConnsRef.current.forEach(pc => { try { pc.close(); } catch (_) { } });
        peerConnsRef.current.clear();

        remoteAudiosRef.current.forEach(a => {
            try { a.srcObject = null; a.remove(); } catch (_) { }
        });

        remoteAudiosRef.current.clear();
        setPeers([]);
        pendingPeersRef.current = [];

        if (isPlayer) {
            if (!localStreamRef.current) {
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(stream => {
                        stream.getAudioTracks()[0].enabled = false;
                        localStreamRef.current = stream;
                        console.log('[MIC] Stream listo para nuevo rol PLAYER');
                    })
                    .catch(err => console.warn('[MIC] Error al obtener micrófono:', err));
            }
        } else {
            if (localStreamRef.current) {
                localStreamRef.current.getAudioTracks().forEach(t => t.enabled = false);
                if (wasPlayer) {
                    localStreamRef.current.getTracks().forEach(t => t.stop());
                    localStreamRef.current = null;
                }
            }
        }
    }, [isPlayer]);

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
            audio.pause();
            audio.srcObject = stream;
            audio.muted = deafened || mutedUsers.has(targetUserId);
            audio.play().catch(e => console.error('[AUDIO] Autoplay bloqueado:', e));
            setPeers(prev => prev.includes(targetUserId) ? prev : [...prev, targetUserId]);
        };

        pc.onconnectionstatechange = () => {
            console.log(`[WebRTC] Estado con ${targetUserId}:`, pc.connectionState);
            if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                if (peerConnsRef.current.get(targetUserId) === pc) {
                    peerConnsRef.current.delete(targetUserId);
                    setPeers(prev => prev.filter(id => id !== targetUserId));
                    const audio = remoteAudiosRef.current.get(targetUserId);
                    if (audio) { audio.remove(); remoteAudiosRef.current.delete(targetUserId); }
                }
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`[ICE] Estado con ${targetUserId}:`, pc.iceConnectionState);
        };

        // Solo jugadores agregan audio local; espectadores solo reciben 
        if (isPlayer) {
            getLocalStream().then(stream => {
                if (pc.signalingState === 'closed') return;
                stream.getTracks().forEach(t => {
                    if (!pc.getSenders().find(s => s.track === t)) {
                        pc.addTrack(t, stream);
                    }
                });
                if (isInitiator) {
                    setTimeout(() => {
                        if (pc.signalingState === 'closed') return;
                        pc.createOffer()
                            .then(offer => pc.setLocalDescription(offer))
                            .then(() => {
                                console.log('[VOICE] rtc-offer ENVIADO a:', targetUserId);
                                s.emit('rtc-offer', { toUserId: targetUserId, offer: pc.localDescription });
                            });
                    }, 300);
                }
            });
        } else if (isInitiator) {
            pc.addTransceiver('audio', { direction: 'recvonly' });
            setTimeout(() => {
                pc.createOffer()
                    .then(offer => pc.setLocalDescription(offer))
                    .then(() => {
                        console.log('[VOICE] rtc-offer ESPECTADOR ENVIADO a:', targetUserId);
                        s.emit('rtc-offer', { toUserId: targetUserId, offer: pc.localDescription });
                    });
            }, 500);
        }

        return pc;
    }, [socketRef, deafened, getLocalStream, isPlayer]);

    const tryConnectPendingPeers = useCallback(() => {
        pendingPeersRef.current.forEach(({ userId: peerId }) => {
            if (!peerConnsRef.current.has(peerId)) {
                if (isPlayer) {
                    getLocalStream()
                        .then(() => createPeerConn(peerId, true))
                        .catch(err => addSystemMsg(`🎤 Sin acceso al micrófono: ${err.message}`));
                } else {
                    createPeerConn(peerId, false);
                }
            }
        });
        pendingPeersRef.current = [];
    }, [createPeerConn, getLocalStream, isPlayer]);

    // ── Socket events ─────────────────────────────────────────────
    useEffect(() => {
        const s = socketRef.current;
        if (!s) return;

        if (s.connected) {
            const pathParts = window.location.pathname.split('/');
            const fightIndex = pathParts.indexOf('fight');
            const fightId = fightIndex !== -1 ? pathParts[fightIndex + 1] : null;
            if (fightId) {
                s.emit('join_fight', {
                    fightId, userId, username, playerType:
                        isPlayer ? 'PLAYER' : 'SPECTATOR'
                });
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
            // Buscar rival real (solo PLAYER, no spectators)
            const rival = lista.find(item =>
                item.userId !== userId &&
                item.playerType === 'PLAYER'
            );

            if (rival) {
                setOpponent({
                    userId: rival.userId,
                    username: rival.username || 'Rival'
                });
            } else {
                setOpponent(null);
            }
            setListaUsuarios(lista);
            console.log('[VOICE] listaSockets recibido:', lista, '| chatActive:', chatActiveRef.current, '| isPlayer:', isPlayer);
            lista.forEach(item => {
                if (!item.userId || item.userId === userId) return;
                const prevType = peerPlayerTypesRef.current.get(item.userId);
                const roleChanged = prevType !== undefined && prevType !== item.playerType;
                peerPlayerTypesRef.current.set(item.userId, item.playerType);
                
                const existingPc = peerConnsRef.current.get(item.userId);
                if (existingPc) {
                    const badState = ['disconnected', 'failed', 'closed'].includes(existingPc.connectionState);
                    if (!badState && !roleChanged) return;
                    try { existingPc.close(); } catch (_) {}
                    peerConnsRef.current.delete(item.userId);
                    const staleAudio = remoteAudiosRef.current.get(item.userId);
                    if (staleAudio) {
                        try { staleAudio.srcObject = null; staleAudio.remove(); } catch (_) {}
                        remoteAudiosRef.current.delete(item.userId);
                    }
                    setPeers(prev => prev.filter(id => id !== item.userId));
                    iceCandidateQueue.current.delete(item.userId);
                }

                let isInitiator = false;
                if (isPlayer) {
                    isInitiator = item.playerType === 'PLAYER' && userId > item.userId;
                } else {
                    isInitiator = item.playerType === 'PLAYER';
                }

                console.log(`[VOICE] Conectando con ${item.userId} [${item.playerType}] | soyIniciador: ${isInitiator}`);

                if (chatActiveRef.current) {
                    createPeerConn(item.userId, isInitiator);
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
            const existingPc = peerConnsRef.current.get(fromUserId);
            if (existingPc) {
                try { existingPc.close(); } catch (_) {}
                peerConnsRef.current.delete(fromUserId);
                const oldAudio = remoteAudiosRef.current.get(fromUserId);
                if (oldAudio) { try { oldAudio.srcObject = null; oldAudio.remove(); } catch (_) {} remoteAudiosRef.current.delete(fromUserId); }
                setPeers(prev => prev.filter(id => id !== fromUserId));
                iceCandidateQueue.current.delete(fromUserId);
            }
            const stream = isPlayer ? await getLocalStream().catch(() => null) : null;
            const pc = new RTCPeerConnection(ICE_SERVERS);
            peerConnsRef.current.set(fromUserId, pc);

            pc.onconnectionstatechange = () => {
                if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                    if (peerConnsRef.current.get(fromUserId) === pc) {
                        peerConnsRef.current.delete(fromUserId);
                        setPeers(prev => prev.filter(id => id !== fromUserId));
                        const audio = remoteAudiosRef.current.get(fromUserId);
                        if (audio) { audio.remove(); remoteAudiosRef.current.delete(fromUserId); }
                    }
                }
            };
            
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
                audio.pause();
                audio.srcObject = streams[0];
                audio.muted = deafened || mutedUsers.has(fromUserId);
                audio.play().catch(e => console.error('[AUDIO] Error autoplay:', e));
                setPeers(prev => prev.includes(fromUserId) ? prev : [...prev, fromUserId]);
            };

            if (stream && isPlayer && pc.signalingState !== 'closed') {
                stream.getTracks().forEach(t => {
                    if (!pc.getSenders().find(sender => sender.track === t)) {
                        pc.addTrack(t, stream);
                    }
                });
            }

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const queuedOffer = iceCandidateQueue.current.get(fromUserId) ?? [];
            for (const c of queuedOffer) {
                await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
            }
            iceCandidateQueue.current.delete(fromUserId);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            s.emit('rtc-answer', { toUserId: fromUserId, answer: pc.localDescription });
        };

        const onAnswer = async ({ fromUserId, answer }: any) => {
            const pc = peerConnsRef.current.get(fromUserId);
            if (!pc) return;
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            const queuedAnswer = iceCandidateQueue.current.get(fromUserId) ?? [];
            for (const c of queuedAnswer) {
                await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
            }
            iceCandidateQueue.current.delete(fromUserId);
        };

        const onIce = async ({ fromUserId, candidate }: any) => {
            if (!candidate) return;
            const pc = peerConnsRef.current.get(fromUserId);
            if (!pc) return;
            if (!pc.remoteDescription) {
                const q = iceCandidateQueue.current.get(fromUserId) ?? [];
                q.push(candidate);
                iceCandidateQueue.current.set(fromUserId, q);
                return;
            }
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
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
                s.emit('join_fight', { fightId, userId, username, playerType: isPlayer ? 'PLAYER' : 'SPECTATOR' });
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

        s.on('connect', onConnect);
        s.on('identificado', onIdentificado);
        s.on('estado_chat', onEstado);
        s.on('listaSockets', onListaSockets);
        s.on('rtc-offer', onOffer);
        s.on('rtc-answer', onAnswer);
        s.on('rtc-ice-candidate', onIce);
        s.on('chat message', onMessage);
        s.on('advertencia_sistema', onAdvertencia);
        s.on('comando_silenciar', onSilenciar);
        s.on('notificacion_sistema', onNotificacion);

        return () => {
            s.off('estado_chat', onEstado);
            s.off('listaSockets', onListaSockets);
            s.off('rtc-offer', onOffer);
            s.off('rtc-answer', onAnswer);
            s.off('rtc-ice-candidate', onIce);
            s.off('chat message', onMessage);
            s.off('advertencia_sistema', onAdvertencia);
            s.off('comando_silenciar', onSilenciar);
            s.off('notificacion_sistema', onNotificacion);
            s.off('connect', onConnect);
            s.off('identificado', onIdentificado);
        };
    }, [socketRef.current, userId, isPlayer, deafened, createPeerConn, getLocalStream, cleanupAllConnections]);

    // ── PTT ───────────────────────────────────────────────────────
    const startTalking = useCallback(async () => {
        if (!chatActiveRef.current || isMuted || isBanned || !isPlayer) return;
        const stream = await getLocalStream().catch(() => null);
        if (!stream) return;
        const audioTrack = stream.getAudioTracks()[0];
        audioTrack.enabled = true;
        console.log('[PTT] Track habilitado:', audioTrack.enabled);

        peerConnsRef.current.forEach((pc, peerId) => {
            const yaAgregado = pc.getSenders().find(s => s.track === audioTrack);
            if (!yaAgregado && pc.connectionState === 'connected') {
                pc.addTrack(audioTrack, stream);
                pc.createOffer()
                    .then(offer => pc.setLocalDescription(offer))
                    .then(() => {
                        socketRef.current?.emit('rtc-offer', {
                            toUserId: peerId,
                            offer: pc.localDescription
                        });
                        console.log('[PTT] Renegociando con:', peerId);
                    });
            }
        });

        setIsTalking(true);
    }, [isMuted, isBanned, isPlayer, getLocalStream, socketRef]);

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
    const reportOpponent = () => {
        const s = socketRef.current;
        if (!s || !opponent) return;

        const motivo = prompt(`Motivo del reporte contra ${opponent.username}:`);

        if (!motivo || !motivo.trim()) return;

        s.emit('enviar_reporte', {
            targetId: opponent.userId,
            motivo: motivo.trim()
        });

        addSystemMsg(`🚨 Reporte enviado contra ${opponent.username}`);
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
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${chatActive ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-white/20'
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
            <div className="px-2 pb-2 space-y-1">
                {listaUsuarios
                .filter(u => u.userId !== userId)
                .map(u => {
                    const isConnected = peers.includes(u.userId);
                    const isMuted = mutedUsers.has(u.userId);
                    return (
                        <div
                            key={u.userId}
                            className="flex items-center justify-between bg-white/5 px-2 py-1 rounded"
                        >
                            <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-white/20'}`} />
                            <span className="text-[10px] text-white/70">
                                {u.username || u.userId}
                            </span>
                            <span className="text-[8px] text-white/30">
                                {u.playerType === 'PLAYER' ? '🎤' : '👁'}
                            </span>
                            </div>
                            {isConnected && (
                                <button
                                    onClick={() => {
                                    setMutedUsers(prev => {
                                        const next = new Set(prev);
                                        const willMute = !next.has(u.userId);
                                        if (willMute) next.add(u.userId);
                                        else next.delete(u.userId);
                                        const audio = remoteAudiosRef.current.get(u.userId);
                                        if (audio) audio.muted = willMute || deafened;
                                        return next;
                                    });
                                }}
                                className="text-[10px] px-2 py-1 rounded bg-orange-600 text-white"
                            >
                                {isMuted ? 'Escuchar' : 'Silenciar'}
                                </button>
                            )}
                            </div>
                            );})
                        }
                        </div>

            {isPlayer && opponent && (
                <button
                    onClick={reportOpponent}
                    title={`Reportar a ${opponent.username}`}
                    className="px-2 py-1 rounded-md text-[9px] bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all"
                >
                    🚨 {opponent.username}
                </button>
            )}


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