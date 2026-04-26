import { Trophy } from 'lucide-react';
import type { UserStats, RankName, Achievement } from '../../types/dashboard.types';

interface Props {
    stats: UserStats;
    achievements: Achievement[];
}

const RADAR_SIZE = 160;
const CENTER = RADAR_SIZE / 2;
const RADIUS = 60;

function hexPoint(index: number, total: number, ratio: number): [number, number] {
    const angle = ((360 / total) * index - 90) * (Math.PI / 180);
    return [
        CENTER + RADIUS * ratio * Math.cos(angle),
        CENTER + RADIUS * ratio * Math.sin(angle),
    ];
}
function toPoints(ratios: number[], total: number): string {
    return ratios.map((r, i) => hexPoint(i, total, r).join(',')).join(' ');
}

const RANK_META: Record<string, { color: string; bg: string; border: string }> = {
    HIERRO:   { color: 'text-zinc-400',   bg: 'bg-zinc-800/40',   border: 'border-zinc-600/30' },
    BRONCE:   { color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-500/30' },
    PLATA:    { color: 'text-zinc-200',   bg: 'bg-zinc-700/30',   border: 'border-zinc-400/30' },
    ORO:      { color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-500/30' },
    DIAMANTE: { color: 'text-blue-300',   bg: 'bg-blue-900/20',   border: 'border-blue-400/30' },
    PLATINO:  { color: 'text-cyan-300',   bg: 'bg-cyan-900/20',   border: 'border-cyan-400/30' },
};

const RANK_DISPLAY: Record<RankName, string> = {
    HIERRO_I: 'Hierro I',     HIERRO_II: 'Hierro II',     HIERRO_III: 'Hierro III',
    BRONCE_I: 'Bronce I',     BRONCE_II: 'Bronce II',     BRONCE_III: 'Bronce III',
    PLATA_I:  'Plata I',      PLATA_II:  'Plata II',      PLATA_III:  'Plata III',
    ORO_I:    'Oro I',        ORO_II:    'Oro II',        ORO_III:    'Oro III',
    DIAMANTE_I: 'Diamante I', DIAMANTE_II: 'Diamante II', DIAMANTE_III: 'Diamante III',
    PLATINO: 'Platino',
};

const RANK_THRESHOLDS: [number, string][] = [
    [0, 'Hierro I'], [100, 'Hierro II'], [200, 'Hierro III'],
    [300, 'Bronce I'], [400, 'Bronce II'], [500, 'Bronce III'],
    [600, 'Plata I'], [700, 'Plata II'], [800, 'Plata III'],
    [900, 'Oro I'], [1000, 'Oro II'], [1100, 'Oro III'],
    [1200, 'Diamante I'], [1300, 'Diamante II'], [1400, 'Diamante III'],
    [1500, 'Platino'],
];

function getRankProgress(points: number) {
    for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
        if (points >= RANK_THRESHOLDS[i][0]) {
            const current  = RANK_THRESHOLDS[i][0];
            const next     = RANK_THRESHOLDS[i + 1]?.[0] ?? current;
            const nextLabel = RANK_THRESHOLDS[i + 1]?.[1] ?? 'Máximo';
            const range    = next - current;
            const pct      = range > 0 ? Math.min(((points - current) / range) * 100, 100) : 100;
            return { current, next, label: nextLabel, pct };
        }
    }
    return { current: 0, next: 100, label: 'Hierro II', pct: 0 };
}

function getTier(rank: RankName): string {
    if (!rank) return 'HIERRO';
    return rank.replace(/_I{1,3}$/, '');
}

const ACHIEVEMENT_META: Record<Achievement, { displayName: string; description: string; icon: string }> = {
    PRIMERA_SANGRE:   { displayName: 'Primera Sangre',  description: 'Ganar el primer combate',        icon: '🔥' },
    VETERANO:         { displayName: 'Veterano',         description: '50+ combates disputados',        icon: '⚔️' },
    CAZADOR:          { displayName: 'Cazador',          description: 'Derrotar a 10 oponentes únicos', icon: '🎯' },
    LEYENDA:          { displayName: 'Leyenda',          description: 'Alcanzar 100 victorias',         icon: '👑' },
    RACHA_DE_5:       { displayName: 'Racha de 5',       description: '5 victorias consecutivas',       icon: '⚡' },
    RACHA_DE_10:      { displayName: 'Racha de 10',      description: '10 victorias consecutivas',      icon: '💥' },
    INVICTO_DEL_DIA:  { displayName: 'Invicto del Día',  description: 'Ganar 5 peleas en un día',       icon: '☀️' },
    MAESTRO_DEL_RING: { displayName: 'Maestro del Ring', description: 'Alcanzar rango Platino',         icon: '🏆' },
};

const ALL_ACHIEVEMENTS: Achievement[] = [
    'PRIMERA_SANGRE', 'RACHA_DE_5', 'VETERANO',
    'RACHA_DE_10', 'CAZADOR', 'INVICTO_DEL_DIA',
    'MAESTRO_DEL_RING', 'LEYENDA',
];

export const WinRatePanel = ({ stats, achievements }: Props) => {
    const winRate = stats.totalFights > 0
        ? +((stats.wins / stats.totalFights) * 100).toFixed(1)
        : 0;

    const tier         = getTier(stats.rank ?? 'HIERRO_I');
    const rankStyle    = RANK_META[tier] ?? RANK_META.HIERRO;
    const rankDisplay  = stats.rank ? (RANK_DISPLAY[stats.rank] ?? 'Hierro I') : 'Hierro I';
    const rankProgress = getRankProgress(stats.points);

    const axes = [
        { label: 'Vict',  raw: stats.wins,        max: Math.max(stats.totalFights, 1) },
        { label: 'Solid', raw: stats.totalFights - stats.losses, max: Math.max(stats.totalFights, 1) },
        { label: 'Racha', raw: stats.streak,       max: 10 },
        { label: 'Pts',   raw: stats.points,       max: 1500 },
        { label: 'Segs',  raw: stats.followers,    max: Math.max(stats.followers, 50) },
        { label: 'Lucha', raw: stats.totalFights,  max: 100 },
    ];

    const ratios     = axes.map(a => Math.min(Math.max(a.raw / a.max, 0.04), 1));
    const polyPoints = toPoints(ratios, axes.length);
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
    const maxPips    = 5;

    const unlockedSet   = new Set(achievements ?? []);
    const unlockedCount = unlockedSet.size;
    const sorted = [...ALL_ACHIEVEMENTS].sort((a, b) =>
        (unlockedSet.has(a) ? 0 : 1) - (unlockedSet.has(b) ? 0 : 1)
    );

    return (
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-6 flex flex-col gap-5">

            {/* Header */}
            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40 flex items-center gap-2 border-b border-white/5 pb-3">
                <svg className="text-orange-500" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                Perfil de Combate
            </h3>

            {/* Radar + stats */}
            <div className="flex items-center gap-4">
                <svg width={RADAR_SIZE} height={RADAR_SIZE}
                    viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`} className="shrink-0">
                    {gridLevels.map(lvl => (
                        <polygon key={lvl}
                            points={toPoints(Array(axes.length).fill(lvl), axes.length)}
                            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                    ))}
                    {axes.map((_, i) => {
                        const [x, y] = hexPoint(i, axes.length, 1);
                        return <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y}
                            stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />;
                    })}
                    <polygon points={polyPoints}
                        fill="rgba(249,115,22,0.15)" stroke="#f97316" strokeWidth="1.5" />
                    {ratios.map((r, i) => {
                        const [x, y] = hexPoint(i, axes.length, r);
                        return <circle key={i} cx={x} cy={y} r="2.5" fill="#f97316" />;
                    })}
                    {axes.map((a, i) => {
                        const [x, y] = hexPoint(i, axes.length, 1 + 12 / RADIUS);
                        return (
                            <text key={i} x={x} y={y} textAnchor="middle"
                                dominantBaseline="central"
                                fill="rgba(255,255,255,0.35)" fontSize="7" fontWeight="700">
                                {a.label}
                            </text>
                        );
                    })}
                </svg>

                <div className="flex flex-col gap-2.5 flex-1">
                    {/* Rango */}
                    <div className={`${rankStyle.bg} border ${rankStyle.border} rounded-xl p-2.5 text-center`}>
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 mb-0.5">Rango</p>
                        <p className={`text-sm font-black italic ${rankStyle.color}`}>{rankDisplay}</p>
                    </div>
                    {/* Victorias / Derrotas */}
                    <div className="flex gap-2">
                        <div className="flex-1 bg-black border border-white/5 rounded-xl p-2 text-center">
                            <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Vict</p>
                            <p className="text-sm font-black italic text-green-400">{stats.wins}</p>
                        </div>
                        <div className="flex-1 bg-black border border-white/5 rounded-xl p-2 text-center">
                            <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Derrt</p>
                            <p className="text-sm font-black italic text-red-400">{stats.losses}</p>
                        </div>
                    </div>
                    {/* Racha */}
                    <div className="bg-black border border-white/5 rounded-xl p-2 flex items-center justify-between">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Racha</p>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black italic text-white">{stats.streak}</span>
                            <div className="flex gap-0.5">
                                {Array.from({ length: maxPips }).map((_, i) => (
                                    <div key={i} className={`w-1.5 h-1.5 rounded-[2px] ${
                                        i < Math.min(stats.streak, maxPips) ? 'bg-orange-500' : 'bg-white/[0.08]'
                                    }`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progreso rango */}
            <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Próximo rango</span>
                    <span className={`text-[9px] font-black italic ${rankStyle.color}`}>{rankProgress.label}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden p-[1px]">
                    <div style={{ width: `${rankProgress.pct}%` }}
                        className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-orange-900 to-orange-500" />
                </div>
                <p className="text-[9px] text-white/20 font-bold">{stats.points} / {rankProgress.next} pts</p>
            </div>

            {/* Efectividad */}
            <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Efectividad</span>
                    <span className="text-orange-500 font-black italic text-sm">{winRate}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden p-[1px]">
                    <div style={{ width: `${winRate}%` }}
                        className="h-full bg-gradient-to-r from-green-900 to-green-500 rounded-full transition-all duration-1000" />
                </div>
                <div className="flex gap-4 text-[9px] font-black uppercase tracking-[0.15em] pt-1 border-t border-white/5">
                    <span className="text-green-500/80">{stats.wins} Victorias</span>
                    <span className="text-red-500/80">{stats.losses} Derrotas</span>
                    <span className="text-zinc-500">{stats.draws} Empates</span>
                </div>
            </div>

            {/* ── Logros ── */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40 flex items-center gap-2">
                        <Trophy size={11} className="text-orange-500" />
                        Logros de Combate
                    </h4>
                    <span className="text-[10px] font-black text-orange-500">
                        {unlockedCount}/{ALL_ACHIEVEMENTS.length}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {sorted.map((key) => {
                        const meta     = ACHIEVEMENT_META[key];
                        const unlocked = unlockedSet.has(key);
                        return (
                            <div key={key} className={`
                                relative flex items-center gap-2 p-2.5 rounded-xl border transition-all
                                ${unlocked
                                    ? 'bg-black border-orange-500/20 hover:border-orange-500/40'
                                    : 'bg-black/20 border-white/5 opacity-40'
                                }
                            `}>
                                {/* Ícono */}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0
                                    ${unlocked ? 'bg-orange-500/15' : 'bg-white/5 grayscale'}`}>
                                    {unlocked ? meta.icon : '☆'}
                                </div>
                                {/* Texto */}
                                <div className="min-w-0">
                                    <p className={`text-[10px] font-black uppercase tracking-tight leading-none mb-0.5 truncate
                                        ${unlocked ? 'text-white' : 'text-white/30'}`}>
                                        {meta.displayName}
                                    </p>
                                    <p className="text-[8px] text-white/25 font-medium leading-tight line-clamp-1">
                                        {meta.description}
                                    </p>
                                </div>
                                {/* Punto verde */}
                                {unlocked && (
                                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};