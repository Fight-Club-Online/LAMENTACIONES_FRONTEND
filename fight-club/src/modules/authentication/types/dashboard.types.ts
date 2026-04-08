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
}