import React from 'react';
import { ProfileButton } from './ProfileButtom';
import { FriendsButton } from './FriendButton';
import { NotificationsButton } from './NotificationButton';
import { ConfigurationButton } from './ConfigButton';

type props = {
    userName: string;
    avatarURL: string;
}

export const LobbyHeader: React.FC<props> = ({userName, avatarURL}) => {
    return(
        <nav >
            <header className="bg-[#16130f] flex justify-between items-center w-full px-6 h-16 fixed top-0 z-50">
                <ProfileButton userName={userName} avatarURL={avatarURL} />
                <span className="hidden lg:flex items-center gap-8">
                    <strong className="font-['Space_Grotesk'] uppercase tracking-widest text-sm font-bold text-orange-500 border-b-2 border-orange-600 pb-1">Lobby</strong>
                    </span>
                <nav className="flex items-center gap-2">
                    <FriendsButton />
                    <NotificationsButton />
                    <ConfigurationButton />
                </nav>
                
            </header>
        </nav>
    );
}