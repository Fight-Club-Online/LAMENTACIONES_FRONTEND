import axios from 'axios';
import type { Room } from '../Types/RoomTypes';
import type { Character, UserCharacter } from '../Types/characterTypes';
import { getLocalCharacterAssets } from '../../../utils/assetMapper';

export type CharacterAssets = {
  characterId?: string;
  assets?: string[];
  idle_url?: string;
  run_url?: string;
  attack_url?: string;
  hurt_url?: string;
  [key: string]: any;
};

const lobbyApiAxios = axios.create({
    baseURL:  import.meta.env.VITE_API_LOBBY_URL,
    headers: { 'Content-Type': 'application/json' },
  });

const base_rest_uri:string = "/rooms"
const characters_rest_uri:string = "/user-characters"
const all_character_rest_uri:string ="/characters"

/**
 * Maneja errores de axios de manera robusta
 */
const handleAxiosError = (error: any): never => {
    const message = error.response?.data?.message || error.message || 'Error en la solicitud';
    throw new Error(message);
};

export const lobbyApi ={
    
    createLobby: async(hostId:string): Promise<Room>=>{
        try {
            const res = await lobbyApiAxios.post(`${base_rest_uri}/create-private`,null,{
                params: { hostId }
            });
            return res.data;
        } catch (err) {
            return handleAxiosError(err);
        }
    },

    getRoomState : async(roomCode:string) : Promise<Room>=>{
        try {
            const res = await lobbyApiAxios.get(`${base_rest_uri}/availability`,{
                params: {roomCode}
            });
            return res.data;
        } catch (err) {
            return handleAxiosError(err);
        }
    },

    startPrivateGame : async(roomCode:string) : Promise<Room> =>{
        try {
            const res = await lobbyApiAxios.post(`${base_rest_uri}/start-fight/${roomCode}`);
            return res.data;
        } catch (err) {
            return handleAxiosError(err);
        }
    },

    getUserCharacterAssets : async(userId:string, characterId:string) : Promise<CharacterAssets> =>{
        try {
            const res = await lobbyApiAxios.get(`${characters_rest_uri}/${characterId}`,{
                params: { userId }
            });
            
            console.log('[axiosLobby] getUserCharacterAssets response:', { characterId, userId, data: res.data, status: res.status });
            
            if (!res.data) {
                throw new Error(`No data received for characterId: ${characterId}`);
            }
            
            const userData = res.data;
            
            // Normalizar estructura: el API puede devolver datos planos o anidados
            const characterName = (userData as any).characterName || userData.character?.characterName;
            
            if (!characterName) {
                console.error('[axiosLobby] Invalid character data:', userData);
                throw new Error(`Invalid character data: missing characterName`);
            }
            
            console.log('[axiosLobby] Mapped character name:', characterName);
            return getLocalCharacterAssets(characterName);
        } catch (err) {
            return handleAxiosError(err);
        }
    },

    getUserCharacters : async(userId:string) : Promise<UserCharacter[]> =>{
        try {
            const res = await lobbyApiAxios.get(`${characters_rest_uri}/user/characters`,{
                params: { userId }
            });
            return res.data;
        } catch (err) {
            return handleAxiosError(err);
        }
    },

    getAllCharacters : async() : Promise<Character[]> =>{
        try {
            const res = await lobbyApiAxios.get(`${all_character_rest_uri}/all`);
            return res.data;
        } catch (err) {
            return handleAxiosError(err);
        }
    },

    createPublicRoom: async(hostId:string): Promise<Room>=>{
        try {
            const res = await lobbyApiAxios.post(`${base_rest_uri}/create-public`,null,{
                params: { hostId }
            });
            return res.data;
        } catch (err) {
            return handleAxiosError(err);
        }
    },

    getPublicRooms: async(): Promise<Room[]>=>{
        try {
            const res = await lobbyApiAxios.get(`${base_rest_uri}/public-rooms`);
            return res.data;
        } catch (err) {
            return handleAxiosError(err);
        }
    },
}  