import React, { useState, useEffect } from 'react';
import type { Fight } from '../types/fight';
import type { Character, UserCharacter } from '../../Lobby/Types/characterTypes';
import { 
  characterToUserCharacter, 
  getCharacterId,
  getCharacterName,
  getCharacterLevel,
  getCharacterATK,
  getCharacterDEF,
  getCharacterImg,
} from '../../Lobby/Types/characterHelpers';
import { lobbyApi } from '../../Lobby/Config/axiosLobby';
import { FooterSelectCharacter } from '../Components/SelectCharacter/footerSC';
import { HeaderSelectCharacter } from '../Components/SelectCharacter/headerSC';

const AZURE_BACKEND_URL = 'https://lobbyservices-f7dghrebachxetg4.mexicocentral-01.azurewebsites.net';

// Helper function to fix asset URLs from localhost to Azure
const fixAssetUrl = (url: string | undefined): string | undefined => {
    if (url && url.includes('localhost:8080')) {
        return url.replace('http://localhost:8080', AZURE_BACKEND_URL);
    }
    return url;
};

interface SelectCharactersProps {
    gameState: Fight;
    userId: string;
    isConnected: boolean;
    onSelectCharacter: (characterId: number) => void;
    onStartFight: () => void;
}

const defaultCharacter: UserCharacter = {
    userId: "usuario123",
    characterId: 1,
    characterLevel: 10,
    characterName: "Guerrero Arcano",
    characterHp: "1500",
    characterATK: "250",
    characterDEF: "180",
    characterImg: "https://avatars.githubusercontent.com/u/181153854?v=4",
};



