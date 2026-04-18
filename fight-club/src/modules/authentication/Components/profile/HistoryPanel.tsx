import { Sword, Trophy, Skull } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface FightRecord {
    id: string;
    opponentId: string;
    opponentName: string;
    result: 'VICTORIA' | 'DERROTA';
    pointsChange: number;
    fightDate: string;
}

const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor(diff / 60000);
    if (d > 0) return `hace ${d}d`;
    if (h > 0) return `hace ${h}h`;
    if (m > 0) return `hace ${m}m`;
    return 'ahora';
};

export const HistoryPanel = () => {
    const [history, setHistory] = useState<FightRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userData = localStorage.getItem('user_data');
        if (!userData) return;
        const { userId } = JSON.parse(userData);

        axios.get(`${import.meta.env.VITE_API_FIGHT_URL}/fight/history/${userId}`)
            .then(res => setHistory(res.data))
            .catch(() => setHistory([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-6 h-full flex flex-col shadow-2xl relative overflow-hidden group">
            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40 mb-6 flex items-center gap-2 border-b border-white/5 pb-3">
                <Sword size={12} className="text-orange-500" />
                Historial de la Arena
            </h3>

            {loading && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-6 h-6 border-t-2 border-orange-500 rounded-full animate-spin" />
                </div>
            )}

            {!loading && history.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-white/20 text-xs uppercase tracking-widest font-black">
                        Sin combates aún
                    </p>
                </div>
            )}

            <div className="space-y-3 flex-1">
                {history.map((fight) => (
                    <div key={fight.id}
                        className="flex items-center gap-4 bg-black border border-white/5 p-4 rounded-xl hover:border-orange-500/20 transition-all duration-300 group">
                        <div className={`p-3 rounded-lg ${fight.result === 'VICTORIA' ? 'bg-green-950/50 text-green-500' : 'bg-red-950/50 text-red-500'}`}>
                            {fight.result === 'VICTORIA' ? <Trophy size={16} /> : <Skull size={16} />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black italic text-white uppercase tracking-tighter group-hover:text-orange-500 transition-colors">
                                vs {fight.opponentName || fight.opponentId}
                            </p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                {timeAgo(fight.fightDate)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className={`text-xs font-black uppercase tracking-widest ${fight.result === 'VICTORIA' ? 'text-green-500' : 'text-red-500'}`}>
                                {fight.result}
                            </p>
                            <p className={`text-sm font-black ${fight.pointsChange > 0 ? 'text-green-500/70' : 'text-red-500/70'}`}>
                                {fight.pointsChange > 0 ? `+${fight.pointsChange}` : fight.pointsChange} pts
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};