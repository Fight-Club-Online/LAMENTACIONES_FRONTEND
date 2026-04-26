import { Trophy } from 'lucide-react';
import type { Achievement } from '../../types/dashboard.types';

interface Props {
    achievements: Achievement[];
}

// Metadata de logros 
const ACHIEVEMENT_META: Record<Achievement, {
    displayName: string;
    description: string;
    icon: string;
}> = {
    PRIMERA_SANGRE:  { displayName: 'Primera Sangre',   description: 'Ganar el primer combate',        icon: '🔥' },
    VETERANO:        { displayName: 'Veterano',          description: '50+ combates disputados',        icon: '⚔️' },
    CAZADOR:         { displayName: 'Cazador',           description: 'Derrotar a 10 oponentes únicos', icon: '🎯' },
    LEYENDA:         { displayName: 'Leyenda',           description: 'Alcanzar 100 victorias',         icon: '👑' },
    RACHA_DE_5:      { displayName: 'Racha de 5',        description: '5 victorias consecutivas',       icon: '⚡' },
    RACHA_DE_10:     { displayName: 'Racha de 10',       description: '10 victorias consecutivas',      icon: '💥' },
    INVICTO_DEL_DIA: { displayName: 'Invicto del Día',   description: 'Ganar 5 peleas en un día',       icon: '☀️' },
    MAESTRO_DEL_RING:{ displayName: 'Maestro del Ring',  description: 'Alcanzar rango Platino',         icon: '🏆' },
};

const ALL_ACHIEVEMENTS: Achievement[] = [
    'PRIMERA_SANGRE',
    'RACHA_DE_5',
    'VETERANO',
    'RACHA_DE_10',
    'CAZADOR',
    'INVICTO_DEL_DIA',
    'MAESTRO_DEL_RING',
    'LEYENDA',
];

export const AchievementsPanel = ({ achievements }: Props) => {
    const unlockedSet = new Set(achievements);
    const unlockedCount = unlockedSet.size;
    const totalCount = ALL_ACHIEVEMENTS.length;

    // Desbloqueados primero, luego bloqueados
    const sorted = [...ALL_ACHIEVEMENTS].sort((a, b) => {
        const aUnlocked = unlockedSet.has(a) ? 0 : 1;
        const bUnlocked = unlockedSet.has(b) ? 0 : 1;
        return aUnlocked - bUnlocked;
    });

    return (
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40 flex items-center gap-2">
                    <Trophy size={12} className="text-orange-500" />
                    Logros de Combate
                </h3>
                <span className="text-[10px] font-black text-orange-500">
                    {unlockedCount}/{totalCount}
                </span>
            </div>

            {/* Grid de logros */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {sorted.map((key) => {
                    const meta      = ACHIEVEMENT_META[key];
                    const unlocked  = unlockedSet.has(key);

                    return (
                        <div
                            key={key}
                            className={`
                                relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-300
                                ${unlocked
                                    ? 'bg-black border-orange-500/20 hover:border-orange-500/40'
                                    : 'bg-black/30 border-white/5 opacity-50'
                                }
                            `}
                        >
                            {/* Ícono */}
                            <div className={`
                                w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0
                                ${unlocked ? 'bg-orange-500/15' : 'bg-white/5 grayscale'}
                            `}>
                                {unlocked ? meta.icon : '☆'}
                            </div>

                            {/* Texto */}
                            <div className="min-w-0">
                                <p className={`text-[11px] font-black uppercase tracking-tight leading-none mb-1 truncate
                                    ${unlocked ? 'text-white' : 'text-white/30'}
                                `}>
                                    {meta.displayName}
                                </p>
                                <p className="text-[9px] text-white/30 font-medium leading-tight line-clamp-2">
                                    {meta.description}
                                </p>
                            </div>

                            {/* Punto verde si desbloqueado */}
                            {unlocked && (
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};