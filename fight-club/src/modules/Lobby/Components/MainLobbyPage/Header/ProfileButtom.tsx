import React from 'react';
import { useNavigate } from 'react-router-dom';

type props = {
    userName: string;
    avatarURL: string;
}

export const ProfileButton: React.FC<props> = ({userName, avatarURL}) => {
    const navigate = useNavigate();

    const isValidUrl = avatarURL?.startsWith('http') || avatarURL?.startsWith('data:');
    const imgSrc = isValidUrl
        ? avatarURL
        : `https://api.dicebear.com/7.x/pixel-art/svg?seed=${userName}`;

    return(
        <div 
            onClick={() => navigate(`/${userName}/perfil`)}
            className="flex items-center gap-4 cursor-pointer group">
            
            <button className="relative">
                <img 
                    src={imgSrc}
                    alt={userName}
                    onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${userName}`;
                    }}
                    className="w-10 h-10 rounded-full border-2 border-primary-container group-hover:border-secondary transition-colors object-cover"
                />
            </button>
            <div className="flex flex-col">
                <span className="font-headline text-sm font-bold tracking-widest uppercase text-on-surface">
                    {userName}
                </span>
            </div>
        </div>
    );
}