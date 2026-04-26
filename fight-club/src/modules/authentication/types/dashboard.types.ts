export interface UserProfile {
    id: string;
    userId: string;
    username: string;
    bio: string;
    country: string;
    city: string;
    avatarURL: string;
    notification: boolean;
}

export type RankTier = 'HIERRO' | 'BRONCE' | 'PLATA' | 'ORO' | 'DIAMANTE' | 'PLATINO';

export type RankName =
    | 'HIERRO_I'   | 'HIERRO_II'   | 'HIERRO_III'
    | 'BRONCE_I'   | 'BRONCE_II'   | 'BRONCE_III'
    | 'PLATA_I'    | 'PLATA_II'    | 'PLATA_III'
    | 'ORO_I'      | 'ORO_II'      | 'ORO_III'
    | 'DIAMANTE_I' | 'DIAMANTE_II' | 'DIAMANTE_III'
    | 'PLATINO';

export type Achievement =
    | 'PRIMERA_SANGRE'
    | 'VETERANO'
    | 'CAZADOR'
    | 'LEYENDA'
    | 'RACHA_DE_5'
    | 'RACHA_DE_10'
    | 'INVICTO_DEL_DIA'
    | 'MAESTRO_DEL_RING';

export interface UserStats {
    userId: string;
    wins: number;
    losses: number;
    draws: number;
    followers: number;
    totalFights: number;
    points: number;
    level: number;
    streak: number;
    rank: RankName;
    achievements: Achievement[];
}