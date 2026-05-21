import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield,
    AlertTriangle,
    Ban,
    Bell,
    Activity,
    LogOut
} from 'lucide-react';

import { getUserData } from '../../Types/localUserData';
import axios from 'axios';

type AdminProfile = {
    username: string;
    avatarURL: string;
};

export const AdminDashboard = () => {
    const navigate = useNavigate();

    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        pendingReports: 0,
        flaggedMessages: 0,
        activeBans: 0,
        systemStatus: 'ONLINE'
    });

    useEffect(() => {
        const loadAdminData = async () => {
            try {
                const userData = getUserData();

                if (!userData || userData.role !== 'ADMIN') {
                    navigate('/login');
                    return;
                }

                const token = localStorage.getItem('fight_club_token');

                const profileRes = await axios.get(
                    `${import.meta.env.VITE_API_URL}/user-profile/${userData.userId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setProfile({
                    username: userData.username,
                    avatarURL: profileRes.data?.avatarURL || ''
                });

                // Datos fake temporalmente
                // luego los conectamos al backend real
                setStats({
                    pendingReports: 12,
                    flaggedMessages: 34,
                    activeBans: 7,
                    systemStatus: 'ONLINE'
                });

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadAdminData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user_data');
        localStorage.removeItem('fight_club_token');
        localStorage.removeItem('fight_club_refresh');
        localStorage.removeItem('fight_club_userId');

        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0e0d] flex items-center justify-center">
                <div className="w-10 h-10 border-t-2 border-orange-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0e0d] text-white p-4 md:p-8">

            <div className="max-w-[1900px] mx-auto space-y-8">

                {/* HEADER */}
                <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-white/5 pb-8">

                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500/80">
                            Centro de Supervisión
                        </span>

                        <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter mt-1">
                            Admin Dashboard
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">

                        <button
                            onClick={() => navigate('/admin')}
                            className="group flex flex-col items-center justify-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 p-4 rounded-2xl transition-all"
                        >
                            <span className="text-white/60 group-hover:text-white text-lg">←</span>

                            <span className="text-[8px] font-black uppercase tracking-widest text-white/40">
                                Panel
                            </span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="group flex flex-col items-center justify-center gap-1 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/40 p-4 rounded-2xl transition-all"
                        >
                            <LogOut size={20} className="text-red-500" />

                            <span className="text-[8px] font-black uppercase tracking-widest text-red-500/60">
                                Salir
                            </span>
                        </button>

                    </div>

                </header>

                {/* GRID */}
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-8">

                    {/* PROFILE */}
                    <div className="lg:col-span-1">

                        <div className="bg-[#161616] border border-white/5 rounded-3xl p-6">

                            <div className="flex flex-col items-center text-center">

                                <img
                                    src={
                                        profile?.avatarURL?.startsWith('http')
                                            ? profile.avatarURL
                                            : `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile?.username}`
                                    }
                                    alt="admin"
                                    className="w-28 h-28 rounded-2xl border-2 border-orange-500/30 object-cover"
                                />

                                <h2 className="mt-5 text-xl font-black uppercase">
                                    {profile?.username}
                                </h2>

                                <div className="mt-2 px-3 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest">
                                    SUPER ADMIN
                                </div>

                                <p className="mt-4 text-xs text-white/40 leading-relaxed">
                                    Responsable de supervisión, moderación y control del sistema Fight Club.
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* CONTENT */}
                    <div className="md:col-span-3 lg:col-span-5 space-y-8">

                        {/* STATS */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

                            <AdminStatCard
                                icon={<AlertTriangle size={18} />}
                                label="Reportes"
                                value={stats.pendingReports}
                            />

                            <AdminStatCard
                                icon={<Bell size={18} />}
                                label="Mensajes"
                                value={stats.flaggedMessages}
                            />

                            <AdminStatCard
                                icon={<Ban size={18} />}
                                label="Baneos"
                                value={stats.activeBans}
                            />

                            <AdminStatCard
                                icon={<Activity size={18} />}
                                label="Sistema"
                                value={stats.systemStatus}
                            />

                        </div>

                        {/* PANELS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* MODERATION */}
                            <div className="bg-[#161616] border border-white/5 rounded-3xl p-6">

                                <div className="flex items-center gap-2 mb-6">
                                    <Shield size={16} className="text-orange-500" />

                                    <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40">
                                        Moderación
                                    </h3>
                                </div>

                                <div className="space-y-4">

                                    <QuickAction
                                        title="Gestionar Reportes"
                                        onClick={() => navigate('/admin')}
                                    />

                                    <QuickAction
                                        title="Auditar Chat"
                                        onClick={() => navigate('/admin')}
                                    />

                                    <QuickAction
                                        title="Gestionar Sanciones"
                                        onClick={() => navigate('/admin')}
                                    />

                                </div>

                            </div>

                            {/* SYSTEM */}
                            <div className="bg-[#161616] border border-white/5 rounded-3xl p-6">

                                <div className="flex items-center gap-2 mb-6">
                                    <Activity size={16} className="text-green-400" />

                                    <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40">
                                        Estado del Sistema
                                    </h3>
                                </div>

                                <div className="space-y-4">

                                    <SystemRow
                                        label="API Gateway"
                                        status="ONLINE"
                                    />

                                    <SystemRow
                                        label="Fight Service"
                                        status="ONLINE"
                                    />

                                    <SystemRow
                                        label="Moderation Service"
                                        status="ONLINE"
                                    />

                                    <SystemRow
                                        label="Notifications"
                                        status="ONLINE"
                                    />

                                </div>

                            </div>
                            {/* OBSERVABILITY */}
                            <div className="bg-[#161616] border border-white/5 rounded-3xl p-6">

                                <div className="flex items-center gap-2 mb-6">
                                    <Activity size={16} className="text-cyan-400" />

                                    <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40">
                                        Observabilidad
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {/* USER SERVICE */}
                                    <div className="bg-black/30 border border-cyan-500/10 rounded-2xl p-5 space-y-4">

                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-cyan-400">
                                                User Service
                                            </p>

                                            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">
                                                Monitoreo de usuarios y autenticación
                                            </p>
                                        </div>

                                        <div className="flex gap-3">

                                            <a
                                                href="https://prometheus-user.jollyglacier-798708f7.brazilsouth.azurecontainerapps.io/targets"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl py-3 text-center text-[10px] font-black uppercase tracking-widest text-orange-400 transition-all"
                                            >
                                                Prometheus
                                            </a>

                                            <a
                                                href="https://userfight-grafana-bafbevdmb2h0edeq.sbr.grafana.azure.com/"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl py-3 text-center text-[10px] font-black uppercase tracking-widest text-cyan-400 transition-all"
                                            >
                                                Grafana
                                            </a>

                                        </div>

                                    </div>

                                    {/* SUPERVISION */}
                                    <div className="bg-black/30 border border-red-500/10 rounded-2xl p-5 space-y-4">

                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-red-400">
                                                Supervision Service
                                            </p>

                                            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">
                                                Moderación, sanciones y auditoría
                                            </p>
                                        </div>

                                        <div className="flex gap-3">

                                            <a
                                                href="https://prometheus-supervision.greenforest-c1136ef7.canadacentral.azurecontainerapps.io/targets"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl py-3 text-center text-[10px] font-black uppercase tracking-widest text-orange-400 transition-all"
                                            >
                                                Prometheus
                                            </a>

                                            <a
                                                href="https://grafana-supervision-f5hmephubaejh2bj.cca.grafana.azure.com/?orgId=1&from=now-6h&to=now&timezone=browser"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl py-3 text-center text-[10px] font-black uppercase tracking-widest text-red-400 transition-all"
                                            >
                                                Grafana
                                            </a>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
};

const AdminStatCard = ({
    icon,
    label,
    value
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
}) => (
    <div className="bg-[#161616] border border-white/5 rounded-2xl p-5 flex items-center gap-4">

        <div className="p-3 rounded-xl bg-black/40 text-orange-500">
            {icon}
        </div>

        <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">
                {label}
            </p>

            <p className="text-2xl font-black text-white italic">
                {value}
            </p>
        </div>

    </div>
);

const QuickAction = ({
    title,
    onClick
}: {
    title: string;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className="w-full bg-black/30 hover:bg-orange-600/10 border border-white/5 hover:border-orange-500/20 rounded-2xl p-4 text-left transition-all"
    >
        <p className="text-sm font-black uppercase tracking-widest text-white/70">
            {title}
        </p>
    </button>
);

const SystemRow = ({
    label,
    status
}: {
    label: string;
    status: string;
}) => (
    <div className="flex items-center justify-between bg-black/30 rounded-2xl p-4">

        <span className="text-sm font-bold text-white/70">
            {label}
        </span>

        <span className="text-[10px] font-black uppercase tracking-widest text-green-400">
            {status}
        </span>

    </div>
);