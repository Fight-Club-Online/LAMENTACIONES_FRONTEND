import { useEffect } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { WaitingRoom } from "../Components/WaitingRoom/WaitingRoom";
import { useJoinWaitingRoomg } from "../Hooks/useJoinWaitingRoom";
import { getUserData } from "../Types/localUserData";

export const WaitingRoomPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get("roomCode");
  const playerType = searchParams.get("playerType");
  const userId = getUserData()?.userId ?? null;

  if (!userId || !roomCode || !playerType) {
    return <Navigate to="/login" replace />;
  }

  return (
    <WaitingRoomWithConnection
      roomCode={roomCode}
      userId={userId}
      playerType={playerType}
    />
  );
};

type WaitingRoomWithConnectionProps = {
  roomCode: string;
  userId: string;
  playerType: string;
};

const WaitingRoomWithConnection: React.FC<WaitingRoomWithConnectionProps> = ({
  roomCode,
  userId,
  playerType,
}) => {
  const navigate = useNavigate();
  const { room, connected, error, leave, roomDisbanded } = useJoinWaitingRoomg({
    roomCode,
    userId,
    playerType,
  });

  useEffect(() => {
    if (!roomDisbanded) return;
    leave();
    navigate("/lobby", { replace: true });
  }, [roomDisbanded, leave, navigate]);

  useEffect(() => {
    if (!room) return;
    const hostStillInRoom = room.players.some((p) => p.userId === room.hostId);
    if (userId !== room.hostId && !hostStillInRoom) {
      leave();
      navigate("/lobby", { replace: true });
    }
  }, [room, leave, navigate, userId]);

  if (error) return <div>Error: {error}</div>;
  if (roomDisbanded) return null;
  if (!connected || !room) return <div>Conectando...</div>;

  return <WaitingRoom roomRequest={room} leave={leave} />;
};
