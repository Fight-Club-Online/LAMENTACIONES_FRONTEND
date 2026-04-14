import { useEffect, useRef } from 'react';
import type { FighterAction } from '../types/fight';

export const useKeyboardControls = (sendAction: (action: FighterAction) => void, active: boolean) => {
    // Usamos un Ref para rastrear las teclas presionadas sin provocar re-renders
    const pressedKeys = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!active) {
            pressedKeys.current.clear();
            return;
        }

        const keysMap: Record<string, FighterAction> = {
            'a': 'MOVE_LEFT',
            'd': 'MOVE_RIGHT',
            'w': 'JUMP',
            's': 'BLOCK',
            'j': 'BASIC_ATTACK',
            'k': 'SPECIAL_ATTACK'
        };

        const handleDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const action = keysMap[key];

            if (action && !pressedKeys.current.has(key)) {
                pressedKeys.current.add(key);
                sendAction(action);
            }
        };

        const handleUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            
            if (keysMap[key]) {
                pressedKeys.current.delete(key);

                if (['a', 'd', 's', 'w'].includes(key)) {
                    const remainingKeys = Array.from(pressedKeys.current);
                    const nextActionKey = remainingKeys.reverse().find(k => ['a', 'd', 's', 'w'].includes(k));

                    if (nextActionKey) {
                        sendAction(keysMap[nextActionKey]);
                    } else {
                        sendAction('IDLE');
                    }
                }
            }
        };

        const handleBlur = () => {
            if (pressedKeys.current.size > 0) {
                pressedKeys.current.clear();
                sendAction('IDLE');
            }
        };

        window.addEventListener('keydown', handleDown);
        window.addEventListener('keyup', handleUp);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('keydown', handleDown);
            window.removeEventListener('keyup', handleUp);
            window.removeEventListener('blur', handleBlur);
        };
    }, [sendAction, active]);
};