import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

export const api = {
    categories: {
        list: async () => {
            const { data, error } = await supabase.from('categories').select('*');
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
        list: async () => {
            const { data, error } = await supabase.from('dishes').select('*');
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
            const { data, error } = await supabase.from('profiles').select('*');
            if (error) throw error;
            return data;
        },
        updateRole: async (id: string, role: string) => {
            const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select().single();
            if (error) throw error;
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
            // We use the MAIN client (admin) to update the profile because the new user might not have permissions yet
            // or we simply want to ensure it's done with admin privileges.
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    role: userData.role
                })
                .eq('id', authData.user.id);

            // If profile update fails, we might technically have an orphan auth user, 
            // but for this MVP we just throw.
            if (profileError) {
                console.error("Error updating profile:", profileError);
                throw profileError;
            }

            return authData.user;
        }
    }
};
