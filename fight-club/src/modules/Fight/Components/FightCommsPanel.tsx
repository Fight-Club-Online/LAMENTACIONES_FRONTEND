import React from "react";

type ChatMessage = {
  userId: string;
  username?: string;
  texto: string;
};

interface Props {
  connected: boolean;
  enabled: boolean;
  error: string | null;
  remoteMuted: boolean;
  onToggleRemoteMute: () => void;
  messages: ChatMessage[];
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendChat: () => void;
}

const FightCommsPanel: React.FC<Props> = ({
  connected,
  enabled,
  error,
  remoteMuted,
  onToggleRemoteMute,
  messages,
  chatInput,
  onChatInputChange,
  onSendChat
}) => {
  return (
    <aside className="absolute right-4 bottom-4 z-50 w-[340px] bg-zinc-950/85 border border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.2)] backdrop-blur rounded-md p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-black tracking-[0.2em] text-zinc-200 uppercase">Comms Fight</h3>
        <span className={`text-[10px] font-bold ${connected ? "text-green-400" : "text-red-400"}`}>
          {connected ? "ONLINE" : "OFFLINE"}
        </span>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={onToggleRemoteMute}
          disabled={!enabled}
          className="flex-1 px-3 py-2 text-xs font-bold uppercase bg-zinc-800 text-zinc-100 border border-zinc-700 disabled:opacity-40"
        >
          {remoteMuted ? "Unmute Oponente" : "Mute Oponente"}
        </button>
      </div>

      {error && (
        <div className="mb-3 border border-red-700/70 bg-red-950/60 px-2 py-2 text-[11px] text-red-200">
          {error}
        </div>
      )}

      <div className="h-36 overflow-y-auto bg-black/50 border border-zinc-800 p-2 space-y-1">
        {messages.slice(-40).map((msg, idx) => (
          <p key={`${msg.userId}-${idx}`} className="text-xs text-zinc-200">
            <span className="text-red-300 font-semibold">{msg.username || msg.userId}:</span> {msg.texto}
          </p>
        ))}
      </div>

      <div className="flex gap-2 mt-2">
        <input
          value={chatInput}
          onChange={(e) => onChatInputChange(e.target.value)}
          disabled={!enabled}
          placeholder={enabled ? "Escribe en combate..." : "Chat inactivo"}
          className="flex-1 bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs text-zinc-100 outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") onSendChat();
          }}
        />
        <button
          onClick={onSendChat}
          disabled={!enabled}
          className="px-3 py-1 text-xs font-bold uppercase bg-red-600 text-white disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </aside>
  );
};

export default FightCommsPanel;
