import React, { useEffect, useState } from "react";
import type { Player } from "../../Types/PlayerType";
import { getUserData } from "../../Types/localUserData";
import authApi from "../../../authentication/Config/axios";
import type { UserProfile } from "../../../authentication/types/dashboard.types";

type PlayerCardProps = {
  player? : Player;
};





export const PlayerContainer: React.FC<PlayerCardProps> = ({player}) => {
  const [playerGame,setPlayerGame] = useState<Player|null>(null)
  const [remoteUsername, setRemoteUsername] = useState<string | null>(null);
  const [remoteAvatar, setRemoteAvatar] = useState<string | null>(null);

  useEffect(()=>{
    if(!player) return;
    setPlayerGame(player);
  }, [player]);

  const currentUser = getUserData();
  const isLocalUser = playerGame?.userId === currentUser?.userId;

  useEffect(() => {
    if (!playerGame?.userId || isLocalUser) {
      setRemoteUsername(null);
      setRemoteAvatar(null);
      return;
    }
    const fromRoom = playerGame.username?.trim();
    if (fromRoom) {
      setRemoteUsername(fromRoom);
      return;
    }
    let cancelled = false;
    authApi
      .get<UserProfile>(`/user-profile/${playerGame.userId}`)
      .then((res) => {
        if (!cancelled) {
          if (res.data?.username) setRemoteUsername(res.data.username);
          if (res.data?.avatarURL) setRemoteAvatar(res.data.avatarURL);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [playerGame?.userId, playerGame?.username, isLocalUser]);

  const displayName = isLocalUser
    ? (currentUser?.username ?? playerGame?.username ?? playerGame?.userId ?? "EMPTY_SLOT")
    : (remoteUsername ?? playerGame?.username ?? playerGame?.userId ?? "EMPTY_SLOT");
    
  const avatarRaw = isLocalUser ? localStorage.getItem('player_avatar') : null;
  const isValidUrl = avatarRaw?.startsWith('http') || avatarRaw?.startsWith('data:');
  const avatar = isValidUrl ? avatarRaw : null;
  const avatarSrc = isLocalUser
   ? (avatar ?? `https://api.dicebear.com/7.x/pixel-art/svg?seed=${playerGame?.userId ?? 'empty'}`)
   : (remoteAvatar ?? `https://api.dicebear.com/7.x/pixel-art/svg?seed=${playerGame?.userId ?? 'empty'}`);

  const status = playerGame ? "Ready" : "WAITING...";

  const isWaiting = status === "WAITING...";

  const gradientFrom = isWaiting
    ? "from-secondary-container/10"
    : "from-primary-container/10";

  const borderClass = isWaiting
    ? "border-r-8 border-outline-variant/30"
    : "border-l-8 border-primary";

  const bgClass = isWaiting
    ? "bg-surface-container-low"
    : "bg-surface-container-highest";

  const glowClass = isWaiting
    ? "bg-secondary-container/10"
    : "bg-primary-container/30";

  const statusBarClass = isWaiting
    ? "bg-surface-container-highest text-right"
    : "bg-primary text-left";

  const nameColor = isWaiting ? "text-outline-variant" : "text-primary";
  const statusColor = isWaiting ? "text-on-surface-variant" : "text-on-primary";

  return (
 
<section className={`
      w-full md:w-1/2
      h-auto md:h-full
      flex flex-col items-center justify-center relative
      py-8 md:py-0
    `}>
      <div className={`absolute inset-0 bg-gradient-to-b ${gradientFrom} to-transparent`} />

      <div className="relative flex flex-col items-center z-10 ">
        <div className="relative group">
          <div className={`absolute inset-0 blur-3xl rounded-full ${glowClass}`}></div>

          <div className={`
            relative
            w-44 h-52
            sm:w-56 sm:h-64
            md:w-60 md:h-72
            lg:w-72 lg:h-80
            ${bgClass} ${borderClass}
            shadow-2xl overflow-hidden
            flex items-center justify-center
            rounded-[14px] md:rounded-[18px]
          `}>            {!playerGame ? (
              <div className="w-full h-full flex items-center justify-center">
                <span
                  className="material-symbols-outlined material-symbols-outlined--display text-outline-variant animate-pulse opacity-20"
                  style={{ fontSize: "8rem" }}
                >
                  person_add
                </span>
              </div>
            ) : (
            <img
                src={avatarSrc}
                alt={`${displayName} Avatar`}
                onError={(e) => {
                  e.currentTarget.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${playerGame?.userId}`;
                }}
             className="w-full h-full object-cover grayscale contrast-125 mix-blend-screen"
             />
            )}

            <div className={`absolute bottom-0 w-full p-3 ${statusBarClass}`}>
              <span className={`${statusColor} font-headline font-bold text-xs tracking-widest uppercase`}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <span className="text-on-surface-variant font-label text-xs tracking-[0.2rem] block mb-2 opacity-60">
            {isWaiting ? "OPPONENT" : "CHALLENGER"}
          </span>
          <h2 className={`font-orbitron text-2xl sm:text-1xl md:text-4xl lg:text-5xl font-black tracking-tighter  max-w-[90%] mx-auto ${nameColor}`}>    
              {displayName}
          </h2>
        </div>
      </div>
    </section>
  );
};