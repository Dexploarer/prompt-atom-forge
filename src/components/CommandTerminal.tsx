import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { signOut, signIn, signUp, supabase } from '@/lib/supabase';

interface CommandTerminalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TokenData {
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
}

// History of price data for the chart
interface PriceHistory {
  price: number;
  time: string; // formatted time
}

const CommandTerminal: React.FC<CommandTerminalProps> = ({ 
  isOpen, 
  onOpenChange 
}) => {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [outputLines, setOutputLines] = useState<Array<{ text: string; isCommand?: boolean; isError?: boolean; isSuccess?: boolean; isWarning?: boolean; isPrompt?: boolean }>>([
    { text: "PROMPT OR DIE TERMINAL v1.0.0", isPrompt: true },
    { text: "THE CIRCLE WELCOMES YOU. AUTHENTICATE OR PERISH.", isPrompt: true },
    { text: "" },
    { text: "Available commands:", isWarning: true },
    { text: "  login <email> <password> - Access your account", isWarning: true },
    { text: "  register <handle> <email> <password> - Join the circle", isWarning: true },
    { text: "  help - View all available commands", isWarning: true },
    { text: "" }
  ]);
  
  // Token data state
  const [tokenData, setTokenData] = useState<TokenData>({
    price: 2.47,
    marketCap: 24500000,
    volume24h: 1230000,
    change24h: 5.8
  });
  
  // Price history for the chart
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const maxHistoryPoints = 30; // Maximum number of points to display on the chart
  
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);

  // Authentication state for the current session
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authHandle, setAuthHandle] = useState('');
  const [authStep, setAuthStep] = useState<'none' | 'email' | 'password' | 'handle'>('none');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Initialize the price history
  useEffect(() => {
    if (!isOpen) return;
    
    // Create initial price history
    const now = new Date();
    const initialHistory: PriceHistory[] = [];
    
    for (let i = maxHistoryPoints - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * 7 * 60 * 1000)); // 7 minute intervals
      const basePrice = 2.47;
      // Create some variation to make the chart look more realistic
      const randomVariation = (Math.random() - 0.5) * 0.4; 
      const historicalPrice = +(basePrice + randomVariation).toFixed(2);
      
      initialHistory.push({
        price: historicalPrice,
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      });
    }
    
    setPriceHistory(initialHistory);
  }, [isOpen]);
  
  // Draw the chart whenever price history changes
  useEffect(() => {
    if (!chartCanvasRef.current || priceHistory.length === 0) return;
    
    const drawChart = () => {
      const canvas = chartCanvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Get min and max prices for scaling
      const prices = priceHistory.map(p => p.price);
      let minPrice = Math.min(...prices) * 0.995; // Add 0.5% padding
      let maxPrice = Math.max(...prices) * 1.005;
      
      // Ensure there's always some range even if price is flat
      if (maxPrice - minPrice < 0.1) {
        minPrice = minPrice - 0.05;
        maxPrice = maxPrice + 0.05;
      }
      
      const range = maxPrice - minPrice;
      const barWidth = canvas.width / priceHistory.length * 0.8; // 80% of the available width
      const barSpacing = canvas.width / priceHistory.length * 0.2; // 20% spacing
      
      // Draw the bar chart
      priceHistory.forEach((point, i) => {
        const positiveChange = i > 0 ? point.price >= priceHistory[i-1].price : tokenData.change24h >= 0;
        const barColor = positiveChange ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
        
        // Calculate bar position and height
        const x = i * (barWidth + barSpacing);
        const barHeight = ((point.price - minPrice) / range) * canvas.height;
        const y = canvas.height - barHeight;
        
        // Draw the bar
        ctx.fillStyle = barColor;
        ctx.fillRect(x, y, barWidth, barHeight);
      });
    };
    
    drawChart();
  }, [priceHistory, tokenData.change24h]);
  
  // Simulate token data updates and update the price history
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      // Simulate live price movements by randomly adjusting values
      const priceChange = (Math.random() - 0.5) * 0.1; // Small random change
      const volumeChange = Math.random() * 50000;
      const newChange = tokenData.change24h + (Math.random() - 0.5) * 0.5;
      
      const newPrice = Math.max(0.01, +(tokenData.price + priceChange).toFixed(2));
      
      setTokenData({
        price: newPrice,
        marketCap: Math.max(1000000, Math.floor(tokenData.marketCap + volumeChange * 10)),
        volume24h: Math.max(100000, Math.floor(tokenData.volume24h + volumeChange)),
        change24h: +newChange.toFixed(1)
      });
      
      // Add the new price to the history
      setPriceHistory(prev => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        // Add the new price and remove the oldest if we exceed maxHistoryPoints
        const updated = [...prev, { price: newPrice, time: timeStr }];
        if (updated.length > maxHistoryPoints) {
          return updated.slice(1);
        }
        return updated;
      });
    }, 7000); // Update every 7 seconds
    
    return () => clearInterval(interval);
  }, [isOpen, tokenData]);
  
  useEffect(() => {
    // Auto-focus the input when the dialog opens
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);
  
  useEffect(() => {
    // Scroll to bottom when output changes
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [outputLines]);
  
  // Process commands
  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    
    // If we're in the middle of an auth flow, handle that differently
    if (authStep !== 'none') {
      handleAuthStep(cmd);
      return;
    }
    
    const fullCommand = `${cmd}`;
    setOutputLines(prev => [...prev, { text: fullCommand, isCommand: true }]);
    
    // Add to command history
    setCommandHistory(prev => [cmd, ...prev].slice(0, 50));
    setHistoryIndex(-1);
    
    // Parse command and arguments
    const args = cmd.trim().split(' ');
    const command = args[0].toLowerCase();
    
    // Process command
    switch (command) {
      case 'help':
        showHelp();
        break;
      case 'clear':
        clearTerminal();
        break;
      case 'goto':
      case 'cd':
        navigateTo(args[1]);
        break;
      case 'login':
        if (args.length === 3) {
          // Direct login with command: login email password
          handleDirectLogin(args[1], args[2]);
        } else {
          // Start interactive login
          startAuthFlow('login');
        }
        break;
      case 'register':
        if (args.length === 4) {
          // Direct register with command: register handle email password
          handleDirectRegister(args[1], args[2], args[3]);
        } else {
          // Start interactive registration
          startAuthFlow('register');
        }
        break;
      case 'logout':
        handleLogout();
        break;
      case 'dashboard':
        navigateTo('dashboard');
        break;
      case 'gallery':
        navigateTo('gallery');
        break;
      case 'docs':
        navigateTo('docs');
        break;
      case 'create':
        handleCreateCommand(args.slice(1));
        break;
      case 'list':
        handleListCommand(args.slice(1));
        break;
      case 'generate':
        handleGeneratePrompt();
        break;
      case 'export':
        handleExportPrompt();
        break;
      case 'whoami':
        showUserInfo();
        break;
      case 'status':
        showSystemStatus();
        break;
      case 'token':
        showTokenInfo();
        break;
      case 'exit':
        onOpenChange(false);
        break;
      default:
        setOutputLines(prev => [...prev, { 
          text: `Command not found: ${command}. Type 'help' to see available commands.`, 
          isError: true 
        }]);
    }
    
    // Reset input
    setInput('');
  };

  // Show token info as a command
  const showTokenInfo = () => {
    setOutputLines(prev => [
      ...prev, 
      { text: "=== $POD TOKEN INFO ===", isPrompt: true },
      { text: `Price: $${tokenData.price.toFixed(2)} USD` },
      { text: `Market Cap: $${(tokenData.marketCap / 1000000).toFixed(2)}M USD` },
      { text: `24h Volume: $${(tokenData.volume24h / 1000000).toFixed(2)}M USD` },
      { text: `24h Change: ${tokenData.change24h > 0 ? '+' : ''}${tokenData.change24h.toFixed(1)}%`, 
        isSuccess: tokenData.change24h > 0, 
        isError: tokenData.change24h < 0 
      },
      { text: `Chain: Solana` },
      { text: `Contract: sokp...7j29` },
      { text: "" },
      { text: "Type 'help' to see more commands.", isWarning: true },
    ]);
  };

  // Start an interactive auth flow
  const startAuthFlow = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthEmail('');
    setAuthPassword('');
    setAuthHandle('');
    
    if (mode === 'login') {
      setOutputLines(prev => [...prev, { 
        text: "INITIATE LOGIN SEQUENCE",
        isPrompt: true
      }, {
        text: "Enter your email:",
        isWarning: true
      }]);
    } else {
      setOutputLines(prev => [...prev, { 
        text: "INITIATE REGISTRATION SEQUENCE",
        isPrompt: true
      }, {
        text: "Enter your desired handle:",
        isWarning: true
      }]);
    }
    
    setAuthStep(mode === 'login' ? 'email' : 'handle');
  };

  // Handle auth flow steps
  const handleAuthStep = (input: string) => {
    setOutputLines(prev => [...prev, { text: input, isCommand: true }]);
    
    switch (authStep) {
      case 'handle':
        setAuthHandle(input.trim());
        setOutputLines(prev => [...prev, { text: "Enter your email:", isWarning: true }]);
        setAuthStep('email');
        break;
        
      case 'email':
        // Simple email validation
        if (!input.includes('@') || !input.includes('.')) {
          setOutputLines(prev => [...prev, { text: "Invalid email format. Please enter a valid email:", isError: true }]);
          return;
        }
        
        setAuthEmail(input.trim());
        setOutputLines(prev => [...prev, { text: "Enter your password:", isWarning: true }]);
        setAuthStep('password');
        break;
        
      case 'password':
        setAuthPassword(input.trim());
        
        if (input.length < 6) {
          setOutputLines(prev => [...prev, { text: "Password must be at least 6 characters. Try again:", isError: true }]);
          return;
        }
        
        // Complete the auth flow
        if (authMode === 'login') {
          completeLogin(authEmail, input.trim());
        } else {
          completeRegistration(authHandle, authEmail, input.trim());
        }
        
        // Reset auth step
        setAuthStep('none');
        break;
    }
    
    // Reset input after processing
    setInput('');
  };
  
  // Handle direct login via command
  const handleDirectLogin = async (email: string, password: string) => {
    try {
      setOutputLines(prev => [...prev, { 
        text: "Authenticating...", 
        isWarning: true 
      }]);
      
      await signIn(email, password);
      
      setOutputLines(prev => [...prev, { 
        text: "LOGIN SUCCESSFUL", 
        isSuccess: true 
      }, {
        text: `Welcome back, ${email.split('@')[0]}.`,
        isPrompt: true
      }]);
      
      toast({
        title: "Logged in successfully!",
        description: "Welcome back to Prompt or Die"
      });
      
      // Navigate to dashboard after a delay
      setTimeout(() => {
        navigate('/dashboard');
        onOpenChange(false);
      }, 1500);
      
    } catch (error: any) {
      setOutputLines(prev => [...prev, { 
        text: `AUTHENTICATION FAILURE: ${error.message || "Invalid credentials"}`, 
        isError: true 
      }]);
    }
  };
  
  // Complete the interactive login
  const completeLogin = async (email: string, password: string) => {
    try {
      setOutputLines(prev => [...prev, { 
        text: "Authenticating...", 
        isWarning: true 
      }]);
      
      await signIn(email, password);
      
      setOutputLines(prev => [...prev, { 
        text: "LOGIN SUCCESSFUL", 
        isSuccess: true 
      }, {
        text: `Welcome back, ${email.split('@')[0]}.`,
        isPrompt: true
      }]);
      
      toast({
        title: "Logged in successfully!",
        description: "Welcome back to Prompt or Die"
      });
      
      // Navigate to dashboard after a delay
      setTimeout(() => {
        navigate('/dashboard');
        onOpenChange(false);
      }, 1500);
      
    } catch (error: any) {
      setOutputLines(prev => [...prev, { 
        text: `AUTHENTICATION FAILURE: ${error.message || "Invalid credentials"}`, 
        isError: true 
      }]);
      
      // Reset auth step to start over
      setAuthStep('none');
    }
  };
  
  // Handle direct registration via command
  const handleDirectRegister = async (handle: string, email: string, password: string) => {
    try {
      setOutputLines(prev => [...prev, { 
        text: "Initiating registration...", 
        isWarning: true 
      }]);
      
      await signUp(email, password, handle);
      
      setOutputLines(prev => [...prev, { 
        text: "REGISTRATION SUCCESSFUL", 
        isSuccess: true 
      }, {
        text: "Welcome to the Order. You may now authenticate with your credentials.",
        isPrompt: true
      }]);
      
      toast({
        title: "Account created!",
        description: "Welcome to Prompt or Die"
      });
      
    } catch (error: any) {
      setOutputLines(prev => [...prev, { 
        text: `REGISTRATION FAILURE: ${error.message || "Registration failed"}`, 
        isError: true 
      }]);
    }
  };
  
  // Complete the interactive registration
  const completeRegistration = async (handle: string, email: string, password: string) => {
    try {
      setOutputLines(prev => [...prev, { 
        text: "Initiating registration...", 
        isWarning: true 
      }]);
      
      await signUp(email, password, handle);
      
      setOutputLines(prev => [...prev, { 
        text: "REGISTRATION SUCCESSFUL", 
        isSuccess: true 
      }, {
        text: "Welcome to the Order. You may now authenticate with your credentials.",
        isPrompt: true
      }, {
        text: "Type 'login' to proceed.",
        isWarning: true
      }]);
      
      toast({
        title: "Account created!",
        description: "Welcome to Prompt or Die"
      });
      
    } catch (error: any) {
      setOutputLines(prev => [...prev, { 
        text: `REGISTRATION FAILURE: ${error.message || "Registration failed"}`, 
        isError: true 
      }]);
      
      // Reset auth step to start over
      setAuthStep('none');
    }
  };
  
  const clearTerminal = () => {
    setOutputLines([
      { text: "PROMPT OR DIE TERMINAL v1.0.0", isPrompt: true },
      { text: "Terminal cleared.", isSuccess: true },
      { text: "" }
    ]);
  };
  
  const navigateTo = (path: string = '') => {
    if (!path) {
      setOutputLines(prev => [...prev, {
        text: "Error: No destination specified. Usage: goto <page>",
        isError: true
      }]);
      return;
    }

    // Close terminal
    onOpenChange(false);

    // Handle navigation
    const sanitized = path.replace(/[^a-zA-Z0-9-_/]/g, '');
    setOutputLines(prev => [...prev, { text: `Navigating to ${sanitized}...`, isSuccess: true }]);

    // Use setTimeout to ensure the navigation message is seen before redirecting
    setTimeout(() => {
      try {
        navigate(`/${sanitized.replace(/^\//, '')}`);
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }, 500);
  };
  
  const handleLogout = async () => {
    if (!isAuthenticated) {
      setOutputLines(prev => [...prev, { 
        text: "ERROR: AUTHENTICATION REQUIRED",
        isError: true 
      }]);
      return;
    }
    
    setOutputLines(prev => [...prev, { text: "Logging out...", isWarning: true }]);
    
    try {
      await signOut();
      setOutputLines(prev => [...prev, { 
        text: "LOGOUT SUCCESSFUL", 
        isSuccess: true 
      }]);
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account"
      });
      
      // Navigate to home page
      setTimeout(() => {
        navigate('/');
        onOpenChange(false);
      }, 500);
      
    } catch (error: any) {
      setOutputLines(prev => [...prev, { 
        text: `ERROR: ${error.message || "Failed to log out"}`,
        isError: true 
      }]);
    }
  };
  
  const showUserInfo = () => {
    if (!isAuthenticated) {
      setOutputLines(prev => [...prev, { 
        text: "AUTHENTICATION REQUIRED",
        isError: true 
      }, {
        text: "Use 'login <email> <password>' or 'register <handle> <email> <password>' to authenticate.",
        isWarning: true
      }]);
      return;
    }
    
    setOutputLines(prev => [
      ...prev, 
      { text: "=== USER IDENTITY ===", isPrompt: true },
      { text: `Email: ${user?.email}` },
      { text: `User ID: ${user?.id}` },
      { text: `Auth Provider: ${user?.app_metadata?.provider || 'email'}` },
      { text: `Created: ${new Date(user?.created_at || '').toLocaleString()}` },
      { text: "" }
    ]);
  };
  
  const showSystemStatus = () => {
    const date = new Date();
    const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    
    setOutputLines(prev => [
      ...prev, 
      { text: "=== SYSTEM STATUS ===", isPrompt: true },
      { text: `Date: ${formattedDate}` },
      { text: `Time: ${date.toLocaleTimeString()}` },
      { text: `Authentication: ${isAuthenticated ? 'ACTIVE' : 'INACTIVE'}` },
      { text: `Server Status: ONLINE` },
      { text: `Prompt Engine: OPERATIONAL` },
      { text: `API Version: 1.0.3` },
      { text: `Token Price: $${tokenData.price.toFixed(2)} (${tokenData.change24h >= 0 ? '+' : ''}${tokenData.change24h.toFixed(1)}%)` },
      { text: "" }
    ]);
  };
  
  const handleCreateCommand = (args: string[]) => {
    if (!isAuthenticated) {
      setOutputLines(prev => [...prev, { 
        text: "AUTHENTICATION REQUIRED",
        isError: true 
      }, {
        text: "Use 'login <email> <password>' to authenticate.",
        isWarning: true
      }]);
      return;
    }
    
    if (args.length === 0) {
      setOutputLines(prev => [...prev, { 
        text: "Error: Missing resource type. Usage: create <resource>",
        isError: true 
      }, {
        text: "Available resources: project, template, block",
        isWarning: true
      }]);
      return;
    }
    
    const resourceType = args[0].toLowerCase();
    
    switch (resourceType) {
      case 'project':
        setOutputLines(prev => [
          ...prev, 
          { text: "Creating new project...", isWarning: true },
          { text: "Project created successfully. Redirecting to editor...", isSuccess: true }
        ]);
        
        // Close terminal and navigate to dashboard
        setTimeout(() => {
          onOpenChange(false);
          navigate('/projects/new');
          
          toast({
            title: "Project Created",
            description: "Your new project has been created"
          });
        }, 1000);
        break;
        
      case 'template':
        setOutputLines(prev => [
          ...prev, 
          { text: "Creating new template...", isWarning: true },
          { text: "Template creation not yet implemented in CLI.", isWarning: true }
        ]);
        break;
        
      case 'block':
        setOutputLines(prev => [
          ...prev, 
          { text: "Block creation requires an active project.", isWarning: true },
          { text: "Please navigate to a project first with: goto projects/new", isWarning: true }
        ]);
        break;
        
      default:
        setOutputLines(prev => [...prev, { 
          text: `Error: Unknown resource type '${resourceType}'.`,
          isError: true 
        }, {
          text: "Available resources: project, template, block",
          isWarning: true
        }]);
    }
  };
  
  const handleListCommand = (args: string[]) => {
    if (!isAuthenticated && args[0] !== 'commands') {
      setOutputLines(prev => [...prev, { 
        text: "AUTHENTICATION REQUIRED",
        isError: true 
      }, {
        text: "Use 'login <email> <password>' to authenticate.",
        isWarning: true
      }]);
      return;
    }
    
    if (args.length === 0) {
      setOutputLines(prev => [...prev, { 
        text: "Error: Missing resource type. Usage: list <resource>",
        isError: true 
      }, {
        text: "Available resources: projects, commands, templates",
        isWarning: true
      }]);
      return;
    }
    
    const resourceType = args[0].toLowerCase();
    
    switch (resourceType) {
      case 'projects':
        if (!isAuthenticated) {
          setOutputLines(prev => [...prev, { 
            text: "Error: You must be logged in to list projects.",
            isError: true 
          }]);
          return;
        }
        
        setOutputLines(prev => [
          ...prev, 
          { text: "=== YOUR PROJECTS ===", isPrompt: true },
          { text: "Fetching projects..." },
          { text: "1. My First Project" },
          { text: "2. Code Review Template" },
          { text: "3. Marketing Prompts" },
          { text: "" }
        ]);
        break;
        
      case 'commands':
        showHelp();
        break;
        
      case 'templates':
        setOutputLines(prev => [
          ...prev, 
          { text: "=== AVAILABLE TEMPLATES ===", isPrompt: true },
          { text: "1. Content Summarizer" },
          { text: "2. Code Reviewer" },
          { text: "3. Creative Writer" },
          { text: "4. Data Analyst" },
          { text: "5. Email Marketing" },
          { text: "6. Technical Documentation" },
          { text: "" }
        ]);
        break;
        
      default:
        setOutputLines(prev => [...prev, { 
          text: `Error: Unknown resource type '${resourceType}'.`,
          isError: true 
        }, {
          text: "Available resources: projects, commands, templates",
          isWarning: true
        }]);
    }
  };
  
  const handleGeneratePrompt = () => {
    setOutputLines(prev => [
      ...prev, 
      { text: "Generating prompt...", isWarning: true },
      { text: "Generated prompt:", isPrompt: true },
      { text: "------------------------" },
      { text: "## INTENT: Summarize Content" },
      { text: "Provide a concise summary of the given content, highlighting key points and main ideas." },
      { text: "" },
      { text: "## TONE: Professional" },
      { text: "Use clear, professional language suitable for business communications." },
      { text: "" },
      { text: "## FORMAT: Bullet Points" },
      { text: "Format the output as organized bullet points with clear hierarchy." },
      { text: "------------------------" },
      { text: "Prompt generated successfully.", isSuccess: true },
      { text: "" }
    ]);
  };
  
  const handleExportPrompt = () => {
    setOutputLines(prev => [
      ...prev, 
      { text: "Exporting prompt...", isWarning: true },
      { text: "Prompt copied to clipboard.", isSuccess: true },
      { text: "" }
    ]);
    
    toast({
      title: "Prompt Exported",
      description: "The prompt has been copied to your clipboard"
    });
  };
  
  const showHelp = () => {
    setOutputLines(prev => [
      ...prev, 
      { text: "=== AVAILABLE COMMANDS ===", isPrompt: true },
      { text: "" },
      { text: "Authentication:" },
      { text: "  login <email> <password>  - Sign in with credentials" },
      { text: "  register <handle> <email> <password> - Create a new account" },
      { text: "  logout                    - Sign out current user" },
      { text: "  whoami                    - Show current user info" },
      { text: "" },
      { text: "Navigation:" },
      { text: "  goto <page>               - Navigate to a specific page" },
      { text: "  cd <page>                 - Alias for goto" },
      { text: "" },
      { text: "Pages:" },
      { text: "  dashboard                 - Go to user dashboard" },
      { text: "  gallery                   - Go to template gallery" },
      { text: "  docs                      - Go to documentation" },
      { text: "" },
      { text: "Resources:" },
      { text: "  create <resource>         - Create a new resource (project, template, block)" },
      { text: "  list <resource>           - List resources (projects, templates, commands)" },
      { text: "" },
      { text: "Prompts:" },
      { text: "  generate                  - Generate prompt from blocks" },
      { text: "  export                    - Export current prompt" },
      { text: "" },
      { text: "System:" },
      { text: "  status                    - Show system status" },
      { text: "  token                     - Show $POD token info" },
      { text: "  help                      - Show this help message" },
      { text: "  clear                     - Clear terminal output" },
      { text: "  exit                      - Close terminal" },
      { text: "" }
    ]);
  };
  
  // Handle key navigation through history
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateHistory('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateHistory('down');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      autocompleteCommand();
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      handleCtrlC();
    }
  };
  
  const navigateHistory = (direction: 'up' | 'down') => {
    if (commandHistory.length === 0) return;
    
    let newIndex = historyIndex;
    
    if (direction === 'up') {
      newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
    } else {
      newIndex = historyIndex > 0 ? historyIndex - 1 : -1;
    }
    
    setHistoryIndex(newIndex);
    
    if (newIndex >= 0 && newIndex < commandHistory.length) {
      setInput(commandHistory[newIndex]);
    } else if (newIndex === -1) {
      setInput('');
    }
  };
  
  const handleCtrlC = () => {
    // If in auth flow, cancel it
    if (authStep !== 'none') {
      setAuthStep('none');
      setOutputLines(prev => [
        ...prev, 
        { text: "^C", isCommand: true },
        { text: "Authentication sequence aborted.", isError: true },
        { text: "" }
      ]);
    } else {
      setOutputLines(prev => [...prev, { text: "^C", isCommand: true }]);
    }
    setInput('');
  };
  
  // Simple autocomplete functionality
  const autocompleteCommand = () => {
    if (!input) return;
    
    const commands = [
      'help', 'clear', 'goto', 'cd', 'login', 'logout', 'register',
      'dashboard', 'gallery', 'docs', 'create', 'list', 'generate',
      'export', 'whoami', 'exit', 'status', 'token'
    ];
    
    const matches = commands.filter(cmd => cmd.startsWith(input));
    
    if (matches.length === 1) {
      setInput(matches[0]);
    } else if (matches.length > 1) {
      setOutputLines(prev => [
        ...prev, 
        { text: `Autocomplete suggestions: ${matches.join(', ')}` }
      ]);
    }
  };
  
  // Format numbers with commas for thousands
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Custom styling for terminal-like appearance
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-[800px] h-[500px] p-0 bg-black border-[#8B0000]/30 shadow-[0_0_30px_rgba(139,0,0,0.25)] rounded-lg"
        onInteractOutside={(e) => e.preventDefault()} // Prevent closing on outside click
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Prompt or Die Terminal</DialogTitle>
        </DialogHeader>
        <div 
          className="terminal-window flex flex-col h-full w-full rounded-lg bg-black overflow-hidden font-mono relative"
        >
          {/* Price chart background */}
          <div className="absolute inset-0 z-0">
            <canvas 
              ref={chartCanvasRef}
              width="800" 
              height="500"
              className="w-full h-full"
            />
          </div>
          
          {/* Terminal header with token info */}
          <div className="terminal-header flex items-center justify-between p-2 bg-gradient-to-r from-black to-[#8B0000]/20 border-b border-[#8B0000]/30 relative z-10">
            <div className="flex items-center gap-2">
              <div className="flex space-x-2">
                <div 
                  className="h-3 w-3 rounded-full bg-red-500/70 cursor-pointer hover:bg-red-500"
                  onClick={() => onOpenChange(false)}
                ></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500/70"></div>
                <div className="h-3 w-3 rounded-full bg-green-500/70"></div>
              </div>
              <span className="text-xs text-[#8B0000]/70 ml-2">prompt-terminal</span>
            </div>
            
            {/* Token info display */}
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <span className="text-xs text-[#8B0000] font-bold">$POD:</span>
                <span className="text-xs ml-1">${tokenData.price.toFixed(2)}</span>
                <span className={`text-xs ml-1 ${tokenData.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {tokenData.change24h >= 0 ? '+' : ''}{tokenData.change24h}%
                </span>
              </div>
              <div className="text-xs">
                <span className="text-[#8B0000]/70">MCap:</span>
                <span className="ml-1">${(tokenData.marketCap / 1000000).toFixed(2)}M</span>
              </div>
              <div className="text-xs text-[#8B0000]/70">v1.0.0</div>
            </div>
          </div>
          
          {/* Terminal output area */}
          <div 
            ref={terminalRef}
            className="terminal-output flex-1 p-4 overflow-auto bg-black/75 text-white text-sm leading-relaxed scrollbar-thin scrollbar-thumb-[#8B0000]/20 scrollbar-track-transparent relative z-10"
          >
            {outputLines.map((line, index) => (
              <div key={index} className="terminal-line">
                {line.isCommand ? (
                  <div className="flex">
                    <span className="text-[#8B0000] mr-2">❯</span>
                    <span className={line.isError ? "text-red-400" : "text-white"}>{line.text}</span>
                  </div>
                ) : (
                  <div className={`ml-4 
                    ${line.isError ? "text-red-400" : ""} 
                    ${line.isSuccess ? "text-green-400" : ""}
                    ${line.isWarning ? "text-yellow-400" : ""}
                    ${line.isPrompt ? "text-[#8B0000] font-bold" : "text-white/90"}`}
                  >
                    {line.text}
                  </div>
                )}
              </div>
            ))}
            
            {/* Current input line */}
            <div className="terminal-input flex mt-2">
              <span className="text-[#8B0000] mr-2">❯</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm"
                autoFocus
                autoComplete="off"
                spellCheck="false"
                // Only hide input when in password step
                style={{ 
                  WebkitTextSecurity: authStep === 'password' ? 'disc' : 'none' 
                }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommandTerminal;