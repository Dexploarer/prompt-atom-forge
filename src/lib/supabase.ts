import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Use Vite environment variables for browser environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nhghudkseqdmgajcwybz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZ2h1ZGtzZXFkbWdhamN3eWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTAzMjUsImV4cCI6MjA2NDY2NjMyNX0.zE_Lan3ZCZPWnF4MiVwRkNlz0aSOn8DCvkBhS64gYiU';

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// Authentication helpers
export async function signUp(email: string, password: string, handle: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      throw error;
    }

    // Insert user data into the public.users table after successful auth signup
    if (data.user?.id && data.user?.email) {
      const userEmail = data.user.email || email;
      const userHandle = handle || userEmail.split('@')[0];
      
      // User is automatically created in auth.users by Supabase Auth
      // No need to manually insert into users table
    }

    return data;
  } catch (err: any) {
    const message = err?.message || 'Supabase sign up failed';
    console.error('Sign up error:', err);
    throw new Error(message);
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (err: any) {
    const message = err?.message || 'Supabase sign in failed';
    console.error('Sign in error:', err);
    throw new Error(message);
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return true;
  } catch (err: any) {
    const message = err?.message || 'Supabase sign out failed';
    console.error('Sign out error:', err);
    throw new Error(message);
  }
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user;
}

// Session management
export function subscribeToAuthChanges(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}