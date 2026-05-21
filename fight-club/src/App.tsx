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
import { AdminPage } from './modules/Lobby/pages/AdminPage.tsx';
import { AdminRoute } from "./modules/authentication/Components/ui/AdminRoute.tsx";
import SpriteTest from "./modules/Fight/pages/SpriteTest.tsx";
import { AdminDashboard } from "./modules/Lobby/Components/admin/AdminDashboard.tsx";
function App() {
  return (
    <BrowserRouter>
      <div className="antialiased min-h-screen w-full overflow-x-hidden bg-zinc-950 text-white">
        <Routes>
          {/* Redirección inicial */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Rutas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/guest" element={<GuestPage />} />
          <Route path="/sprite-test" element={<SpriteTest />} />

          {/* Perfil de Usuario */}
          <Route path="/:username/perfil" element={
            <PrivateRoute>
              <PlayerDashboard />
            </PrivateRoute>
          } />

          <Route path="/profile" element={<Navigate to="/login" replace />} />

          {/* Lobby y Salas de espera */}
          <Route path="/lobby" element={
            <PrivateRoute>
              <LobbyPage />
            </PrivateRoute>
          } />

          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />

          <Route path="/admin" element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } />

          <Route path="/waiting-room" element={
            <PrivateRoute>
              <WaitingRoomPage />
            </PrivateRoute>
          } />

          {/* Arena de combate dinámica */}
          <Route path="/fight/:fightId" element={
            <PrivateRoute>
              <FightPage />
            </PrivateRoute>
          } />

          {/* 404 - Manejo de rutas no encontradas */}
          <Route path="*" element={
            <div className="h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-black text-red-600 mb-4">404</h1>
                <p className="text-zinc-400 uppercase tracking-widest">Página no encontrada</p>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
