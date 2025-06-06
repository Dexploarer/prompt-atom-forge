'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { CommandTerminal } from './CommandTerminal';
import { CultHero } from './CultHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Github, Terminal, Skull, Crown, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CLIAuthProps {
  mode?: 'login' | 'register' | 'both';
  onSuccess?: (user: any) => void;
  onClose?: () => void;
  cliMode?: boolean;
}

const cultPhrases = [
  'The Terminal Awakens...',
  'Join the Digital Covenant',
  'Embrace the Command Line',
  'Your Destiny Awaits in Code',
  'The Cult of Prompts Calls',
  'Ascend Through Authentication',
  'The Sacred CLI Beckons'
];

export function CLIAuth({ mode = 'both', onSuccess, onClose, cliMode = false }: CLIAuthProps) {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(mode === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [terminalMode, setTerminalMode] = useState(cliMode);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % cultPhrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user && onSuccess) {
      onSuccess(user);
    }
  }, [user, onSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      setSuccess('🔮 Authentication successful! Welcome to the cult...');
      
      // Notify CLI of successful authentication
      if (cliMode && window.opener) {
        window.opener.postMessage({
          type: 'AUTH_SUCCESS',
          user: data.user,
          session: data.session
        }, '*');
      }
      
      setTimeout(() => {
        if (onSuccess) onSuccess(data.user);
      }, 1500);
      
    } catch (error: any) {
      setError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            handle: handle || email.split('@')[0],
          }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Insert user data
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            handle: handle || email.split('@')[0],
            created_at: new Date().toISOString(),
          });
        
        if (insertError) {
          console.error('Error inserting user data:', insertError);
        }
      }
      
      setSuccess('🔮 Welcome to the cult! Check your email to verify your account.');
      
      // Notify CLI of successful registration
      if (cliMode && window.opener) {
        window.opener.postMessage({
          type: 'AUTH_SUCCESS',
          user: data.user,
          session: data.session
        }, '*');
      }
      
      setTimeout(() => {
        if (onSuccess) onSuccess(data.user);
      }, 1500);
      
    } catch (error: any) {
      setError(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubAuth = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      setError(error.message || 'GitHub authentication failed');
      setIsLoading(false);
    }
  };

  const terminalCommands = {
    login: () => setActiveTab('login'),
    register: () => setActiveTab('register'),
    github: handleGitHubAuth,
    toggle: () => setTerminalMode(!terminalMode),
    close: onClose || (() => window.close()),
    help: () => {
      return [
        'Available commands:',
        '  login     - Switch to login form',
        '  register  - Switch to registration form', 
        '  github    - Authenticate with GitHub',
        '  toggle    - Switch between terminal and GUI mode',
        '  close     - Close authentication window',
        '  clear     - Clear terminal',
        '  help      - Show this help'
      ];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-red-500"
        >
          <Skull className="w-12 h-12" />
        </motion.div>
      </div>
    );
  }

  if (terminalMode) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <motion.div
              key={currentPhrase}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-2xl font-bold text-red-500 mb-4"
            >
              {cultPhrases[currentPhrase]}
            </motion.div>
            <div className="flex items-center justify-center gap-2 text-green-400">
              <Terminal className="w-6 h-6" />
              <span>CLI Authentication Portal</span>
              <Terminal className="w-6 h-6" />
            </div>
          </div>
          
          <CommandTerminal 
            commands={terminalCommands}
            initialMessage="Welcome to the Cult Authentication Terminal. Type 'help' for commands."
            prompt="cult@auth:~$"
          />
          
          <div className="mt-8 text-center">
            <Button
              onClick={() => setTerminalMode(false)}
              variant="outline"
              className="border-green-400 text-green-400 hover:bg-green-400 hover:text-black"
            >
              <Crown className="w-4 h-4 mr-2" />
              Switch to GUI Mode
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <CultHero />
            <motion.div
              key={currentPhrase}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-xl font-bold text-red-400 mt-4"
            >
              {cultPhrases[currentPhrase]}
            </motion.div>
          </div>

          <Card className="bg-black/80 border-red-500 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-red-400 flex items-center justify-center gap-2">
                <Skull className="w-6 h-6" />
                Join the Cult
                <Skull className="w-6 h-6" />
              </CardTitle>
              <CardDescription className="text-gray-400">
                {cliMode ? 'CLI Authentication Portal' : 'Authenticate to access the sacred prompts'}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {mode === 'both' ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-red-950">
                    <TabsTrigger value="login" className="data-[state=active]:bg-red-500">Login</TabsTrigger>
                    <TabsTrigger value="register" className="data-[state=active]:bg-red-500">Register</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <Input
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="bg-black/50 border-red-500 text-white placeholder-gray-400"
                        />
                      </div>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="bg-black/50 border-red-500 text-white placeholder-gray-400 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isLoading ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                            <Zap className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          'Enter the Cult'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <Input
                          type="text"
                          placeholder="Handle (optional)"
                          value={handle}
                          onChange={(e) => setHandle(e.target.value)}
                          className="bg-black/50 border-red-500 text-white placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <Input
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="bg-black/50 border-red-500 text-white placeholder-gray-400"
                        />
                      </div>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="bg-black/50 border-red-500 text-white placeholder-gray-400 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isLoading ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                            <Zap className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          'Join the Cult'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              ) : (
                <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                  {mode === 'register' && (
                    <div>
                      <Input
                        type="text"
                        placeholder="Handle (optional)"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        className="bg-black/50 border-red-500 text-white placeholder-gray-400"
                      />
                    </div>
                  )}
                  <div>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-black/50 border-red-500 text-white placeholder-gray-400"
                    />
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-black/50 border-red-500 text-white placeholder-gray-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isLoading ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                        <Zap className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      mode === 'login' ? 'Enter the Cult' : 'Join the Cult'
                    )}
                  </Button>
                </form>
              )}
              
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-red-500" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black px-2 text-gray-400">Or continue with</span>
                  </div>
                </div>
                
                <Button
                  onClick={handleGitHubAuth}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full mt-4 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                >
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
              </div>
              
              <div className="mt-6 flex justify-between items-center">
                <Button
                  onClick={() => setTerminalMode(true)}
                  variant="ghost"
                  size="sm"
                  className="text-green-400 hover:text-green-300"
                >
                  <Terminal className="w-4 h-4 mr-2" />
                  Terminal Mode
                </Button>
                
                {onClose && (
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    Close
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-4"
              >
                <Alert className="border-red-500 bg-red-950/50">
                  <AlertDescription className="text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
            
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-4"
              >
                <Alert className="border-green-500 bg-green-950/50">
                  <AlertDescription className="text-green-400">
                    {success}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}