import type { Player } from "./PlayerType";

export type Room = {
    roomId: number;
    roomCode: string;
    hostId: string;
    roomState: string;
    maxPlayers: number;
    currentPlayers: number;
    maxSpectators:number;
    currentSpectators: number;
    players : Player[];
}


