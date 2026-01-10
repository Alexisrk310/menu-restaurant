import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Utensils } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function Login() {
    const navigate = useNavigate();
    const { session, role, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && session) {
            // Redirect based on role
            if (session.user) {
                // We need to wait for role to be available (useAuth provides it)
                // If role isn't ready yet (null), we wait. 
                // But !authLoading implies role is loaded (per useAuth internal logic)
                const target = role === 'waiter' ? '/admin/dishes' : '/admin';
                navigate(target, { replace: true });
            }
        }
    }, [session, role, authLoading, navigate]);

    if (authLoading) return null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;

            // Wait a moment for auth state to propagate or manually check role?
            // The useEffect will handle the redirect once session updates.
            // But we can be proactive if we want specific UX.
            // For now, let useEffect handle it naturally.
        } catch (err: any) {
            console.error(err);
            setError('Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-cream px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl shadow-pastel-purple/10 border border-white">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-pastel-pink/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Utensils className="text-charcoal" size={32} />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-charcoal">Comilones Admin</h1>
                    <p className="text-slate-500 mt-2">Ingresa tus credenciales para gestionar el menú.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <Input
                        label="Email"
                        placeholder="admin@comilones.com"
                        type="email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        label="Contraseña"
                        placeholder="••••••••"
                        type="password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        required
                    />

                    {error && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-xl">{error}</div>}

                    <div className="flex flex-col gap-3">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Ingresando...' : 'Ingresar'}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/')}
                            className="w-full"
                        >
                            Volver al Menú
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
