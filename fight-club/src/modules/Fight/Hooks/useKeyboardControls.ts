import { useEffect } from 'react';
import type { FighterAction } from '../types/fight';

export const useKeyboardControls = (sendAction: (action: FighterAction) => void, active: boolean) => {
    useEffect(() => {
        if (!active) return;

        const keys: Record<string, FighterAction> = {
            'a': 'MOVE_LEFT',
            'd': 'MOVE_RIGHT',
            'w': 'JUMP',
            's': 'BLOCK',
            'j': 'BASIC_ATTACK',
            'k': 'SPECIAL_ATTACK'
        };

        const handleDown = (e: KeyboardEvent) => {
            const action = keys[e.key.toLowerCase()];
            if (action) sendAction(action);
        };

        const handleUp = (e: KeyboardEvent) => {
            if (['a', 'd', 's'].includes(e.key.toLowerCase())) sendAction('IDLE');
        };

        window.addEventListener('keydown', handleDown);
        window.addEventListener('keyup', handleUp);
        return () => {
            window.removeEventListener('keydown', handleDown);
            window.removeEventListener('keyup', handleUp);
        };
    }, [sendAction, active]);
};