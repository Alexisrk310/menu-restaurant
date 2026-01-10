import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const getRole = async (userId: string, retries = 3, delay = 500, forceRefresh = false) => {
            try {
                // Force refresh if requested (e.g. after retries failed)
                if (forceRefresh) {
                    const { error: refreshError } = await supabase.auth.refreshSession();
                    if (refreshError) console.error("Session refresh failed:", refreshError);
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single();

                if (error) {
                    console.error("Error fetching role:", error);

                    if (retries > 0) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return getRole(userId, retries - 1, delay * 2, false);
                    } else if (!forceRefresh) {
                        // If retries exhausted, try ONE final attempt with a forced session refresh
                        // This handles cases where token is stale/invalid for RLS immediately after signup
                        console.log("Retries exhausted, forcing session refresh...");
                        return getRole(userId, 0, 0, true);
                    } else if (forceRefresh) {
                        // We forced refresh and it STILL failed.
                        // Try ONE reload of the page, to verify if it's a browser state issue.
                        const hasReloaded = sessionStorage.getItem('auth_retry_reloaded');
                        if (!hasReloaded) {
                            console.log("Role fetch failed after refresh. Attempting page reload...");
                            sessionStorage.setItem('auth_retry_reloaded', 'true');
                            window.location.reload();
                            return null;
                        } else {
                            // We already reloaded and it still fails.
                            console.error("Critical Auth Error: Role not found even after reload. Signing out.");
                            sessionStorage.removeItem('auth_retry_reloaded');
                            await supabase.auth.signOut();
                            return null;
                        }
                    }
                    return null;
                }

                // SUCCESS CASE
                sessionStorage.removeItem('auth_retry_reloaded');

                if (data?.role) {
                    // If we forced refresh (and succeeded), we reload just to be super safe 
                    // and ensure all app state (sockets, listeners) are fresh.
                    // But we check if we just reloaded to strictly avoid loops even here.
                    const hasReloaded = sessionStorage.getItem('auth_retry_reloaded');
                    if (!hasReloaded) {
                        console.log("Session recovery successful. Reloading to sync app state...");
                        sessionStorage.setItem('auth_retry_reloaded', 'true');
                        window.location.reload();
                        return null;
                    }
                    return data.role;
                }
                return null;
            } catch (err) {
                console.error("Exception fetching role:", err);
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return getRole(userId, retries - 1, delay * 2, false);
                }
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
