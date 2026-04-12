import { useEffect, useRef } from 'react';
import type { FighterAction } from '../types/fight';

export const useKeyboardControls = (sendAction: (action: FighterAction) => void, active: boolean) => {
    const activeKeys = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!active) return;

        const keyMap: Record<string, FighterAction> = {
            'a': 'MOVE_LEFT',
            'd': 'MOVE_RIGHT',
            'w': 'JUMP',
            's': 'BLOCK',
            'j': 'BASIC_ATTACK',
            'k': 'SPECIAL_ATTACK'
        };

        const handleDown = (e: KeyboardEvent) => {
            // ← No capturar teclas si hay un input/textarea enfocado
            const active = document.activeElement;
            if (
                active instanceof HTMLInputElement ||
                active instanceof HTMLTextAreaElement ||
                (active as HTMLElement)?.isContentEditable
            ) return;

            const key = e.key.toLowerCase();
            const action = keyMap[key];

            if (action && !activeKeys.current.has(key)) {
                activeKeys.current.add(key);
                sendAction(action);
            }
        };

        const handleUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            
            if (activeKeys.current.has(key)) {
                activeKeys.current.delete(key);
                
                if (['a', 'd', 'w', 's'].includes(key)) {
                    sendAction('IDLE');
                }
            }
        };

        window.addEventListener('keydown', handleDown);
        window.addEventListener('keyup', handleUp);

        return () => {
            window.removeEventListener('keydown', handleDown);
            window.removeEventListener('keyup', handleUp);
            activeKeys.current.clear();
        };
    }, [sendAction, active]);
};