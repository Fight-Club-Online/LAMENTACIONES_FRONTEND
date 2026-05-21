import React, { useEffect } from 'react';
import { useCreationPublicRoom } from '../../Hooks/useCreationPublicRoom';
import { useGetPublicRooms } from '../../Hooks/useGetPublicRooms';
import type { Room } from '../../Types/RoomTypes';

type Props = {
    setBottomPanel: (bottomPanel: boolean | undefined) => void;
    setRooms: (r: Room[]) => void;
}

export const SelectionPopUp: React.FC<Props> = ({ setBottomPanel, setRooms }) => {
    const { createPublicRoom } = useCreationPublicRoom();
    const { rooms, refresh } = useGetPublicRooms();

    useEffect(() => {
        if (rooms) {
            setRooms(rooms);
        }
    }, [rooms, setRooms]); 

    const seePublicRooms = () => {
        refresh();
        setBottomPanel(true);
    };

    return (
        <div className="flex flex-col items-center gap-3">
            
            <label className="font-label text-xs font-bold tracking-[0.15em] text-on-surface-variant uppercase">
                Cual sera tu siguiente camino?
            </label>

            <div className="flex items-center gap-3">
                
                {/* BOTÓN ÚNETE */}
                <button
                    onClick={seePublicRooms}
                    className={`
                        group relative overflow-hidden
                        bg-primary-container
                        h-14 px-6
                        flex items-center justify-center
                        transition-all active:scale-[0.98]
                        cursor-pointer !cursor-pointer
                        kinetic-gradient-fuego
                        py-2 md:py-3
                        font-headline font-bold
                        text-on-primary
                        tracking-[0.15em] md:tracking-[0.2rem]
                        uppercase text-xs md:text-sm
                        shadow-[0_10px_30px_rgba(255,86,38,0.3)]
                        rounded-[14px] md:rounded-[18px]
                    `}
                >
                    <span className="relative z-10 font-label font-black text-on-primary-container text-sm tracking-[0.2em] uppercase pointer-events-none">
                        Unete-
                    </span>
                </button>

                <span className="text-white font-bold">|</span>

                {/* BOTÓN CRÉALA */}
                <button
                    onClick={createPublicRoom}
                    className={`
                        group relative overflow-hidden
                        bg-primary-container
                        h-14 px-6
                        flex items-center justify-center
                        transition-all active:scale-[0.98]
                        cursor-pointer !cursor-pointer
                        kinetic-gradient-fuego
                        py-2 md:py-3
                        font-headline font-bold
                        text-on-primary
                        tracking-[0.15em] md:tracking-[0.2rem]
                        uppercase text-xs md:text-sm
                        shadow-[0_10px_30px_rgba(255,86,38,0.3)]
                        rounded-[14px] md:rounded-[18px]
                    `}
                >
                    <span className="relative z-10 font-label font-black text-on-primary-container text-sm tracking-[0.2em] uppercase pointer-events-none">
                        Creala
                    </span>
                </button>

            </div>
        </div>
    );
};