import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

export const api = {
    categories: {
        list: async (includeArchived = false) => {
            let query = supabase.from('categories').select('*').order('name');
            if (!includeArchived) {
                query = query.eq('is_active', true);
            }
            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
        update: async (id: string, updates: any) => {
            const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        create: async (category: any) => {
            const { data, error } = await supabase.from('categories').insert(category).select().single();
            if (error) throw error;
            return data;
        },
        delete: async (id: string) => {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) throw error;
            return;
        }
    },
    dishes: {
        list: async (includeArchived = false) => {
            let query = supabase.from('dishes').select('*').order('name');
            if (!includeArchived) {
                query = query.eq('is_active', true);
            }
            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
        create: async (dish: any) => {
            const { data, error } = await supabase.from('dishes').insert(dish).select().single();
            if (error) throw error;
            return data;
        },
        update: async (id: string, updates: any) => {
            const { data, error } = await supabase.from('dishes').update(updates).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        delete: async (id: string) => {
            const { error } = await supabase.from('dishes').delete().eq('id', id);
            if (error) throw error;
            return;
        }
    },
    settings: {
        get: async (key: string) => {
            const { data, error } = await supabase.from('settings').select('value').eq('key', key).single();
            if (error && error.code !== 'PGRST116') throw error; // Ignore not found error
            return data?.value || null;
        },
        set: async (key: string, value: any) => {
            const { data, error } = await supabase.from('settings').upsert(
                { key, value },
                { onConflict: 'key' }
            ).select().single();
            if (error) throw error;
            return data;
        },
        getAll: async () => {
            const { data, error } = await supabase.from('settings').select('*');
            if (error) throw error;
            return data;
        }
    },
    storage: {
        uploadImage: async (file: File) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('dish-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('dish-images')
                .getPublicUrl(filePath);

            return data.publicUrl;
        }
    },
    users: {
        list: async () => {
            // We use RPC to get extra fields like 'email_confirmed_at' that aren't in public.profiles
            const { data, error } = await supabase.rpc('get_users_with_status');

            if (error) {
                console.error("Error fetching users with status, falling back to profiles", error);
                // Fallback for when RPC is not yet created
                const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
                if (profileError) throw profileError;
                return profiles;
            }
            return data;
        },
        updateRole: async (id: string, role: string) => {
            const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select().maybeSingle();
            if (error) throw error;
            if (!data) throw new Error("No se pudo encontrar el usuario para actualizar. Verifica que exista.");
            return data;
        },
        // Note: Creating a user with password requires Supabase Admin API or Client SignUp (which changes session).
        // For this demo, we'll assume we can create a profile and the user maps to it, 
        // or we just providing the interface for Role Management.
        createUser: async (userData: any) => {
            // Create a temporary client to avoid signing out the current admin
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
                auth: { persistSession: false } // Critical: Do not persist this session
            });

            // 1. Create User in Auth
            const { data: authData, error: authError } = await tempClient.auth.signUp({
                email: userData.email,
                password: userData.password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("No se pudo crear el usuario");

            // 2. Update Profile with extra data (First Name, Last Name, Role)
            // We use upsert to handle both cases: 
            // - Trigger already created the profile (Update)
            // - Trigger hasn't run yet or failed (Insert)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: authData.user.id,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    role: userData.role,
                    updated_at: new Date().toISOString()
                });

            if (profileError) {
                console.error("Error updating profile:", profileError);
                throw profileError;
            }

            return authData.user;
        },
        update: async (id: string, updates: any) => {
            const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().maybeSingle();
            if (error) throw error;
            if (!data) throw new Error("No se pudo actualizar el usuario. Verifica que exista.");
            return data;
        },
        delete: async (id: string) => {
            // We use an RPC call to securely delete the user from auth.users
            const { error } = await supabase.rpc('delete_user_by_id', { user_uuid: id });

            if (error) {
                console.error("Error deleting user:", error);
                // Fallback: If RPC fails (e.g., function not created yet), try deleting from profiles
                // This won't delete the auth user, but it's better than crashing.
                const { error: profileError } = await supabase.from('profiles').delete().eq('id', id);
                if (profileError) throw profileError;
            }
            return;
        }
    }
};
