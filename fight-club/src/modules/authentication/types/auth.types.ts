export const USER_ROLES = {
    USER: 'USER',
    ADMIN: 'ADMIN',
    PLAYER: 'PLAYER'
} as const;

export const USER_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    BANNED: 'BANNED'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

export interface User {
    id: string;
    email: string;
    username: string;
    role: UserRole;
    status: UserStatus;
    verified: boolean;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    userId: string;
    email: string;
    username: string;
    role: UserRole;
}

export interface RegisterRequest {
    email: string;
    username: string;
    password: string; 
    avatarURL: string;
}


export type LoginRequest = Pick<RegisterRequest, 'email' | 'password'>;