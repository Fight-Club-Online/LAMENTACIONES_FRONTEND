
type props ={
    bothPlayersReady: boolean;
    onStartFight: () => void;
}


export const FooterSelectCharacter: React.FC<props> = ({ onStartFight, bothPlayersReady }) => {
    return (
        <footer className="p-6 border-t border-zinc-800">
            <button
                onClick={onStartFight}
                disabled={!bothPlayersReady}
                className={`
                    w-full py-5 text-xl font-black italic rounded-lg transition-all
                    ${bothPlayersReady
                        ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white cursor-pointer animate-pulse'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }
                `}
            >
                {bothPlayersReady ? 'INICIAR PELEA' : 'ESPERANDO A AMBOS JUGADORES...'}
            </button>
    </footer>
    );
}