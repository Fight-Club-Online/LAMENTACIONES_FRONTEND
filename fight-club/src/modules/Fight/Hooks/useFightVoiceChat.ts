import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { Fight } from "../types/fight";

type ChatMessage = {
  userId: string;
  username?: string;
  texto: string;
  timestamp?: string;
};

type UseFightVoiceChatArgs = {
  fightId: string;
  userId: string;
  username?: string;
  gameState: Fight | null;
};

export const useFightVoiceChat = ({ fightId, userId, username, gameState }: UseFightVoiceChatArgs) => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasOfferedRef = useRef(false);

  const isFighter = useMemo(() => {
    if (!gameState?.player1 || !gameState?.player2) return false;
    return gameState.player1.userId === userId || gameState.player2.userId === userId;
  }, [gameState, userId]);

  const opponentUserId = useMemo(() => {
    if (!isFighter || !gameState?.player1 || !gameState?.player2) return null;
    return gameState.player1.userId === userId ? gameState.player2.userId : gameState.player1.userId;
  }, [gameState, isFighter, userId]);

  const isVoiceEnabled = Boolean(gameState?.active && isFighter && opponentUserId);

  useEffect(() => {
    setMessages([]);
    setChatInput("");
    setError(null);
  }, [fightId]);

  useEffect(() => {
    if (!isFighter) return;

    const token = localStorage.getItem("fight_club_token");
    const baseUrl = import.meta.env.VITE_API_VOICE_CHAT_URL || "http://localhost:3030";
    const socket = io(baseUrl, {
      transports: ["websocket"],
      auth: { token }
    });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("identificar", { userId, username: username || userId });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("chat message", (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on("estado_chat", ({ activo, fightId: activeFightId }: { activo: boolean; fightId?: string }) => {
      if (!activo || (activeFightId && activeFightId !== fightId)) {
        setError("El canal de voz de esta pelea no está activo.");
      } else {
        setError(null);
      }
    });

    socket.on("voice_access_denied", (payload: { reason?: string }) => {
      setError(payload?.reason || "Acceso denegado en el chat de pelea");
    });

    socket.on("notificacion_sistema", (payload: string) => {
      if (payload) setError(payload);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isFighter, userId, username]);

  useEffect(() => {
    if (!isFighter) return;

    const baseUrl = import.meta.env.VITE_API_VOICE_CHAT_URL || "http://localhost:3030";
    let cancelled = false;

    const loadHistory = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/mensajes/${fightId}`);
        if (!response.ok) {
          throw new Error("No se pudo cargar el historial");
        }

        const payload = await response.json();
        if (!cancelled && Array.isArray(payload)) {
          setMessages(payload);
        }
      } catch {
        if (!cancelled) {
          setError(prev => prev || "No se pudo cargar el historial del chat.");
        }
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [fightId, isFighter]);

  useEffect(() => {
    if (!isVoiceEnabled || !socketRef.current || !opponentUserId) return;

    const socket = socketRef.current;
    hasOfferedRef.current = false;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });
    peerRef.current = pc;

    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("rtc-ice-candidate", { toUserId: opponentUserId, candidate: event.candidate });
      }
    };

    const onOffer = async ({ fromUserId, offer }: { fromUserId: string; offer: RTCSessionDescriptionInit }) => {
      if (fromUserId !== opponentUserId || !peerRef.current) return;
      try {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socket.emit("rtc-answer", { toUserId: opponentUserId, answer });
      } catch (e) {
        setError("Error al responder oferta WebRTC");
      }
    };

    const onAnswer = async ({ fromUserId, answer }: { fromUserId: string; answer: RTCSessionDescriptionInit }) => {
      if (fromUserId !== opponentUserId || !peerRef.current) return;
      try {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch {
        setError("Error al aplicar respuesta WebRTC");
      }
    };

    const onIce = async ({ fromUserId, candidate }: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      if (fromUserId !== opponentUserId || !peerRef.current) return;
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        setError("Error al procesar ICE candidate");
      }
    };

    socket.on("rtc-offer", onOffer);
    socket.on("rtc-answer", onAnswer);
    socket.on("rtc-ice-candidate", onIce);

    const boot = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        if (!hasOfferedRef.current && userId.localeCompare(opponentUserId) < 0) {
          hasOfferedRef.current = true;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("rtc-offer", { toUserId: opponentUserId, offer });
        }
      } catch {
        setError("No se pudo acceder al micrófono");
      }
    };

    void boot();

    return () => {
      socket.off("rtc-offer", onOffer);
      socket.off("rtc-answer", onAnswer);
      socket.off("rtc-ice-candidate", onIce);
      pc.close();
      peerRef.current = null;
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      hasOfferedRef.current = false;
    };
  }, [isVoiceEnabled, opponentUserId, userId]);

  useEffect(() => {
    if (!remoteAudioRef.current) return;
    remoteAudioRef.current.muted = remoteMuted;
  }, [remoteMuted]);

  const sendChatMessage = () => {
    const socket = socketRef.current;
    const text = chatInput.trim();
    if (!socket || !text || !isFighter) return;

    socket.emit("chat message", { texto: text, fightId });
    setChatInput("");
  };

  return {
    connected,
    error,
    isFighter,
    isVoiceEnabled,
    messages,
    chatInput,
    setChatInput,
    sendChatMessage,
    remoteMuted,
    toggleRemoteMute: () => setRemoteMuted(prev => !prev),
    remoteAudioRef
  };
};
