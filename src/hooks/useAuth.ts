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
                // Try to get from local storage or cache if possible to avoid blip, 
                // but for security we verify with DB. 
                // We could implement simple caching here if needed.
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single();

                if (error) {
                    console.error("Error fetching role:", error);
                    return 'waiter'; // Safe fallback or null? Let's stay safe: null might block access. 
                    // Actually, if DB fails but Auth is good, we might want to allow basic access or retry.
                    // For now, return null to force re-check or fail safe.
                    return null;
                }
                return data?.role || null;
            } catch (err) {
                console.error("Exception fetching role:", err);
                return null;
            }
        };

        const initializeAuth = async () => {
            // 1. Get initial session
            const { data: { session: initialSession } } = await supabase.auth.getSession();

            if (mounted) {
                if (initialSession) {
                    setSession(initialSession);
                    // Only fetch role if we have a session
                    const userRole = await getRole(initialSession.user.id);
                    if (mounted) {
                        setRole(userRole);
                        setLoading(false);
                    }
                } else {
                    setSession(null);
                    setRole(null);
                    setLoading(false);
                }
            }

            // 2. Listen for changes (Sign in, Sign out, Token Refresh)
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
                if (!mounted) return;

                // console.log("Auth event:", event);

                if (newSession) {
                    setSession(newSession);
                    // If switching users or fresh login, get role. 
                    // If just refreshing token, role probably hasn't changed, but it's safer to re-verify.
                    // To optimize: could check if user ID changed.
                    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                        const userRole = await getRole(newSession.user.id);
                        if (mounted) setRole(userRole);
                    }
                    setLoading(false);
                } else if (event === 'SIGNED_OUT') {
                    setSession(null);
                    setRole(null);
                    setLoading(false);
                }
                // Note: We don't nullify session on other events like 'USER_UPDATED' unless necessary.
            });

            return () => {
                subscription.unsubscribe();
            };
        };

        initializeAuth();

        return () => {
            mounted = false;
        };
    }, []);

    return { session, role, loading };
}
