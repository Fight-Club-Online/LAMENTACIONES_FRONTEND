type props = {
    isConnected: boolean;
}
export const HeaderSelectCharacter: React.FC<props> = ({ isConnected }) => {
    return (
        <header className="flex items-center justify-between p-4 border-b border-zinc-800">
                <h1 className="text-2xl font-black text-white italic">SELECCIONAR PERSONAJE</h1>
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                    <span className="text-xs text-zinc-400">
                        {isConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                </div>
        </header>
    );
}