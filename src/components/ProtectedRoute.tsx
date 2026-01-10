import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
    allowedRoles?: string[];
    fallbackPath?: string;
}

export const ProtectedRoute = ({ allowedRoles, fallbackPath = '/admin/login' }: ProtectedRouteProps) => {
    const { session, role, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-blue"></div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/admin/login" replace />;
    }

    // Safety check: existing session but failed to load role (prevent empty UI)
    // If we have a session but NO role, it means the earlier profile fetch failed completely.
    // We shouldn't let them in as "guest" in admin area.
    if (session && role === null) {
        // Option 1: Redirect to login to force clean slate
        // return <Navigate to="/admin/login" replace />;

        // Option 2: Show a friendly "Contact Support" or "Loading failed" screen?
        // For now, redirecting to login is safest key to force re-auth
        return <Navigate to="/admin/login" replace />;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
        // If user is logged in but doesn't have permission
        // Default to their "home" or the specified fallback
        const defaultFallback = role === 'waiter' ? '/admin/dishes' : '/admin';
        return <Navigate to={fallbackPath === '/admin/login' ? defaultFallback : fallbackPath} replace />;
    }

    return <Outlet />;
};
