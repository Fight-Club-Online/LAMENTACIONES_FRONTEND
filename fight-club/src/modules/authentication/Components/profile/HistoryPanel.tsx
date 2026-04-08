import { Sword, Trophy, Skull } from 'lucide-react';

interface ArenaCombat {
    id: string;
    opponent: string;
    arenaName: string;
    timeAgo: string; 
    result: 'VICTORIA' | 'DERROTA';
    pointsChange: number; 
}

const combatHistory: ArenaCombat[] = [
    { id: '1', opponent: 'ShadowFist99', arenaName: 'Templo del Caos', timeAgo: 'hace 2h', result: 'VICTORIA', pointsChange: 28 },
    { id: '2', opponent: 'DragonKick_X', arenaName: 'Callejón de Acero', timeAgo: 'hace 5h', result: 'DERROTA', pointsChange: -12 },
    { id: '3', opponent: 'IronKnuckle', arenaName: 'Arena del Fuego', timeAgo: 'hace 1d', result: 'VICTORIA', pointsChange: 31 },
    { id: '4', opponent: 'BlazeFighter', arenaName: 'Templo del Caos', timeAgo: 'hace 2d', result: 'VICTORIA', pointsChange: 25 },
];

export const HistoryPanel = () => {
    return (
        <div className="bg-[#161616] border border-white/5 rounded-2xl p-6 h-full flex flex-col shadow-2xl relative overflow-hidden group">
            
            {/* Cabecera del Panel */}
            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40 mb-6 flex items-center gap-2 border-b border-white/5 pb-3">
                <Sword size={12} className="text-orange-500" /> 
                Historial de la Arena (Mock)
            </h3>

            {/* Lista de Combates */}
            <div className="space-y-3 flex-1">
                {combatHistory.map((combat) => (
                    <div 
                        key={combat.id} 
                        className="flex items-center gap-4 bg-black border border-white/5 p-4 rounded-xl hover:border-orange-500/20 transition-all duration-300 group"
                    >
                        {/* Icono: Trofeo para Victoria, Calavera para Derrota */}
                        <div className={`p-3 rounded-lg ${combat.result === 'VICTORIA' ? 'bg-green-950/50 text-green-500' : 'bg-red-950/50 text-red-500'}`}>
                            {combat.result === 'VICTORIA' ? <Trophy size={16} /> : <Skull size={16} />}
                        </div>

                        {/* Detalles del Combate (Oponente y Arena) */}
                        <div className="flex-1">
                            <p className="text-sm font-black italic text-white uppercase tracking-tighter group-hover:text-orange-500 transition-colors">
                                vs {combat.opponent}
                            </p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                {combat.arenaName} • {combat.timeAgo}
                            </p>
                        </div>

                        {/* Resultado y Puntos */}
                        <div className="text-right">
                            <p className={`text-xs font-black uppercase tracking-widest ${combat.result === 'VICTORIA' ? 'text-green-500' : 'text-red-500'}`}>
                                {combat.result}
                            </p>
                            <p className={`text-sm font-black ${combat.pointsChange > 0 ? 'text-green-500/70' : 'text-red-500/70'}`}>
                                {combat.pointsChange > 0 ? `+${combat.pointsChange}` : combat.pointsChange} pts
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};