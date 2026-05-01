import React, { useEffect, useState } from 'react';
import type { Room } from '../../Types/RoomTypes';
import { SearchResultPopUp } from '../PrivateRoomPopUp/SearchResult';
import { useGetPublicRooms } from '../../Hooks/useGetPublicRooms';
import { useNavigate } from 'react-router-dom';


type Props = {
    rooms: Room[]
}




export const PublicRoomsSelectorPopUp: React.FC<Props> = ({rooms}) => {   
    const navigate = useNavigate();
    const [roomsP, setRoomsP] = useState<Room[]>([]);
    
    useEffect(() => {
        if (rooms) {
            setRoomsP(rooms);
        }
    }, [rooms]);


    const JoinWaiting = (roomCode: string, playerType: string) => {
        navigate(`/waiting-room?roomCode=${roomCode}&playerType=${playerType}`); 
    };

    return(
        <div className="max-h-[45vh] overflow-y-auto border rounded">
            {roomsP.length === 0 ? (
                <div className="p-4 text-gray-500 font-label font-bold tracking-[0.15em] text-on-surface-variant uppercase">
                    No hay salas disponibles
                </div>
            ) : (
                roomsP.map((roomsP) => (
                    <button onClick={()=>JoinWaiting(roomsP.roomCode,"PLAYER")}
                        className=' kinetic-glass fuego-border  '
                    >
                        <SearchResultPopUp
                        key={roomsP.roomId}
                        players={roomsP.currentPlayers}
                        spectators={roomsP.currentSpectators}
                        status={roomsP.roomState}
                    />
                    </button>
                    
                ))
            )}
        </div>
    );
}