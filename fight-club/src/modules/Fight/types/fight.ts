export type FighterAction = "IDLE" | "MOVE_LEFT" | "MOVE_RIGHT" | "JUMP" | "BLOCK" | "BASIC_ATTACK" | "SPECIAL_ATTACK" | "HURT" | "DEAD";
export type Direction = "LEFT" | "RIGHT";
export type PlayerType = "PLAYER" | "SPECTATOR" | "HELPER";
export type RoomState = "IN_PROGRESS" | "WAITING" | "PLAYING" | "FINISHED";
export type ButtonStatus = "CLAIMED" | "ACTIVE" | "INACTIVE";
export type ButtomClaimedType = "SPECTATOR" | "OPPONENT" | null;

export interface Health {
    currentHealth: number;
    maxHealth: number;
}

export interface Skill {
    action: FighterAction;
    baseDamage: number;
    cooldown: number;
    startUpFrames: number;
    activeFrames: number;
    recoveryFrames: number;
    hitStun: number;
    blockStun: number;
}

export interface Fighter {
    id: string;
    userId: string;
    hasCharacter: boolean;
    characterId: number;
    characterName: string;
    characterLevel: number;
    characterATK: number;
    characterDEF: number;
    health: Health;
    skills: Skill[];
    posX: number;
    posY: number;
    velocityX: number;
    velocityY: number;
    isGrounded: boolean;
    direction: Direction;
    currentAction: FighterAction;
    isBlocking: boolean;
    currentStunFrames: number;
}

export interface HelpButton {
    buttonId: number;
    visible: boolean;
    fightId: string;
    activatedForUserId: string;
    claimedByUserId: string;
    status: ButtonStatus;
    type: ButtomClaimedType;
}

export interface Player {
    userId: string;
    playerType: PlayerType;
}

export interface Fight {
    id: string;
    player1: Fighter;
    player2: Fighter;
    isActive: boolean;
    helpButton: HelpButton;
}

export interface Room {
    roomId: number;
    roomCode: string;
    roomState: RoomState;
    hostId: string;
    maxPlayers: number;
    currentPlayers: number;
    maxSpectators: number;
    currentSpectators: number;
    players: Player[];
}

export interface PlayerInputDto {
    userId: string;
    action: FighterAction;
}

export interface CharacterAssets {
    idle_url: string; 
    run_url: string;
    attack_url: string;
    hurt_url: string;
}