import { createClient } from '@supabase/supabase-js';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { Database } from '@/lib/database.types';

// PGlite local database instance
let pgliteInstance: PGlite | null = null;

// Get Supabase config - prioritize user configuration over defaults
function getSupabaseConfig() {
  // 1. Check environment variables first
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    return {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
      projectId: extractProjectId(process.env.SUPABASE_URL)
    };
  }

  // 2. Check CLI config file
  try {
    const configDir = join(homedir(), '.prompt-or-die');
    const configFile = join(configDir, 'config.json');
    if (existsSync(configFile)) {
      const config = JSON.parse(readFileSync(configFile, 'utf-8'));
      if (config.supabase?.url && config.supabase?.anonKey) {
        return {
          url: config.supabase.url,
          anonKey: config.supabase.anonKey,
          projectId: extractProjectId(config.supabase.url)
        };
      }
    }
  } catch (error) {
    console.warn('Error reading CLI config:', error);
  }

  // 3. Default to null (will use PGlite)
  return null;
}

function extractProjectId(url: string): string {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1]! : 'unknown';
}

const config = getSupabaseConfig();

// Initialize PGlite for local development
async function initPGlite(): Promise<PGlite> {
  if (!pgliteInstance) {
    const configDir = join(homedir(), '.prompt-or-die');
    const dbPath = join(configDir, 'local.db');
    
    // Ensure directory exists
    const fs = require('fs-extra');
    fs.ensureDirSync(configDir);
    
    pgliteInstance = new PGlite(dbPath);
    
    // Initialize basic schema for local development
    await initLocalSchema(pgliteInstance);
  }
  return pgliteInstance;
}

// Initialize local database schema
async function initLocalSchema(db: PGlite): Promise<void> {
  try {
    // Create basic tables for local development
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS prompt_chains (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS characters (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (error) {
    console.warn('Error initializing local schema:', error);
  }
}

// Create Supabase client only if configured
export const supabase = config ? createClient<Database>(config.url, config.anonKey, {
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
}) : null;

// Database abstraction layer
export async function getDatabase() {
  if (supabase) {
    return { type: 'supabase' as const, client: supabase };
  } else {
    const pglite = await initPGlite();
    return { type: 'pglite' as const, client: pglite };
  }
}

// Helper function to execute queries on PGlite only
export async function executeQuery(sql: string, params?: any[]) {
  const db = await getDatabase();
  
  if (db.type === 'supabase') {
    // For Supabase, we'd need to use the appropriate method based on the query
    throw new Error('Raw SQL execution not supported with Supabase client. Use specific methods instead.');
  } else {
    return await (db.client as PGlite).query(sql, params);
  }
}

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
  if (!supabase) {
    throw new Error('Authentication requires Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables or configure via CLI.');
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string, handle?: string) {
  if (!supabase) {
    throw new Error('Authentication requires Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables or configure via CLI.');
  }
  
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
  
  // Insert user settings if registration successful
  if (data.user) {
    const { error: insertError } = await supabase
      .from('user_settings')
      .insert({
        user_id: data.user.id,
        settings: {
          email: data.user.email!,
          handle: handle || email.split('@')[0]
        },
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.warn('Warning: Could not insert user data:', insertError.message);
    }
  }
  
  return data;
}

export async function signOut() {
  if (!supabase) {
    throw new Error('Authentication requires Supabase configuration.');
  }
  
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  if (!supabase) {
    return null; // No authentication in local mode
  }
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getCurrentSession() {
  if (!supabase) {
    return null; // No sessions in local mode
  }
  
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// Check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return config !== null;
}

// Check if using local PGlite database
export function isUsingLocalDatabase(): boolean {
  return config === null;
}

// Get current configuration
export function getSupabaseConfigInfo() {
  if (config) {
    return {
      url: config.url,
      projectId: config.projectId,
      configured: true,
      mode: 'remote'
    };
  } else {
    return {
      configured: false,
      mode: 'local',
      database: 'PGlite'
    };
  }
}

// Local database operations for PGlite
export async function insertUserSettings(userId: string, settings: any) {
  const db = await getDatabase();
  
  if (db.type === 'supabase') {
    const { error } = await db.client
      .from('user_settings')
      .insert({
        user_id: userId,
        settings,
        created_at: new Date().toISOString()
      });
    if (error) throw error;
  } else {
    await (db.client as PGlite).query(
      'INSERT INTO user_settings (user_id, settings, created_at) VALUES ($1, $2, $3)',
      [userId, JSON.stringify(settings), new Date().toISOString()]
    );
  }
}

export async function getUserSettings(userId: string) {
  const db = await getDatabase();
  
  if (db.type === 'supabase') {
    const { data, error } = await db.client
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  } else {
    const result = await (db.client as PGlite).query(
      'SELECT * FROM user_settings WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    return result.rows[0] || null;
  }
}