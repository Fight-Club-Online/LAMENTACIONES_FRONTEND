import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, Ban, Clock, FileText, MessageSquare,
    AlertTriangle, CheckCircle, XCircle, ChevronRight,
    Bell, Eye, Trash2, RefreshCw, Search,
    Flag, Users, Activity, BarChart2, Mic, MessageCircle
} from 'lucide-react';
import { LobbyHeader } from '../Components/MainLobbyPage/Header/LobbyHeader';
import '../styles/index.css';
import { getUserData } from '../Types/localUserData';
import axios from 'axios';

const adminApi = (path: string, options: RequestInit = {}) => {
    const base = import.meta.env.VITE_API_SUPERVISION_URL?.replace(/\/$/, '');
    const credentials = btoa(`admin:${import.meta.env.VITE_SUPERVISION_ADMIN_PASS ?? 'admin'}`);
    return fetch(`${base}/api/v1/admin/supervision${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${credentials}`,
            ...options.headers,
        },
    });
};
const supervisionPublicApi = (path: string) => {
    const base = import.meta.env.VITE_API_SUPERVISION_URL?.replace(/\/$/, '');
    return fetch(`${base}/api/v1/supervision${path}`);
};


interface Report {
    id: string;
    reportedUserId: string;
    reporterId: string;
    reportedUsername?: string;
    reporterUsername?: string;
    reportStatus: string;
    description?: string;
    fightId?: string;
    adminNotes?: string;
    createdAt: string;
}

interface UserBanStatus {
    userId: string;
    status: 'ACTIVE' | 'BANNED' | 'SUSPENDED';
    canAccess: boolean;
    message: string;
    expiresAt?: string;
    remainingSeconds?: number;
    warningCount: number;
}

interface FlaggedMessage {
    id: string;
    fightId: string;
    userId: string;
    username?: string;
    content: string;
    timestamp: string;
    source?: string;
    count?: number;
    filtered: boolean;
    flagged: boolean;
}

type AdminTab = 'overview' | 'reports' | 'bans' | 'chat' | 'notifications';


const StatCard = ({ icon, label, value, color }: {
    icon: React.ReactNode; label: string; value: string | number; color: string;
}) => (
    <div className={`bg-[#161616] border ${color} rounded-2xl p-5 flex items-center gap-4 hover:brightness-110 transition-all`}>
        <div className={`p-3 rounded-xl bg-black/40`}>{icon}</div>
        <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">{label}</p>
            <p className="text-2xl font-black text-white italic">{value}</p>
        </div>
    </div>
);

const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
        <div className="text-orange-500">{icon}</div>
        <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40">{title}</h3>
    </div>
);

