import React, { useEffect, useState } from 'react';
import type { UserCharacter } from '../../../Types/characterTypes';
import type { CharacterAssets } from '../../../Config/axiosLobby';
import { lobbyApi } from '../../../Config/axiosLobby';
import { getUserData } from '../../../Types/localUserData';

const AZURE_BACKEND_URL = 'https://lobbyservices-f7dghrebachxetg4.mexicocentral-01.azurewebsites.net';

// Helper function to fix asset URLs from localhost to Azure
const fixAssetUrl = (url: string | undefined): string | undefined => {
    if (url && url.includes('localhost:8080')) {
        return url.replace('http://localhost:8080', AZURE_BACKEND_URL);
    }
    return url;
};

type props ={
    userCharacters:UserCharacter[] | null
}

type CharacterWithAssets = UserCharacter & { assets?: CharacterAssets };

export const CharacterContainer: React.FC<props>  = ({userCharacters})=>{
    const[characterScreen,setCharacterScreen] = useState<CharacterWithAssets | null>(null);
    const[charactersWithAssets, setCharactersWithAssets] = useState<CharacterWithAssets[]>([]);
    const[loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCharactersAndAssets = async () => {
            try {
                setLoading(true);
                const user = getUserData();
                
                console.log('CharacterContainer - Usuario:', user);
                
                if (!user?.userId) {
                    console.warn('CharacterContainer - No hay usuario autenticado');
                    setLoading(false);
                    return;
                }

                const userId = user.userId;
                console.log('CharacterContainer - UserId a usar:', userId);

                let characters = userCharacters;
                console.log('CharacterContainer - Personajes del prop:', characters);
                
                if (!characters || characters.length === 0) {
                    console.log('CharacterContainer - Obteniendo personajes del API...');
                    characters = await lobbyApi.getUserCharacters(userId);
                    console.log('CharacterContainer - Personajes del API:', characters);
                }

                if (!characters || characters.length === 0) {
                    console.warn('CharacterContainer - No hay personajes');
                    setLoading(false);
                    return;
                }

                console.log('CharacterContainer - Obteniendo assets...');
                const charactersData: CharacterWithAssets[] = await Promise.all(
                    characters.map(async (char) => {
                        console.log('[DEBUG char crudo]', JSON.stringify(char, null, 2));
                        try {
                            // Normalizar: el API puede devolver plano o anidado
                            const characterName = (char as any).characterName 
                                ?? char.character?.characterName 
                                ?? 'Desconocido';
                            const characterId = (char as any).characterId 
                                ?? char.character?.characterId;
                                
                            // Construir estructura normalizada siempre igual
                            const normalizedChar: UserCharacter = {
                                id: char.id ?? (char as any).id,
                                user: char.user ?? (char as any).user ?? '',
                                character: {
                                    characterId: characterId,
                                    characterName: characterName,
                                    characterLevel: (char as any).characterLevel ?? char.character?.characterLevel,
                                    characterHp: (char as any).characterHp ?? char.character?.characterHp,
                                    characterATK: (char as any).characterATK ?? char.character?.characterATK,
                                    characterDEF: (char as any).characterDEF ?? char.character?.characterDEF,
                                    characterImg: (char as any).characterImg ?? char.character?.characterImg,
                                }
                            };
                            
                            const assets = await lobbyApi.getUserCharacterAssets(
                                userId, 
                                characterId.toString()
                            );
                            
                            const fixedAssets: CharacterAssets = {
                                idle_url: fixAssetUrl(assets.idle_url),
                                run_url: fixAssetUrl(assets.run_url),
                                attack_url: fixAssetUrl(assets.attack_url),
                                hurt_url: fixAssetUrl(assets.hurt_url)
                            };
                            
                            return { ...normalizedChar, assets: fixedAssets };
                        } catch (error) {
                            console.error(`Error fetching assets:`, error);
                            return char;
                        }
                    })
                );

                console.log('CharacterContainer - Datos finales:', charactersData);
                setCharactersWithAssets(charactersData);
                setCharacterScreen(charactersData[0]);
                setLoading(false);
            } catch (error) {
                console.error('CharacterContainer - Error:', error);
                setLoading(false);
            }
        };

        fetchCharactersAndAssets();
    }, [userCharacters]);

    useEffect(() => {
        let i = 0;
        if (!charactersWithAssets || charactersWithAssets.length === 0) return;

        const interval = setInterval(() => {
          setCharacterScreen(charactersWithAssets[i]);
          i = (i + 1) % charactersWithAssets.length;
        }, 5000);
    
        return () => clearInterval(interval); 
    }, [charactersWithAssets]);


    return(
        <div className="flex-1 relative flex flex-col justify-end">
            {!getUserData() ? (
                <div className="flex items-center justify-center h-full bg-surface-container-lowest rounded-[18px]">
                    <p className="text-on-surface text-center">Inicia sesión para ver tus personajes</p>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center h-full bg-surface-container-lowest rounded-[18px]">
                    <p className="text-on-surface text-center">Cargando personajes...</p>
                </div>
            ) : characterScreen &&
            <>
                <div className="absolute inset-0 z-0 bg-surface-container-lowest overflow-hidden rounded-[18px]">
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-surface via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10">
                    <div
                        key={characterScreen.character?.characterId}
                        className="sprite sprite-idle"
                        style={{
                            backgroundImage: `url(${characterScreen.assets?.idle_url})`
                        }}
                    />
                </div>
                <div className="relative z-10 pb-8 pl-8 border-l-4 border-primary-container">
                    <h2 className="font-headline text-5xl font-black uppercase tracking-tighter text-on-surface leading-none mb-2">
                        {characterScreen.character?.characterName}
                    </h2>
                    <div className="flex gap-4 mt-6">
                        <div className="bg-surface-container-highest/80 backdrop-blur px-4 py-2 border-r-2 border-secondary">
                            <p className="text-[10px] text-stone-500 uppercase font-bold">Vida</p>
                            <p className="font-headline text-lg">{characterScreen.character?.characterHp}</p>
                        </div>
                        <div className="bg-surface-container-highest/80 backdrop-blur px-4 py-2 border-r-2 border-secondary">
                            <p className="text-[10px] text-stone-500 uppercase font-bold">Daño</p>
                            <p className="font-headline text-lg">{characterScreen.character?.characterATK}</p>
                        </div>
                    </div>
                </div>
            </>
            }
        </div>
    );
}