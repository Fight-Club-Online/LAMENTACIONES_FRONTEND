import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fightApi } from '../Config/fightApi';
import type { Fight } from '../types/fight';

interface UseCreateFightReturn {
    fight: Fight | null;
    isLoading: boolean;
    error: string | null;
    createAndStartFight: (roomCode: string, player1Id: string, player2Id: string) => Promise<Fight | null>;
    startExistingFight: (fightId: string) => Promise<Fight | null>;
}

/**
 * Hook para crear e iniciar peleas.
 * Se usa desde la pantalla de selección de personajes.
 * Al llamar createAndStartFight, se crea la pelea en el backend y navega a FightPage.
 */
export const useCreateFight = (): UseCreateFightReturn => {
    const [fight, setFight] = useState<Fight | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    /**
     * Crea una nueva pelea y navega a la página de combate
     */
    const createAndStartFight = useCallback(async (
        roomCode: string, 
        player1Id: string, 
        player2Id: string
    ): Promise<Fight | null> => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Crear la pelea en el backend
            const newFight = await fightApi.createFight(roomCode, player1Id, player2Id);
            setFight(newFight);

            // 2. Navegar a la página de pelea con el fightId
            navigate(`/fight/${newFight.id}`);

            return newFight;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido al crear pelea';
            setError(message);
            console.error('Error creando pelea:', err);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    /**
     * Inicia una pelea ya existente (útil si se desconectó y quiere reconectar)
     */
    const startExistingFight = useCallback(async (fightId: string): Promise<Fight | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const startedFight = await fightApi.startFight(fightId);
            setFight(startedFight);
            return startedFight;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido al iniciar pelea';
            setError(message);
            console.error('Error iniciando pelea:', err);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        fight,
        isLoading,
        error,
        createAndStartFight,
        startExistingFight,
    };
};
