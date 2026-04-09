import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./modules/authentication/styles/index.css"; 
import "./modules/Lobby/styles/index.css";

import { LoginPage } from "./modules/authentication/pages/LoginPage.tsx";
import { RegisterPage } from "./modules/authentication/pages/RegisterPage.tsx";
import { GuestPage } from "./modules/authentication/pages/GuestPage.tsx";
import { PlayerDashboard } from "./modules/authentication/Components/profile/PlayerDashboard.tsx";
import { PrivateRoute } from "./modules/authentication/Components/ui/PrivateRoute.tsx";
import { LobbyPage } from './modules/Lobby/pages/lobby.tsx';
import { WaitingRoomPage } from "./modules/Lobby/pages/WaitingRoomPage.tsx";
import { FightPage } from "./modules/Fight/pages/FightPage.tsx"; 

function App() {
  return (
    <BrowserRouter>
      <div className="antialiased">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/guest" element={<GuestPage />} />
          
          <Route path="/:username/perfil" element={
            <PrivateRoute>
              <PlayerDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/profile" element={<Navigate to="/login" replace />} />
          
          <Route path="/lobby" element={
            <PrivateRoute>
              <LobbyPage />
            </PrivateRoute>
          } />
          
          <Route path="/waiting-room" element={
            <PrivateRoute>
              <WaitingRoomPage />
            </PrivateRoute>
          } />

          {/* 2. Añade la ruta dinámica para la arena de combate */}
          <Route path="/fight/:fightId" element={
            <PrivateRoute>
              <FightPage />
            </PrivateRoute>
          } />

          <Route path="*" element={<div className="text-white p-10">404 - Not Found</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;