import { useEffect, useState,useRef } from "react"
import { lobbyApi } from "../Config/axiosLobby";

type Props = {
    code: string
};

export const useStartGame = ({code}:Props) =>{
    const startGame = async (code: string) => {
        try {
            const room = await lobbyApi.startPrivateGame(code)
            return { room, error: null }
        } catch (error: any) {
            return { room: null, error }
        }
    }

    return { startGame }
}