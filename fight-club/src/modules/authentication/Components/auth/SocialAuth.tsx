import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import authApi from '../../Config/axios';
import { useNavigate } from 'react-router-dom';

export const SocialAuth = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = async (credentialResponse: any) => {
    try {
      const response = await authApi.post('/auth/oauth/google', {
        idToken: credentialResponse.credential 
      });
      
      const data = response.data;
      
      if (data.accessToken) {
        localStorage.setItem('fight_club_token', data.accessToken);
        localStorage.setItem('fight_club_refresh', data.refreshToken);
        localStorage.setItem('user_data', JSON.stringify({
          userId: data.userId,
          username: data.username,
          email: data.email,
          role: data.role
        }));
        navigate(`/lobby`);
      }
    } catch (err: any) {
      setError("ERROR AL AUTENTICAR CON GOOGLE");
      console.error("Error en el Arena:", err.response?.status || err.message);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="text-[11px] text-white/40 uppercase tracking-[0.3em] font-black italic">
        O continúa con
      </div>
      
      {error && (
        <div className="bg-[#E25127]/10 border border-[#E25127]/20 text-[#E25127] text-[10px] py-3 px-4 rounded-lg uppercase tracking-[0.2em] font-black flex items-center gap-3 w-full">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="bg-white/5 p-2 rounded-lg border border-white/10">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => setError("ERROR AL AUTENTICAR CON GOOGLE")}
          useOneTap
          theme="filled_black"
          shape="pill"
          ux_mode="popup"
          width="550"
        />
      </div>
    </div>
  );
};