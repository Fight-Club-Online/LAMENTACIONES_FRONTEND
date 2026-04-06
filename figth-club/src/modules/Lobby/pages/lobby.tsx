import React, { useEffect, useState } from 'react';
import { LobbyHeader } from '../Components/MainLobbyPage/Header/LobbyHeader';
import '../styles/index.css';
import { CharacterContainer } from '../Components/MainLobbyPage/LeftSideBar/CharacterContainer';
import { RightSideBar } from '../Components/MainLobbyPage/RigthSideBar/RightSideBar';
import type { UserCharacter } from '../Types/characterTypes';
import { getUserData } from '../Types/localUserData';
import { lobbyApi } from '../Config/axiosLobby';
import axios from 'axios';

export const LobbyPage : React.FC = () =>{
    const [userName,setUserName] = useState<string>("");
    const [avatarURL, setAvatarURL] = useState<string>("");
    const [userCharacters,setUserCharacters] = useState<UserCharacter[] | null>(null);
    
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
      
      const fetchUserCharacters = async () => {
        if (!userData?.userId) return;
        try {
          const characters = await lobbyApi.getUserCharacters(userData.userId);
          setUserCharacters(characters);
        } catch (e) {
          console.error("No se pudieron cargar los personajes:", e);
        }
      };
      
      fetchProfile();
      fetchUserCharacters();
  }, []);

    return(
        <div className="bg-surface text-on-surface">
          <LobbyHeader userName={userName} avatarURL={avatarURL}/>
            <main className="flex h-[calc(100vh-64px)] overflow-hidden">
                <div className="flex-1 flex flex-col md:flex-row p-6 lg:p-12 gap-12 bg-surface max-w-[1440px] mx-auto w-full">
                    <CharacterContainer  userCharacters={userCharacters} />
                    <RightSideBar />
                </div>
            </main>
        </div>
    );
}