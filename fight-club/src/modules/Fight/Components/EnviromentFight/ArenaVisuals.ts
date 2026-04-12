export const CANVAS_CONFIG = {
    WIDTH: 1000,
    HEIGHT: 500,
    FIGHTER_WIDTH: 65,
    FIGHTER_HEIGHT: 130,
    GROUND_Y_OFFSET: 60,
};

export const ACTION_STYLES: { [key: string]: string } = {
    IDLE: 'rgba(59, 130, 246, 1)',
    MOVE_LEFT: 'rgba(34, 211, 238, 1)',
    MOVE_RIGHT: 'rgba(34, 211, 238, 1)',
    JUMP: 'rgba(168, 85, 247, 1)',
    BLOCK: 'rgba(251, 191, 36, 1)',
    BASIC_ATTACK: 'rgba(239, 68, 68, 1)',
    SPECIAL_ATTACK: 'rgba(236, 72, 153, 1)',
    HURT: 'rgba(255, 255, 255, 1)',
    DEAD: 'rgba(113, 113, 122, 0.5)',
};

export const ACTION_COLORS_HEX: { [key: string]: string } = {
    BASIC_ATTACK: '#ef4444',
    SPECIAL_ATTACK: '#ec4899',
    BLOCK: '#f59e0b',
    JUMP: '#8b5cf6',
    MOVE_LEFT: '#06b6d4',
    MOVE_RIGHT: '#06b6d4',
    HURT: '#ffffff',
    DEAD: '#71717a',
    IDLE: '#3b82f6'
};

// Colores por defecto para el degradado del borde (zinc-800/900)
export const DEFAULT_BORDER_GRADIENT = 'from-zinc-800 to-zinc-900';