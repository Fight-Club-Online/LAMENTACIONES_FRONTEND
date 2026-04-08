import React, { useEffect, useState } from 'react';
import { LobbyHeader } from '../Components/MainLobbyPage/Header/LobbyHeader';
import '../styles/index.css';
import { CharacterContainer } from '../Components/MainLobbyPage/LeftSideBar/CharacterContainer';
import { RightSideBar } from '../Components/MainLobbyPage/RigthSideBar/RightSideBar';
import { getUserData } from '../Types/localUserData';
import axios from 'axios';

export const LobbyPage : React.FC = () =>{
    const [userName,setUserName] = useState<string>("");
    const [avatarURL, setAvatarURL] = useState<string>("");
    
    useEffect(() => {
      const userData = getUserData();
      
      if (userData) {
        setUserName(userData.username);
      }
      
      const fetchProfile = async () => {
        if (!userData?.userId) return;
        try {
          const token = localStorage.getItem('fight_club_token');
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/user-profile/${userData.userId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.data?.avatarURL) {
            setAvatarURL(res.data.avatarURL);
            localStorage.setItem('player_avatar', res.data.avatarURL);
          }
        } catch (e) {
          console.error("No se pudo cargar el perfil:", e);
        }
      };
      
      fetchProfile();
  }, []);

    return(
        <div className="bg-surface text-on-surface">
          <LobbyHeader userName={userName} avatarURL={avatarURL}/>
            <main className="flex h-[calc(100vh-64px)] overflow-hidden">
                <div className="flex-1 flex flex-col md:flex-row p-6 lg:p-12 gap-12 bg-surface max-w-[1440px] mx-auto w-full">
                    <CharacterContainer />
                    <RightSideBar />
                </div>
            </main>
        </div>
    );
}