export const SelectCharacters: React.FC<SelectCharactersProps> = ({
    gameState,
    userId,
    isConnected,
    onSelectCharacter,
    onStartFight,
}) => {
    const [characters, setCharacters] = useState<UserCharacter[]>([]);
    const [isLoadingCharacters, setIsLoadingCharacters] = useState(true);
    const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
    const [opponentAssets, setOpponentAssets] = useState<any>(null);

    // Determinar si este usuario es player1 o player2
    const isPlayer1 = gameState.player1.userId === userId;
    console.log('isPlayer1', isPlayer1 + ' ' + userId);
    const currentPlayer = isPlayer1 ? gameState.player1 : gameState.player2;
    const opponent = isPlayer1 ? gameState.player2 : gameState.player1;

    // Verificar si ambos jugadores han seleccionado personaje
    const bothPlayersReady = gameState.player1.hasCharacter && gameState.player2.hasCharacter;
    const currentPlayerReady = currentPlayer.hasCharacter;

    // Cargar personajes disponibles
    useEffect(() => {
        const loadCharacters = async () => {
            try {
                setIsLoadingCharacters(true);
                const response = await lobbyApi.getUserCharacters(userId);
                console.log("el try:",response)
                
                if(response.length === 0){
                    const allCharacters = await lobbyApi.getAllCharacters();
                    const firstChar: Character = allCharacters[0];
                    const userChar = characterToUserCharacter(firstChar, userId);
                    setCharacters([userChar]);        
                }else{
                    // Cargar assets para cada personaje y convertir URLs
                    const charactersWithAssets = await Promise.all(
                        response.map(async (char) => {
                            try {
                                const charId = getCharacterId(char);
                                const assets = await lobbyApi.getUserCharacterAssets(userId, charId.toString());
                                
                                // Convertir URLs de localhost a Azure
                                const fixedAssets = {
                                    idle_url: fixAssetUrl(assets.idle_url),
                                    run_url: fixAssetUrl(assets.run_url),
                                    attack_url: fixAssetUrl(assets.attack_url),
                                    hurt_url: fixAssetUrl(assets.hurt_url)
                                };
                                
                                return { ...char, assets: fixedAssets };
                            } catch (error) {
                                console.error(`Error fetching assets for ${getCharacterName(char)}:`, error);
                                return char;
                            }
                        })
                    );
                    setCharacters(charactersWithAssets);
                }
            } catch (error) {
                console.error('Error cargando personajes:', error);
                try {
                    const allCharacters = await lobbyApi.getAllCharacters();
                    console.log(allCharacters)
                    const firstChar: Character = allCharacters[0];
                    const userChar = characterToUserCharacter(firstChar, userId);
                    setCharacters([userChar]);
                } catch (fallbackError) {
                    console.error('Error en fallback:', fallbackError);
                    setCharacters([defaultCharacter]);
                }
            } finally {
                setIsLoadingCharacters(false);
            }
        };

        loadCharacters();
    }, [userId]);

    // Sincronizar selección con el estado del servidor
    useEffect(() => {
        if (currentPlayer.hasCharacter && currentPlayer.characterId) {
            setSelectedCharacterId(currentPlayer.characterId);
        }
    }, [currentPlayer.hasCharacter, currentPlayer.characterId]);

    // Cargar datos del oponente cuando selecciona personaje
    useEffect(() => {
        const loadOpponentCharacter = async () => {
            if (opponent.hasCharacter && opponent.characterId && opponent.userId) {
                try {
                    console.log('Cargando assets del oponente:', opponent.userId, opponent.characterId);
                    const assets = await lobbyApi.getUserCharacterAssets(opponent.userId, opponent.characterId.toString());
                    console.log('Assets oponente:', assets);
                    
                    // Convertir URLs de localhost a Azure
                    const fixedAssets = {
                        idle_url: fixAssetUrl(assets.idle_url),
                        run_url: fixAssetUrl(assets.run_url),
                        attack_url: fixAssetUrl(assets.attack_url),
                        hurt_url: fixAssetUrl(assets.hurt_url)
                    };
                    
                    console.log('Assets convertidos:', fixedAssets);
                    setOpponentAssets(fixedAssets);
                } catch (error) {
                    console.error('Error cargando assets del oponente:', error);
                    setOpponentAssets(null);
                }
            } else {
                console.log('No se cumplen las condiciones para cargar assets. Oponente:', opponent);
            }
        };
        
        loadOpponentCharacter();
    }, [opponent.hasCharacter, opponent.characterId, opponent.userId]);

    const handleSelectCharacter = (characterId: number) => {
        if (currentPlayerReady) return; 
        setSelectedCharacterId(characterId);
    };

    const handleConfirmSelection = () => {
        if (selectedCharacterId === null) return;
        onSelectCharacter(selectedCharacterId);
        console.log("orpimido")
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col">
            <HeaderSelectCharacter isConnected={isConnected} />

            {/* Contenido principal */}
            <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6">
                {/* Panel izquierdo - Tu selección */}
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-4 h-4 rounded-full ${currentPlayerReady ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <h2 className="text-xl font-bold text-white">
                            TU ({isPlayer1 ? 'P1' : 'P2'})
                        </h2>
                        {currentPlayerReady && (
                            <span className="text-green-500 text-sm font-medium">LISTO</span>
                        )}
                    </div>

                    {/* Grid de personajes */}
                    {isLoadingCharacters ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {characters.map((char: UserCharacter) => (
                                <button
                                    key={getCharacterId(char)}
                                    onClick={() => handleSelectCharacter(Number(getCharacterId(char)))}
                                    disabled={currentPlayerReady}
                                    className={`
                                        relative p-4 rounded-lg border-2 transition-all
                                        ${selectedCharacterId === getCharacterId(char)
                                            ? 'border-red-500 bg-red-500/20 scale-105'
                                            : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
                                        }
                                        ${currentPlayerReady ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                                >
                                    {/* Imagen del personaje */}
                                    <div className="aspect-square bg-zinc-800 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                        <div
                                            className="sprite-select sprite-idle"
                                            style={{
                                                backgroundImage: `url(${fixAssetUrl(char.assets?.idle_url as string) || getCharacterImg(char) || 'https://via.placeholder.com/32x64'})`
                                            }}
                                        />
                                    </div>

                                    {/* Info del personaje */}
                                    <h3 className="font-bold text-white text-sm truncate">{getCharacterName(char)}</h3>
                                    <p className="text-xs text-zinc-400">Nivel {getCharacterLevel(char)}</p>

                                    {/* Stats */}
                                    <div className="mt-2 flex gap-2 text-xs">
                                        <span className="text-red-400">ATK:{getCharacterATK(char)}</span>
                                        <span className="text-blue-400">DEF:{getCharacterDEF(char)}</span>
                                    </div>

                                    {/* Indicador de seleccionado */}
                                    {selectedCharacterId === getCharacterId(char) && (
                                        <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Botón confirmar selección */}
                    {!currentPlayerReady && selectedCharacterId !== null && (
                        <button
                            onClick={handleConfirmSelection}
                            className="mt-6 w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold text-lg rounded-lg transition-colors"
                        >
                            CONFIRMAR SELECCION
                        </button>
                    )}
                </div>

                {/* Separador VS */}
                <div className="flex items-center justify-center lg:flex-col">
                    <div className="w-20 h-20 rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center">
                        <span className="text-2xl font-black text-red-500 italic">VS</span>
                    </div>
                </div>

                {/* Panel derecho - Oponente */}
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-4 h-4 rounded-full ${opponent.hasCharacter ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                        <h2 className="text-xl font-bold text-white">
                            OPONENTE ({isPlayer1 ? 'P2' : 'P1'})
                        </h2>
                        {opponent.hasCharacter && (
                            <span className="text-green-500 text-sm font-medium">LISTO</span>
                        )}
                    </div>

                    {/* Card del oponente */}
                    <div className="flex-1 flex items-center justify-center">
                        <div className={`
                            w-full max-w-xs p-6 rounded-xl border-2 
                            ${opponent.hasCharacter ? 'border-green-500 bg-green-500/10' : 'border-zinc-700 bg-zinc-900'}
                        `}>
                            {opponent.hasCharacter ? (
                                <div className="text-center">
                                    <div className="w-32 h-32 mx-auto bg-zinc-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                                        <div
                                            className="sprite-select sprite-idle"
                                            style={{
                                                backgroundImage: `url(${opponentAssets?.idle_url || 'https://via.placeholder.com/32x64'})`
                                            }}
                                        />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{opponent.characterName || 'Personaje Seleccionado'}</h3>
                                    <p className="text-zinc-400 mt-1">Nivel {opponent.characterLevel || '?'}</p>
                                    <div className="mt-3 flex justify-center gap-4 text-sm">
                                        <span className="text-red-400">ATK: {opponent.characterATK || '?'}</span>
                                        <span className="text-blue-400">DEF: {opponent.characterDEF || '?'}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 mx-auto border-4 border-zinc-600 border-t-yellow-500 rounded-full animate-spin mb-4" />
                                    <p className="text-zinc-400 text-lg">Esperando seleccion...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <FooterSelectCharacter onStartFight={onStartFight} bothPlayersReady={bothPlayersReady} />
        </div>
    );
};
