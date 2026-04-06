import axios from 'axios';
import type { Room } from '../Types/RoomTypes';
import type { UserCharacter } from '../Types/characterTypes';
import { error } from 'three';

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

export const lobbyApi ={
    
    createLobby: async(hostId:string): Promise<Room>=>{
        const res = await lobbyApiAxios.post(`${base_rest_uri}/create-private`,null,{
            params: { hostId }
        }).catch((error)=>{
            throw new Error(error.response.data.message)
        });
        return res.data
    },

    getRoomState : async(roomCode:string) : Promise<Room>=>{
        const res = await lobbyApiAxios.get(`${base_rest_uri}/availability`,{
            params: {roomCode}
        }).catch((error)=>{
            throw new Error(error.response.data.message)
        });
        return res.data;
    },

    startPrivateGame : async(roomCode:string) : Promise<Room> =>{
        const res = await lobbyApiAxios.post(`${base_rest_uri}/start-fight/${roomCode}`)
        .catch((error)=>{
            throw new Error(error.response.data.message)
        });
        return res.data;
    },

    getUserCharacterAssets : async(userId:string, characterId:string) : Promise<CharacterAssets> =>{
        const res = await lobbyApiAxios.get(`${characters_rest_uri}/${characterId}/assets`,{
            params: { userId }
        }).catch((error)=>{
            throw new Error(error.response.data.message)
        });
        return res.data;
    },

    getUserCharacters : async(userId:string) : Promise<UserCharacter[]> =>{
        const res = await lobbyApiAxios.get(`${characters_rest_uri}/user/characters`,{
            params: { userId }
        }).catch((error)=>{
            throw new Error(error.response.data.message)
        });
        return res.data;
    }

}  