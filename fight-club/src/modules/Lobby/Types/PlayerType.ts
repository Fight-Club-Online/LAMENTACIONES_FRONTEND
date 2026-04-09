export type Player = {
    userId : string;
    roomCode : string;
    playerType : "PLAYER" | "SPECTATOR";
    /** Si el backend lo envía, se usa sin llamar al perfil */
    username?: string;
}
