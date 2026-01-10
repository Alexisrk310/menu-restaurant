import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, LogOut, List, QrCode, ExternalLink, Users, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';

export default function AdminLayout() {
    const { session, role, loading } = useAuth();
    const navigate = useNavigate();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const location = useLocation();

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        // Wait for loading to finish
        if (loading) return;

        // If no session, go to login
        if (!session) {
            navigate('/admin/login');
            return;
        }

        // If session exists but NOT admin or waiter, alert and logout/redirect
        if (role !== 'admin' && role !== 'waiter') {
            alert("Acceso Denegado: Se requieren permisos de Administrador o Mesero.");
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
    if (!session || (role !== 'admin' && role !== 'waiter')) return null;

    const isAdmin = role === 'admin';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-30">
                <h1 className="text-lg font-display font-semibold text-charcoal">Comilones Admin</h1>
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                    {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                md:static md:translate-x-0 md:h-screen md:sticky md:top-0
            `}>
                <div className="p-6 border-b border-slate-100 hidden md:block">
                    <h1 className="text-xl font-display font-semibold text-charcoal">Comilones Admin</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {isAdmin && (
                        <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-pastel-blue/20 hover:text-charcoal rounded-xl transition-colors">
                            <LayoutDashboard size={20} />
                            <span>Dashboard</span>
                        </Link>
                    )}
                    <Link to="/admin/dishes" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-pastel-blue/20 hover:text-charcoal rounded-xl transition-colors">
                        <UtensilsCrossed size={20} />
                        <span>Platos</span>
                    </Link>
                    <Link to="/admin/categories" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-pastel-blue/20 hover:text-charcoal rounded-xl transition-colors">
                        <List size={20} />
                        <span>Categorías</span>
                    </Link>
                    {isAdmin && (
                        <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-pastel-blue/20 hover:text-charcoal rounded-xl transition-colors">
                            <Users size={20} />
                            <span>Usuarios</span>
                        </Link>
                    )}
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
                    <div className="px-4 mb-2 text-xs text-slate-400 uppercase font-bold tracking-wider">
                        {isAdmin ? 'Administrador' : 'Mesero'}
                    </div>
                    <button onClick={() => setIsLogoutModalOpen(true)} className="flex w-full items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors">
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
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
