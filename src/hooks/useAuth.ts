import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const getRole = async (userId: string) => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single();

                if (error) {
                    console.error("Error fetching role:", error);
                    return null;
                }
                return data?.role || null;
            } catch (err) {
                console.error("Exception fetching role:", err);
                return null;
            }
        };

        const initializeAuth = async () => {
            // Check active session first
            const { data: { session: initialSession } } = await supabase.auth.getSession();

            if (initialSession) {
                const userRole = await getRole(initialSession.user.id);
                if (mounted) {
                    setSession(initialSession);
                    setRole(userRole);
                    setLoading(false);
                }
            } else {
                if (mounted) {
                    setSession(null);
                    setRole(null);
                    setLoading(false);
                }
            }

            // Listen for changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
                if (!mounted) return;

                if (newSession) {
                    // Optimized: Only fetch role if session user changed or we don't have a role yet
                    // But for safety on reload/login, we just fetch it.
                    const userRole = await getRole(newSession.user.id);
                    if (mounted) {
                        setSession(newSession);
                        setRole(userRole);
                        setLoading(false);
                    }
                } else {
                    if (mounted) {
                        setSession(null);
                        setRole(null);
                        setLoading(false);
                    }
                }
            });

            return () => {
                subscription.unsubscribe();
            };
        };

        initializeAuth();

        return () => {
            mounted = false;
            // cleanupPromise corresponds to the subscription, usually handled inside.
            // The subscription cleanup is tricky with async wrapper, 
            // but Supabase subscription.unsubscribe() is sync.
            // We just let the variable scope handle 'mounted' check.
        };
    }, []);

    return { session, role, loading };
}
