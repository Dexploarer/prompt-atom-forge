import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Default Supabase configuration
const DEFAULT_SUPABASE_URL = 'https://your-project.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'your-anon-key';

// Try to load Supabase config from various sources
function getSupabaseConfig() {
  // 1. Try environment variables
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };
  }

  // 2. Try to read from web app's .env.local
  const webAppEnvPath = join(process.cwd(), '../../.env.local');
  if (existsSync(webAppEnvPath)) {
    try {
      const envContent = readFileSync(webAppEnvPath, 'utf-8');
      const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
      const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
      
      if (urlMatch && keyMatch && urlMatch[1] && keyMatch[1]) {
        return {
          url: urlMatch[1].trim(),
          anonKey: keyMatch[1].trim()
        };
      }
    } catch (error) {
      console.warn('Could not read web app environment file:', error);
    }
  }

  // 3. Try to read from CLI config directory
  const cliConfigPath = join(homedir(), '.prompt-or-die', 'supabase.json');
  if (existsSync(cliConfigPath)) {
    try {
      const config = JSON.parse(readFileSync(cliConfigPath, 'utf-8'));
      if (config.url && config.anonKey) {
        return config;
      }
    } catch (error) {
      console.warn('Could not read CLI Supabase config:', error);
    }
  }

  // 4. Fall back to defaults (user will need to configure)
  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY
  };
}

const config = getSupabaseConfig();

export const supabase = createClient(config.url, config.anonKey, {
  auth: {
    persistSession: true,
    storageKey: 'prompt-or-die-cli-auth',
    storage: {
      getItem: (key: string) => {
        try {
          const configDir = join(homedir(), '.prompt-or-die');
          const authFile = join(configDir, 'auth.json');
          if (existsSync(authFile)) {
            const auth = JSON.parse(readFileSync(authFile, 'utf-8'));
            return auth[key] || null;
          }
        } catch (error) {
          console.warn('Error reading auth storage:', error);
        }
        return null;
      },
      setItem: (key: string, value: string) => {
        try {
          const configDir = join(homedir(), '.prompt-or-die');
          const authFile = join(configDir, 'auth.json');
          
          let auth: Record<string, any> = {};
          if (existsSync(authFile)) {
            auth = JSON.parse(readFileSync(authFile, 'utf-8'));
          }
          
          auth[key] = value;
          
          // Ensure directory exists
          const fs = require('fs-extra');
          fs.ensureDirSync(configDir);
          fs.writeFileSync(authFile, JSON.stringify(auth, null, 2));
        } catch (error) {
          console.warn('Error writing auth storage:', error);
        }
      },
      removeItem: (key: string) => {
        try {
          const configDir = join(homedir(), '.prompt-or-die');
          const authFile = join(configDir, 'auth.json');
          
          if (existsSync(authFile)) {
            const auth = JSON.parse(readFileSync(authFile, 'utf-8'));
            delete auth[key];
            
            const fs = require('fs-extra');
            fs.writeFileSync(authFile, JSON.stringify(auth, null, 2));
          }
        } catch (error) {
          console.warn('Error removing from auth storage:', error);
        }
      }
    }
  }
});

export interface User {
  id: string;
  email: string;
  handle?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthSession {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// Helper functions for CLI authentication
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string, handle?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        handle: handle || email.split('@')[0]
      }
    }
  });
  
  if (error) throw error;
  
  // Insert user data if registration successful
  if (data.user) {
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        handle: handle || email.split('@')[0],
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.warn('Warning: Could not insert user data:', insertError.message);
    }
  }
  
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// Check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return config.url !== DEFAULT_SUPABASE_URL && config.anonKey !== DEFAULT_SUPABASE_ANON_KEY;
}

// Get current configuration
export function getSupabaseConfigInfo() {
  return {
    url: config.url,
    configured: isSupabaseConfigured()
  };
}