const BanPanel = () => {
    const [userId, setUserId] = useState('');
    const [reason, setReason] = useState('CHEATING');
    const [desc, setDesc] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [mode, setMode] = useState<'ban' | 'suspend' | 'lift'>('ban');
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [checkId, setCheckId] = useState('');
    const [userStatus, setUserStatus] = useState<UserBanStatus | null>(null);

    const adminData = getUserData();
    const adminId = getUserData()?.userId ?? '';

    const handleAction = async () => {
        if (!userId) return;
        setLoading(true); setStatus(null);
        try {
            if (mode === 'lift') {
                const r = await adminApi(`/ban/${userId}?adminId=${adminId}`, { method: 'DELETE' });
                setStatus(r.ok ? '✅ Ban levantado correctamente' : '❌ Error al levantar el ban');
            } else if (mode === 'ban') {
                const r = await adminApi(`/ban/${userId}`, {
                    method: 'POST',
                    body: JSON.stringify({ adminId, reason, description: desc }),
                });
                if (!r.ok) {
                    const body = await r.json().catch(() => null);
                    setStatus(`❌ ${body?.message ?? 'Error en la acción'}`);
                } else {
                    setStatus('✅ Usuario baneado correctamente');
                }
            } else {
                if (!expiresAt) { setStatus('❌ Debes seleccionar fecha de expiración'); setLoading(false); return; }
                const r = await adminApi(`/suspend/${userId}`, {
                    method: 'POST',
                    body: JSON.stringify({
                        adminId,
                        reason,
                        description: desc,
                        expiresAt: new Date(expiresAt).toISOString(),
                    }),
                });
                if (!r.ok) {
                    const body = await r.json().catch(() => null);
                    setStatus(`❌ ${body?.message ?? 'Error en la acción'}`);
                } else {
                    setStatus('✅ Usuario suspendido correctamente');
                }
            }
        } catch { setStatus('❌ Error de conexión'); }
        finally { setLoading(false); }
    };
    const checkStatus = async () => {
        if (!checkId) return;
        setLoading(true);
        try {
            const r = await supervisionPublicApi(`/status/${checkId}`);
            if (r.ok) setUserStatus(await r.json());
        } catch { }
        finally { setLoading(false); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Acción */}
            <div className="bg-[#161616] border border-white/5 rounded-2xl p-6">
                <SectionHeader icon={<Ban size={12} />} title="Gestión de Sanciones" />

                {/* Tabs */}
                <div className="flex gap-2 mb-5">
                    {(['ban', 'suspend', 'lift'] as const).map(m => (
                        <button key={m} onClick={() => setMode(m)}
                            className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === m
                                ? m === 'lift' ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'
                                : 'bg-black/40 text-white/30 hover:text-white/60'
                                }`}>
                            {m === 'ban' ? 'Banear' : m === 'suspend' ? 'Suspender' : 'Levantar'}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    <AdminInput label="ID del Usuario" value={userId} onChange={setUserId} placeholder="userId del combatiente" />

                    {mode !== 'lift' && <>
                        <div className="space-y-1">
                            <label className="text-[9px] uppercase font-black text-white/30 ml-1">Razón</label>
                            <select value={reason} onChange={e => setReason(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500 transition-all">
                                {['HATE_SPEECH', 'HARASSMENT', 'CHEATING', 'SPAM', 'REPEATED_VIOLATIONS', 'ADMIN_DECISION', 'OTHER'].map(r => (
                                    <option key={r} value={r}>{r.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <AdminInput label="Descripción" value={desc} onChange={setDesc} placeholder="Detalles de la sanción..." />
                        {mode === 'suspend' && (
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase font-black text-white/30 ml-1">Fecha y hora de expiración</label>
                                <input
                                    type="datetime-local"
                                    value={expiresAt}
                                    onChange={e => setExpiresAt(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500 transition-all"
                                />
                            </div>
                        )}
                    </>}

                    <button onClick={handleAction} disabled={loading || !userId}
                        className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-40 ${mode === 'lift' ? 'bg-green-600 hover:bg-green-500' : 'bg-orange-600 hover:bg-orange-500'
                            } text-white`}>
                        {loading ? 'Procesando...' : mode === 'ban' ? 'Ejecutar Ban' : mode === 'suspend' ? 'Suspender' : 'Levantar Ban'}
                    </button>

                    {status && (
                        <div className={`text-[10px] font-black uppercase tracking-widest p-3 rounded-xl ${status.startsWith('✅') ? 'bg-green-900/30 text-green-400 border border-green-500/20' : 'bg-red-900/30 text-red-400 border border-red-500/20'
                            }`}>{status}</div>
                    )}
                </div>
            </div>

            {/* Check status */}
            <div className="bg-[#161616] border border-white/5 rounded-2xl p-6">
                <SectionHeader icon={<Eye size={12} />} title="Verificar Estado de Usuario" />
                <div className="space-y-3">
                    <AdminInput label="ID del Usuario" value={checkId} onChange={setCheckId} placeholder="userId a verificar" />
                    <button onClick={checkStatus} disabled={loading || !checkId}
                        className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-40">
                        {loading ? 'Consultando...' : 'Verificar Estado'}
                    </button>

                    {userStatus && (
                        <div className="bg-black/60 border border-white/5 rounded-xl p-4 space-y-2 animate-in fade-in duration-300">
                            <StatusBadge label="Baneado" active={userStatus.status === 'BANNED'} />
                            <StatusBadge label="Suspendido" active={userStatus.status === 'SUSPENDED'} />
                            <p className="text-[10px] text-white/40 uppercase tracking-widest">
                                Estado: <span className="text-orange-400">{userStatus.message}</span>
                            </p>
                            {userStatus.warningCount > 0 && (
                                <p className="text-[10px] text-white/40 uppercase tracking-widest">
                                    Advertencias: <span className="text-white/70">{userStatus.warningCount}</span>
                                </p>
                            )}
                            {userStatus.expiresAt && (
                                <p className="text-[10px] text-white/40 uppercase tracking-widest">
                                    Expira: <span className="text-white/70">{new Date(userStatus.expiresAt).toLocaleString()}</span>
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ReportsPanel = () => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'pending' | 'history'>('pending');
    const [userIdFilter, setUserIdFilter] = useState('');
    const [action, setAction] = useState('REVIEWED');
    const [notes, setNotes] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [reviewStatus, setReviewStatus] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const path = userIdFilter
                ? `/reports/user/${userIdFilter}`
                : view === 'pending' ? '/reports/pending?page=0&size=20' : '/reports/history?page=0&size=20';
            const r = await adminApi(path);
            if (r.ok) setReports(await r.json());
        } catch { }
        finally { setLoading(false); }
    }, [view, userIdFilter]);

    useEffect(() => { load(); }, [load]);

    const reviewReport = async () => {
        if (!selectedId) return;
        setLoading(true);
        try {
            const r = await adminApi(`/reports/${selectedId}`, {
                method: 'PATCH',
                body: JSON.stringify({ action, notes }),
            });
            setReviewStatus(r.ok ? '✅ Reporte revisado' : '❌ Error');
            if (r.ok) { setSelectedId(null); load(); }
        } catch { setReviewStatus('❌ Error de conexión'); }
        finally { setLoading(false); }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-3 items-center">
                <button onClick={() => { setView('pending'); setUserIdFilter(''); }}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${view === 'pending' ? 'bg-orange-600 text-white' : 'bg-black/40 text-white/30 hover:text-white/60'}`}>
                    Pendientes
                </button>
                <button onClick={() => { setView('history'); setUserIdFilter(''); }}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-orange-600 text-white' : 'bg-black/40 text-white/30 hover:text-white/60'}`}>
                    Historial
                </button>
                <div className="flex-1 relative">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input value={userIdFilter} onChange={e => setUserIdFilter(e.target.value)}
                        placeholder="Filtrar por userId..."
                        className="w-full bg-black border border-white/10 rounded-xl py-2 pl-8 pr-3 text-sm text-white outline-none focus:border-orange-500 transition-all placeholder:text-white/20" />
                </div>
                <button onClick={load} className="p-2 bg-black/40 rounded-xl text-white/40 hover:text-white transition-all">
                    <RefreshCw size={14} />
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><div className="w-6 h-6 border-t-2 border-orange-500 rounded-full animate-spin" /></div>
            ) : reports.length === 0 ? (
                <div className="text-center py-10 text-white/20 text-xs uppercase tracking-widest font-black">Sin reportes</div>
            ) : (
                <div className="space-y-2">
                    {reports.map(rep => (
                        <div key={rep.id}
                            className={`bg-[#161616] border rounded-xl p-4 flex items-center gap-4 transition-all cursor-pointer ${selectedId === rep.id ? 'border-orange-500/50' : 'border-white/5 hover:border-orange-500/20'
                                }`}
                            onClick={() => setSelectedId(selectedId === rep.id ? null : rep.id)}>
                            <Flag size={14} className="text-orange-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black uppercase text-white truncate">
                                    {rep.reportedUsername ?? rep.reportedUserId}
                                </p>
                                <p className="text-[9px] text-white/30 uppercase tracking-widest">
                                    Reportado: <span className="text-white/50">{rep.reportedUserId}</span>
                                </p>
                                {rep.reporterUsername && (
                                    <p className="text-[9px] text-white/30 uppercase tracking-widest">
                                        Por: <span className="text-white/50">{rep.reporterUsername}</span>
                                    </p>
                                )}
                                {/* FIX 3: mostrar fightId */}
                                {rep.fightId && (
                                    <p className="text-[9px] text-white/30 uppercase tracking-widest">
                                        Combate: <span className="text-orange-400/70 font-mono text-[8px]">{rep.fightId}</span>
                                    </p>
                                )}
                                {rep.description && <p className="text-[9px] text-white/20 mt-1 truncate">{rep.description}</p>}
                            </div>
                            <div className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${rep.reportStatus === 'PENDING' ? 'bg-orange-500/20 text-orange-400' :
                                rep.reportStatus === 'RESOLVED' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'
                                }`}>{rep.reportStatus}</div>
                            <ChevronRight size={12} className="text-white/20 shrink-0" />
                        </div>
                    ))}
                </div>
            )}

            {/* Panel de revisión */}
            {selectedId && (
                <div className="bg-black border border-orange-500/20 rounded-2xl p-5 space-y-3 animate-in fade-in duration-300">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Revisar Reporte</p>
                    <div className="space-y-1">
                        <label className="text-[9px] uppercase font-black text-white/30 ml-1">Acción</label>
                        <select value={action} onChange={e => setAction(e.target.value)}
                            className="w-full bg-[#161616] border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500 transition-all">
                            {['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'].map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>
                    <AdminInput label="Notas" value={notes} onChange={setNotes} placeholder="Observaciones del admin..." />
                    <button onClick={reviewReport} disabled={loading}
                        className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-40">
                        {loading ? 'Enviando...' : 'Confirmar Revisión'}
                    </button>
                    {reviewStatus && <p className="text-[10px] font-black">{reviewStatus}</p>}
                </div>
            )}
        </div>
    );
};

const ChatPanel = () => {
    const [fightId, setFightId] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [flagged, setFlagged] = useState<FlaggedMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<'fight' | 'flagged'>('flagged');

    const loadFlagged = async () => {
        setLoading(true);
        try {
            const r = await adminApi('/chat/flagged?page=0&size=20');
            if (r.ok) setFlagged(await r.json());
        } catch { }
        finally { setLoading(false); }
    };

    const loadFightChat = async () => {
        if (!fightId) return;
        setLoading(true);
        try {
            const r = await adminApi(`/chat/${fightId}?limit=100`);
            if (r.ok) setMessages(await r.json());
        } catch { }
        finally { setLoading(false); }
    };

    useEffect(() => { if (tab === 'flagged') loadFlagged(); }, [tab]);

    return (
        <div className="space-y-4">
            <div className="flex gap-3">
                {(['flagged', 'fight'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-orange-600 text-white' : 'bg-black/40 text-white/30 hover:text-white/60'}`}>
                        {t === 'flagged' ? '🚩 Mensajes Flagueados' : '⚔️ Historial por Combate'}
                    </button>
                ))}
            </div>

            {tab === 'fight' && (
                <div className="flex gap-3">
                    <div className="flex-1">
                        <AdminInput label="" value={fightId} onChange={setFightId} placeholder="ID del combate..." />
                    </div>
                    <button onClick={loadFightChat} disabled={loading || !fightId}
                        className="px-4 py-3 mt-1 bg-orange-600 hover:bg-orange-500 rounded-xl text-white font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-40">
                        Cargar
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-10"><div className="w-6 h-6 border-t-2 border-orange-500 rounded-full animate-spin" /></div>
            ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {(tab === 'flagged' ? flagged : messages).map((msg: any) => (
                        <div key={msg.id} className="bg-[#161616] border border-red-500/10 rounded-xl p-4 flex gap-3">
                            <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-white/80 leading-relaxed">{msg.content}</p>
                                {/* FIX 4: mostrar source con badge de color */}
                                <div className="flex gap-3 mt-1 items-center flex-wrap">
                                    <span className="text-[8px] text-white/20 uppercase tracking-widest">
                                        Sender: {msg.userId || msg.username}
                                    </span>
                                    {msg.fightId && (
                                        <span className="text-[8px] text-orange-400/50 uppercase tracking-widest">
                                            Fight: {msg.fightId}
                                        </span>
                                    )}
                                    {msg.source && (
                                        <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                            msg.source === 'VOICE'
                                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20'
                                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                                        }`}>
                                            {msg.source === 'VOICE'
                                                ? <Mic size={8} />
                                                : <MessageCircle size={8} />
                                            }
                                            {msg.source}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {(tab === 'flagged' ? flagged : messages).length === 0 && (
                        <div className="text-center py-10 text-white/20 text-xs uppercase tracking-widest font-black">
                            Sin mensajes
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const NotificationsPanel = () => {
    const [userId, setUserId] = useState('');
    const [notifs, setNotifs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const r = await adminApi(`/notifications/${userId}/history`);
            if (r.ok) setNotifs(await r.json());
        } catch { }
        finally { setLoading(false); }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-3">
                <div className="flex-1">
                    <AdminInput label="" value={userId} onChange={setUserId} placeholder="userId del combatiente..." />
                </div>
                <button onClick={load} disabled={loading || !userId}
                    className="px-4 py-3 mt-1 bg-orange-600 hover:bg-orange-500 rounded-xl text-white font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-40">
                    {loading ? '...' : 'Cargar'}
                </button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {notifs.map((n: any) => (
                    <div key={n.id} className="bg-[#161616] border border-white/5 rounded-xl p-4 flex gap-3">
                        <Bell size={14} className="text-orange-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs text-white/80">{n.message || n.content || JSON.stringify(n)}</p>
                            {n.createdAt && (
                                <p className="text-[8px] text-white/20 uppercase tracking-widest mt-1">
                                    {new Date(n.createdAt).toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
                {notifs.length === 0 && userId && !loading && (
                    <div className="text-center py-10 text-white/20 text-xs uppercase tracking-widest font-black">
                        Sin notificaciones
                    </div>
                )}
            </div>
        </div>
    );
};

const AdminInput = ({ label, value, onChange, placeholder, type = 'text' }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; type?: string;
}) => (
    <div className="space-y-1">
        {label && <label className="text-[9px] uppercase font-black text-white/30 ml-1">{label}</label>}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500 transition-all placeholder:text-white/20" />
    </div>
);

const StatusBadge = ({ label, active }: { label: string; active: boolean }) => (
    <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest font-black text-white/40">{label}</span>
        <span className={`flex items-center gap-1 text-[9px] font-black uppercase ${active ? 'text-red-400' : 'text-green-400'}`}>
            {active ? <XCircle size={10} /> : <CheckCircle size={10} />}
            {active ? 'Sí' : 'No'}
        </span>
    </div>
);

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart2 size={14} /> },
    { id: 'reports', label: 'Reportes', icon: <FileText size={14} /> },
    { id: 'bans', label: 'Sanciones', icon: <Ban size={14} /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={14} /> },
    { id: 'notifications', label: 'Notificaciones', icon: <Bell size={14} /> },
];

export const AdminPage: React.FC = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [avatarURL, setAvatarURL] = useState('');
    const [tab, setTab] = useState<AdminTab>('overview');
    const [pendingCount, setPendingCount] = useState<number>(0);
    const [flaggedCount, setFlaggedCount] = useState<number>(0);

    useEffect(() => {
        const userData = getUserData();
        if (!userData) { navigate('/login'); return; }
        if (userData.role !== 'ADMIN') { navigate('/lobby'); return; }
        setUserName(userData.username);

        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('fight_club_token');
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/user-profile/${userData.userId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.data?.avatarURL) setAvatarURL(res.data.avatarURL);
            } catch { }
        };

        const fetchCounts = async () => {
            try {
                const [rRep, rFl] = await Promise.all([
                    adminApi('/reports/pending?page=0&size=100'),
                    adminApi('/chat/flagged?page=0&size=100'),
                ]);
                if (rRep.ok) { const d = await rRep.json(); setPendingCount(d.length ?? 0); }
                if (rFl.ok) { const d = await rFl.json(); setFlaggedCount(d.length ?? 0); }
            } catch { }
        };

        fetchProfile();
        fetchCounts();
    }, [navigate]);

    return (
        <div className="bg-[#0f0e0d] min-h-screen text-white">
            <LobbyHeader userName={userName} avatarURL={avatarURL} />

            <main className="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-8">

                {/* FIX 1: header sin botones "← Lobby" y "Salir" — la navegación
                    ya existe en LobbyHeader (profile click → /admin, y los iconos
                    de friends/notifs/settings). Solo queda el título. */}
                <div className="border-b border-white/5 pb-6">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-orange-500/80">
                        Panel de Control
                    </span>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white mt-1">
                        Administración
                    </h1>
                </div>

                {/* Stats overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={<Flag size={18} className="text-orange-500" />}
                        label="Reportes Pendientes" value={pendingCount} color="border-orange-500/20" />
                    <StatCard icon={<AlertTriangle size={18} className="text-red-400" />}
                        label="Mensajes Flagueados" value={flaggedCount} color="border-red-500/20" />
                    <StatCard icon={<Shield size={18} className="text-blue-400" />}
                        label="Panel Activo" value="Admin" color="border-blue-500/20" />
                    <StatCard icon={<Activity size={18} className="text-green-400" />}
                        label="Estado Sistema" value="Online" color="border-green-500/20" />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${tab === t.id
                                ? 'bg-orange-600 text-white shadow-[0_0_20px_rgba(234,88,12,0.3)]'
                                : 'bg-[#161616] border border-white/5 text-white/30 hover:text-white/60 hover:border-white/10'
                                }`}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                {/* Panel content */}
                <div className="bg-[#161616] border border-white/5 rounded-2xl p-6 animate-in fade-in duration-300">
                    {tab === 'overview' && (
                        <div className="space-y-4">
                            <SectionHeader icon={<BarChart2 size={12} />} title="Resumen del Sistema" />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="bg-black/40 border border-orange-500/10 rounded-xl p-5 space-y-2">
                                    <p className="text-[9px] uppercase font-black tracking-[0.3em] text-orange-500">Acciones Disponibles</p>
                                    {[
                                        { icon: <Ban size={12} />, label: 'Banear / Suspender usuarios' },
                                        { icon: <FileText size={12} />, label: 'Revisar reportes pendientes' },
                                        { icon: <MessageSquare size={12} />, label: 'Auditar chat de combates' },
                                        { icon: <AlertTriangle size={12} />, label: 'Ver mensajes flagueados' },
                                        { icon: <Bell size={12} />, label: 'Historial de notificaciones' },
                                        { icon: <Eye size={12} />, label: 'Verificar estado de usuarios' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 text-white/50 text-xs">
                                            <span className="text-orange-500">{item.icon}</span>
                                            {item.label}
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-black/40 border border-white/5 rounded-xl p-5">
                                    <p className="text-[9px] uppercase font-black tracking-[0.3em] text-white/30 mb-3">Acceso Rápido</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {TABS.filter(t => t.id !== 'overview').map(t => (
                                            <button key={t.id} onClick={() => setTab(t.id)}
                                                className="flex items-center gap-2 p-3 bg-[#1a1a1a] hover:bg-orange-600/20 border border-white/5 hover:border-orange-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white/80 transition-all">
                                                <span className="text-orange-500">{t.icon}</span> {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {tab === 'reports' && <><SectionHeader icon={<FileText size={12} />} title="Gestión de Reportes" /><ReportsPanel /></>}
                    {tab === 'bans' && <BanPanel />}
                    {tab === 'chat' && <><SectionHeader icon={<MessageSquare size={12} />} title="Auditoría de Chat" /><ChatPanel /></>}
                    {tab === 'notifications' && <><SectionHeader icon={<Bell size={12} />} title="Notificaciones de Usuario" /><NotificationsPanel /></>}
                </div>
            </main>
        </div>
    );
};