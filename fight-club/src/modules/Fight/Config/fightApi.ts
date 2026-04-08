import axios from 'axios';
import type { Fight, PlayerInputDto } from '../types/fight';

const API_URL = import.meta.env.VITE_API_FIGHT_URL || 
    'http://localhost:8080';

const fightApiAxios = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

export const fightApi = {
    /**
     * Crea una nueva pelea entre dos jugadores
     * Se llama después de que ambos jugadores seleccionaron sus personajes
     */
    createFight: async (roomCode: string, player1Id: string, player2Id: string): Promise<Fight> => {
        const res = await fightApiAxios.post('/fight/create', null, {
            params: { roomCode, player1Id, player2Id }
        }).catch((error) => {
            throw new Error(error.response?.data?.message || 'Error al crear la pelea');
        });
        return res.data;
    },

    /**
     * Inicia una pelea existente (cambia isActive a true)
     * Se llama cuando ambos jugadores están listos
     */
    startFight: async (fightId: string): Promise<Fight> => {
        const res = await fightApiAxios.put(`/fight/start`, null, {
            params: { fightId }
        }).catch((error) => {
            throw new Error(error.response?.data?.message || 'Error al iniciar la pelea');
        });
        return res.data;
    },

    /**
     * Obtiene el estado actual de una pelea
     */
    getFight: async (fightId: string): Promise<Fight> => {
        const res = await fightApiAxios.get(`/fight/${fightId}`).catch((error) => {
            throw new Error(error.response?.data?.message || 'Error al obtener la pelea');
        });
        return res.data;
    },

    /**
     * Envía una acción del jugador (respaldo HTTP si WebSocket falla)
     */
    sendInput: async (fightId: string, input: PlayerInputDto): Promise<void> => {
        await fightApiAxios.post(`/fight/${fightId}/input`, input).catch((error) => {
            throw new Error(error.response?.data?.message || 'Error al enviar input');
        });
    },

    /**
     * Pide ayuda durante la pelea (activa el HelpButton)
     */
    askForHelp: async (fightId: string, userId: string): Promise<void> => {
        await fightApiAxios.post(`/fight/${fightId}/help`, null, {
            params: { userId }
        }).catch((error) => {
            throw new Error(error.response?.data?.message || 'Error al pedir ayuda');
        });
    },

    /**
     * Reclama el botón de ayuda
     */
    claimHelp: async (fightId: string, userId: string): Promise<void> => {
        await fightApiAxios.post(`/fight/${fightId}/claim`, null, {
            params: { userId }
        }).catch((error) => {
            throw new Error(error.response?.data?.message || 'Error al reclamar ayuda');
        });
    },
};
