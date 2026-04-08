import React from 'react';
import { Trophy, Swords, Flame, Users } from 'lucide-react';
import type { UserStats } from '../../types/dashboard.types';

interface HighlightCardProps {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    color: string;
}

const HighlightCard = ({ icon, label, value, color }: HighlightCardProps) => (
    <div className="bg-[#161616] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-orange-500/30 transition-all group shadow-inner">
        <div className={`${color} transition-colors opacity-80 group-hover:opacity-100 group-hover:scale-110 duration-300`}>
            {icon}
        </div>
        <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-black">
            {label}
        </span>
        
        <span className="text-3xl lg:text-4xl font-black italic text-white drop-shadow-md">
            {value === 0 && (label === "Racha" || label === "Combates") ? '--' : value}
        </span>
    </div>
);

export const StatsCards = ({ stats }: { stats: UserStats }) => {
    return (
        <>
            <HighlightCard icon={<Flame />} label="Racha" value={stats.streak} color="text-orange-500" />
            <HighlightCard icon={<Trophy />} label="Puntos" value={stats.points.toLocaleString()} color="text-yellow-500" />
            <HighlightCard icon={<Users />} label="Seguidores" value={stats.followers} color="text-blue-500" />
            <HighlightCard icon={<Swords />} label="Combates" value={stats.totalFights} color="text-red-500" />
        </>
    );
};