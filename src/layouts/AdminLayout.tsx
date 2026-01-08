import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, LogOut, List, QrCode, ExternalLink, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';

export default function AdminLayout() {
    const { session, role, loading } = useAuth();
    const navigate = useNavigate();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    useEffect(() => {
        // Wait for loading to finish
        if (loading) return;

        // If no session, go to login
        if (!session) {
            navigate('/admin/login');
            return;
        }

        // If session exists but NOT admin, alert and logout/redirect
        if (role !== 'admin') {
            alert("Acceso Denegado: Se requieren permisos de Administrador.");
            supabase.auth.signOut();
            navigate('/admin/login');
        }
    }, [session, role, loading, navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin/login');
    };

    if (loading) return <div className="h-screen flex items-center justify-center text-slate-400">Verificando permisos...</div>;

    // Render layout only if authorized
    if (!session || role !== 'admin') return null;

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
                <div className="p-6 border-b border-slate-100">
                    <h1 className="text-xl font-display font-semibold text-charcoal">Comilones Admin</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-pastel-blue/20 hover:text-charcoal rounded-xl transition-colors">
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/admin/dishes" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-pastel-blue/20 hover:text-charcoal rounded-xl transition-colors">
                        <UtensilsCrossed size={20} />
                        <span>Platos</span>
                    </Link>
                    <Link to="/admin/categories" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-pastel-blue/20 hover:text-charcoal rounded-xl transition-colors">
                        <List size={20} />
                        <span>Categorías</span>
                    </Link>
                    <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-pastel-blue/20 hover:text-charcoal rounded-xl transition-colors">
                        <Users size={20} />
                        <span>Usuarios</span>
                    </Link>
                    <Link to="/admin/qr" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-pastel-blue/20 hover:text-charcoal rounded-xl transition-colors">
                        <QrCode size={20} />
                        <span>Códigos QR</span>
                    </Link>

                    <div className="pt-4 mt-4 border-t border-slate-100">
                        <Link to="/" target="_blank" className="flex items-center gap-3 px-4 py-3 text-pastel-blue hover:bg-pastel-blue/10 rounded-xl transition-colors font-medium">
                            <ExternalLink size={20} />
                            <span>Ver Menú Público</span>
                        </Link>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-100">
                    {session?.user?.email && (
                        <div className="px-4 py-2 mb-2 text-sm text-slate-500 font-medium truncate">
                            {session.user.email}
                        </div>
                    )}
                    <button onClick={() => setIsLogoutModalOpen(true)} className="flex w-full items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors">
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    <Outlet />
                </div>
            </main>

            <ConfirmationModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogout}
                title="Cerrar Sesión"
                message="¿Estás seguro de que quieres cerrar tu sesión actual?"
                confirmText="Sí, Salir"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
}
