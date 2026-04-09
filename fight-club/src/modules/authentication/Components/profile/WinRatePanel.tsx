import type { UserStats } from '../../types/dashboard.types';

export const WinRatePanel = ({ stats }: { stats: UserStats }) => {
    const winRate = stats.totalFights > 0 
        ? ((stats.wins / stats.totalFights) * 100).toFixed(1) 
        : "0.0";

    return (

        <div className="bg-[#161616] border border-white/5 rounded-2xl p-6 h-full flex flex-col justify-center">
            <div className="flex justify-between items-end mb-3">
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40">Efectividad de Combate</span>
                <span className="text-orange-500 font-black italic">{winRate}%</span>
            </div>

            {/* Barra de progreso y con gradiente SaaS */}
            <div className="flex h-3 w-full rounded-full overflow-hidden bg-white/5 border border-white/5 p-[2px]">
                <div 
                    style={{ width: `${winRate}%` }} 
                    className="bg-gradient-to-r from-green-900 to-green-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(74,222,128,0.2)]" 
                />
            </div>

            {/* Desglose profesional de victorias */}
            <div className="flex gap-6 mt-5 text-[9px] uppercase font-black tracking-[0.15em] border-t border-white/5 pt-4">
                <span className="text-green-500/80">{stats.wins} Victorias</span>
                <span className="text-red-500/80">{stats.losses} Derrotas</span>
                <span className="text-gray-500">{stats.draws} Empates</span>
            </div>
        </div>
    );
};