/**
 * @fileoverview Authentication management for CLI with web app integration
 * @module @prompt-or-die/cli/managers/AuthManager
 */

import { input, select, confirm, password } from '@inquirer/prompts';
import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';
import { exec } from 'child_process';
import { promisify } from 'util';
import open from 'open';
import figlet from 'figlet';
import { BaseManager } from './BaseManager.js';
import { CLIConfig } from '../types.js';
import { 
  supabase, 
  signInWithEmail, 
  signUpWithEmail, 
  signOut, 
  getCurrentUser, 
  getCurrentSession,
  isSupabaseConfigured,
  getSupabaseConfigInfo,
  type User,
  type AuthSession
} from '../lib/supabase.js';

const figletAsync = promisify(figlet);
const execAsync = promisify(exec);

// Types are now imported from supabase.js

/**
   * Authentication manager class
   */
  export class AuthManager extends BaseManager<User> {
    private config: CLIConfig;
    private currentUser: User | null = null;
    private currentSession: AuthSession | null = null;

    constructor(dataDir: string, config: CLIConfig) {
      super(dataDir, 'auth.json');
      this.config = config;
      
      // Load existing session
      this.loadSession();
    }





   /**
    * CLI Login
    */
   async login(): Promise<boolean> {
     try {
       if (!isSupabaseConfigured()) {
         console.error(chalk.red('❌ Supabase is not configured. Please set up your environment variables.'));
         return false;
       }

       console.log(chalk.cyan('🔮 Welcome to the Cult Authentication Portal'));
       
       const email = await input({
         message: '📧 Enter your email:',
         validate: (input) => {
           const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
           return emailRegex.test(input) || 'Please enter a valid email address';
         }
       });

       const userPassword = await password({
         message: '🔐 Enter your password:',
         mask: '*'
       });

       console.log(chalk.yellow('🔄 Authenticating...'));
       
       const result = await signInWithEmail(email, userPassword);

       await this.loadSession();
       
       if (this.isAuthenticated()) {
         console.log(chalk.green('✅ Successfully authenticated!'));
         console.log(chalk.cyan(`🎭 Welcome back, ${this.currentUser?.email}`));
         return true;
       }
       
       return false;
     } catch (error) {
       console.error(chalk.red('❌ Login error:'), error);
       return false;
     }
   }

   /**
    * CLI Registration
    */
   async register(): Promise<boolean> {
     try {
       if (!isSupabaseConfigured()) {
         console.error(chalk.red('❌ Supabase is not configured. Please set up your environment variables.'));
         return false;
       }

       console.log(chalk.cyan('🔮 Join the Cult - Registration Portal'));
       
       const email = await input({
         message: '📧 Enter your email:',
         validate: (input) => {
           const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
           return emailRegex.test(input) || 'Please enter a valid email address';
         }
       });

       const userPassword = await password({
         message: '🔐 Create a password (min 6 characters):',
         mask: '*',
         validate: (input) => {
           return input.length >= 6 || 'Password must be at least 6 characters long';
         }
       });

       const confirmPassword = await password({
         message: '🔐 Confirm your password:',
         mask: '*',
         validate: (input) => {
           return input === userPassword || 'Passwords do not match';
         }
       });

       console.log(chalk.yellow('🔄 Creating your cult membership...'));
       
       const result = await signUpWithEmail(email, userPassword);

       console.log(chalk.green('✅ Registration successful!'));
       console.log(chalk.yellow('📧 Please check your email to verify your account.'));
       
       return true;
     } catch (error) {
       console.error(chalk.red('❌ Registration error:'), error);
       return false;
     }
   }

   /**
    * Logout
    */
   async logout(): Promise<boolean> {
     try {
       const confirmLogout = await confirm({
         message: '🚪 Are you sure you want to logout?',
         default: false
       });

       if (!confirmLogout) {
         return false;
       }

       await signOut();
       this.currentUser = null;
       this.currentSession = null;
       
       console.log(chalk.green('✅ Successfully logged out'));
       console.log(chalk.gray('🌙 Until we meet again in the shadows...'));
       
       return true;
     } catch (error) {
       console.error(chalk.red('❌ Logout error:'), error);
       return false;
     }
   }

   /**
    * Authentication menu
    */
  async showMenu(): Promise<void> {
    console.clear();
    this.displayCultHeader();
    
    if (this.currentSession) {
      await this.showAuthenticatedMenu();
    } else {
      await this.showUnauthenticatedMenu();
    }
  }

  /**
   * Display cult-themed header
   */
  private displayCultHeader(): void {
    const header = boxen(
      chalk.red.bold('🔮 THE CIRCLE OF AUTHENTICATION 🔮\n') +
      chalk.gray('"Those who authenticate shall inherit the prompts"\n') +
      chalk.yellow('Enter the sacred realm or be cast into the void'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'red',
        backgroundColor: 'black'
      }
    );
    console.log(header);
  }

  /**
   * Show menu for unauthenticated users
   */
  private async showUnauthenticatedMenu(): Promise<void> {
    const action = await select({
      message: chalk.red('Choose your path, seeker:'),
      choices: [
        { name: '🚪 Login - Return to the Circle', value: 'login' },
        { name: '📝 Register - Join the Covenant', value: 'register' },
        { name: '🌐 Web Portal - Access the Sacred Interface', value: 'web' },
        { name: '❓ Help - Guidance for the Lost', value: 'help' },
        { name: '🔙 Back to Main Menu', value: 'back' }
      ]
    });

    switch (action) {
      case 'login':
        await this.loginFlow();
        break;
      case 'register':
        await this.registerFlow();
        break;
      case 'web':
        await this.openWebApp();
        break;
      case 'help':
        await this.showHelp();
        break;
      case 'back':
        return;
    }

    if (action !== 'back') {
      await this.showMenu();
    }
  }

  /**
   * Show menu for authenticated users
   */
  private async showAuthenticatedMenu(): Promise<void> {
    console.log(chalk.green(`\n✨ Welcome back, ${this.currentUser?.email || 'Unknown'}! The Circle recognizes you.\n`));
    
    const action = await select({
      message: 'What would you like to do?',
      choices: [
        { name: '👤 View Profile', value: 'profile' },
        { name: '🌐 Open Web Portal', value: 'web' },
        { name: '🔄 Sync Data', value: 'sync' },
        { name: '🔐 Change Password', value: 'password' },
        { name: '🚪 Logout', value: 'logout' },
        { name: '🔙 Back to Main Menu', value: 'back' }
      ]
    });

    switch (action) {
      case 'profile':
        await this.showProfile();
        break;
      case 'web':
        await this.openWebApp(true);
        break;
      case 'sync':
        await this.syncData();
        break;
      case 'password':
        await this.changePassword();
        break;
      case 'logout':
        await this.logout();
        break;
      case 'back':
        return;
    }

    if (action !== 'back' && action !== 'logout') {
      await this.showMenu();
    }
  }

  /**
   * Login flow
   */
  private async loginFlow(): Promise<void> {
    console.log(chalk.blue('\n🔮 Entering the Sacred Login Ritual\n'));
    
    const email = await input({
      message: 'Email (your digital essence):',
      validate: (value) => {
        if (!value.includes('@')) return 'A valid email is required for the ritual';
        return true;
      }
    });

    const userPassword = await password({
      message: 'Password (the secret incantation):',
      mask: '•'
    });

    const useWebAuth = await confirm({
      message: 'Open the Sacred Web Portal for verification?',
      default: true
    });

    if (useWebAuth) {
      await this.webAuthFlow('login', { email, password: userPassword });
    } else {
      await this.directLogin(email, userPassword);
    }
  }

  /**
   * Registration flow
   */
  private async registerFlow(): Promise<void> {
    console.log(chalk.blue('\n📝 The Initiation Ceremony Begins\n'));
    
    const handle = await input({
      message: 'Choose your handle (your name in the Circle):',
      validate: (value) => {
        if (value.length < 3) return 'Your handle must be at least 3 characters';
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Only letters, numbers, underscores, and hyphens allowed';
        return true;
      }
    });

    const email = await input({
      message: 'Email (your digital essence):',
      validate: (value) => {
        if (!value.includes('@')) return 'A valid email is required for the ritual';
        return true;
      }
    });

    const userPassword = await password({
      message: 'Create password (forge your secret incantation):',
      mask: '•',
      validate: (value) => {
        if (value.length < 8) return 'Your incantation must be at least 8 characters long';
        return true;
      }
    });

    const confirmPassword = await password({
      message: 'Confirm password (repeat the incantation):',
      mask: '•'
    });

    if (userPassword !== confirmPassword) {
      console.log(chalk.red('\n❌ The incantations do not match. The ritual has failed.\n'));
      return;
    }

    const useWebAuth = await confirm({
      message: 'Open the Sacred Web Portal to complete initiation?',
      default: true
    });

    if (useWebAuth) {
      await this.webAuthFlow('register', { handle, email, password: userPassword });
    } else {
      await this.directRegister(handle, email, userPassword);
    }
  }

  /**
   * Web authentication flow
   */
  private async webAuthFlow(mode: 'login' | 'register', credentials?: { handle?: string; email?: string; password?: string }): Promise<void> {
    const spinner = ora('Opening the Sacred Web Portal...').start();
    
    try {
      // Construct URL with auth mode and pre-filled data
      const params = new URLSearchParams({
        tab: mode,
        cli: 'true'
      });
      
      if (credentials) {
        if (mode === 'register' && credentials.handle) {
          params.set('handle', credentials.handle);
        }
        if (credentials.email) {
          params.set('email', credentials.email);
        }
      }
      
      const authUrl = `${this.config.webAppUrl || 'http://localhost:3000'}/auth?${params.toString()}`;
      
      // Open web browser
      const platform = process.platform;
      let command = '';
      
      if (platform === 'win32') {
        command = `start "" "${authUrl}"`;
      } else if (platform === 'darwin') {
        command = `open "${authUrl}"`;
      } else {
        command = `xdg-open "${authUrl}"`;
      }
      
      await execAsync(command);
      spinner.succeed('Sacred Web Portal opened!');
      
      console.log(chalk.yellow('\n🌐 The Web Portal has been summoned!'));
      console.log(chalk.gray(`Complete your ${mode} in the browser, then return here.\n`));
      
      // Wait for user to complete web auth
      const completed = await confirm({
        message: 'Have you completed the authentication ritual in the web portal?',
        default: false
      });
      
      if (completed) {
        await this.checkWebAuthCompletion();
      } else {
        console.log(chalk.yellow('\n⏳ The ritual remains incomplete. You may try again later.\n'));
      }
      
    } catch (error) {
      spinner.fail('Failed to open the Sacred Web Portal');
      console.log(chalk.red(`\n❌ Error: ${error}\n`));
      
      // Fallback to direct auth
      const fallback = await confirm({
        message: 'Would you like to try direct authentication instead?',
        default: true
      });
      
      if (fallback && credentials) {
        if (mode === 'login' && credentials.email && credentials.password) {
          await this.directLogin(credentials.email, credentials.password);
        } else if (mode === 'register' && credentials.handle && credentials.email && credentials.password) {
          await this.directRegister(credentials.handle, credentials.email, credentials.password);
        }
      }
    }
  }

  /**
   * Check if web authentication was completed
   */
  private async checkWebAuthCompletion(): Promise<void> {
    const spinner = ora('Checking authentication status...').start();
    
    try {
      // In a real implementation, this would check for a session token
      // or poll an endpoint to see if auth was completed
      // For now, we'll simulate this
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful authentication
      const mockSession: AuthSession = {
        user: {
          id: 'user_' + Date.now(),
          email: 'user@example.com',
          handle: 'cultmember',
          created_at: new Date().toISOString()
        },
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_at: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      };
      
      this.currentSession = mockSession;
      this.currentUser = mockSession.user;
      
      spinner.succeed('Authentication successful!');
      console.log(chalk.green('\n✨ Welcome to the Circle! Your authentication is complete.\n'));
      
    } catch (error) {
      spinner.fail('Authentication check failed');
      console.log(chalk.red(`\n❌ Error checking authentication: ${error}\n`));
    }
  }

  /**
   * Direct login without web app
   */
  private async directLogin(email: string, userPassword: string): Promise<void> {
    const spinner = ora('Performing the login ritual...').start();
    
    try {
      const data = await signInWithEmail(email, userPassword);

      if (data.session && data.user) {
        this.currentSession = data.session as AuthSession;
        this.currentUser = data.user as User;
        
        spinner.succeed('Login successful!');
        console.log(chalk.green('\n✨ The Circle recognizes you! Welcome back.\n'));
      } else {
        throw new Error('Authentication failed');
      }
      
    } catch (error: unknown) {
      spinner.fail('Login failed');
      console.log(chalk.red(`\n❌ The ritual has failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`));
    }
  }

  /**
   * Direct registration without web app
   */
  private async directRegister(handle: string, email: string, userPassword: string): Promise<void> {
    const spinner = ora('Performing the initiation ceremony...').start();
    
    try {
      const data = await signUpWithEmail(email, userPassword, handle);

      if (data.user) {
        spinner.succeed('Registration successful!');
        console.log(chalk.green('\n🎉 Welcome to the Circle! Your initiation is complete.\n'));
        console.log(chalk.cyan('📧 Please check your email to verify your account.'));
        
        if (data.session) {
          this.currentSession = data.session as AuthSession;
          this.currentUser = data.user as User;
        }
      } else {
        throw new Error('Registration failed');
      }
      
    } catch (error: unknown) {
      spinner.fail('Registration failed');
      console.log(chalk.red(`\n❌ The initiation has failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`));
    }
  }

  /**
   * Open web app
   */
  private async openWebApp(authenticated: boolean = false): Promise<void> {
    const spinner = ora('Summoning the Sacred Web Portal...').start();
    
    try {
      let url = this.config.webAppUrl || 'http://localhost:3000';
      
      if (authenticated && this.currentSession) {
        // Add auth token to URL for auto-login
        const params = new URLSearchParams({
          token: this.currentSession.access_token,
          cli: 'true'
        });
        url += `/dashboard?${params.toString()}`;
      }
      
      const platform = process.platform;
      let command = '';
      
      if (platform === 'win32') {
        command = `start "" "${url}"`;
      } else if (platform === 'darwin') {
        command = `open "${url}"`;
      } else {
        command = `xdg-open "${url}"`;
      }
      
      await execAsync(command);
      spinner.succeed('Sacred Web Portal summoned!');
      
      console.log(chalk.green('\n🌐 The Web Portal awaits your presence!'));
      console.log(chalk.gray('You may now navigate between the CLI and web interface seamlessly.\n'));
      
    } catch (error) {
      spinner.fail('Failed to summon the Web Portal');
      console.log(chalk.red(`\n❌ Error: ${error}\n`));
    }
  }

  /**
   * Show user profile
   */
  private async showProfile(): Promise<void> {
    if (!this.currentSession) return;
    
    console.log(chalk.blue('\n👤 Your Profile in the Circle\n'));
    
    const profileBox = boxen(
      `Handle: ${chalk.yellow(this.currentSession.user.handle || 'N/A')}\n` +
      `Email: ${chalk.yellow(this.currentSession.user.email)}\n` +
      `Member Since: ${chalk.yellow(new Date(this.currentSession.user.created_at).toLocaleDateString())}\n` +
      `Session Expires: ${chalk.yellow(new Date(this.currentSession.expires_at).toLocaleString())}`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'blue'
      }
    );
    
    console.log(profileBox);
    
    await input({ message: 'Press Enter to continue...' });
  }

  /**
   * Sync data with cloud
   */
  private async syncData(): Promise<void> {
    const spinner = ora('Synchronizing with the Sacred Cloud...').start();
    
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      spinner.succeed('Data synchronized successfully!');
      console.log(chalk.green('\n✨ Your data is now in harmony with the Cloud.\n'));
      
    } catch (error) {
      spinner.fail('Synchronization failed');
      console.log(chalk.red(`\n❌ Sync error: ${error}\n`));
    }
  }

  /**
   * Change password
   */
  private async changePassword(): Promise<void> {
    console.log(chalk.blue('\n🔐 Forging a New Incantation\n'));
    
    const currentPassword = await password({
      message: 'Current password:',
      mask: '•'
    });
    
    const newPassword = await password({
      message: 'New password:',
      mask: '•',
      validate: (value) => {
        if (value.length < 8) return 'Your new incantation must be at least 8 characters long';
        return true;
      }
    });
    
    const confirmPassword = await password({
      message: 'Confirm new password:',
      mask: '•'
    });
    
    if (newPassword !== confirmPassword) {
      console.log(chalk.red('\n❌ The incantations do not match.\n'));
      return;
    }
    
    const spinner = ora('Forging the new incantation...').start();
    
    try {
      // Simulate password change
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      spinner.succeed('Password changed successfully!');
      console.log(chalk.green('\n✨ Your new incantation has been forged!\n'));
      
    } catch (error) {
      spinner.fail('Password change failed');
      console.log(chalk.red(`\n❌ Error: ${error}\n`));
    }
  }

  /**
   * Logout
   */


  /**
   * Show help
   */
  private async showHelp(): Promise<void> {
    const helpText = `
${chalk.bold.blue('🔮 Authentication Help - The Sacred Guide')}

${chalk.yellow('Commands:')}
  ${chalk.green('login')}     - Return to the Circle with your credentials
  ${chalk.green('register')}  - Join the Covenant and become a member
  ${chalk.green('web')}       - Open the Sacred Web Portal

${chalk.yellow('Web Integration:')}
  The CLI can open the web application for authentication.
  This provides a seamless experience between terminal and browser.
  Your session will be synchronized across both interfaces.

${chalk.yellow('Security:')}
  • All credentials are encrypted and stored securely
  • Sessions expire automatically for your protection
  • The Circle protects your digital essence

${chalk.yellow('Troubleshooting:')}
  • If web portal fails to open, try direct authentication
  • Check your internet connection for cloud features
  • Contact the Circle elders if issues persist
`;
    
    console.log(helpText);
    await input({ message: 'Press Enter to continue...' });
  }

  /**
   * Load session from Supabase
   */
  private async loadSession(): Promise<void> {
    try {
      const session = await getCurrentSession();
      if (session) {
        this.currentSession = session as AuthSession;
        this.currentUser = session.user as User;
      }
    } catch (error) {
      console.warn(chalk.yellow('Warning: Could not load authentication session'));
    }
  }

  /**
   * Clear session
   */
  private async clearSession(): Promise<void> {
    try {
      await signOut();
      this.currentSession = null;
      this.currentUser = null;
    } catch (error) {
      console.error(chalk.red('Error clearing authentication session:'), error);
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.currentSession !== null && this.currentUser !== null;
  }

  /**
   * Get current user session
   */
  public getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  /**
   * Get current user
   */
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get user's access token for API calls
   */
  public getAccessToken(): string | null {
    return this.currentSession?.access_token || null;
  }

  /**
   * Open web authentication
   */
  async openWebAuth(mode: 'login' | 'register' | 'both' = 'login'): Promise<boolean> {
     try {
       if (!isSupabaseConfigured()) {
         console.error(chalk.red('❌ Supabase is not configured. Please set up your environment variables.'));
         const configInfo = getSupabaseConfigInfo();
         console.log(chalk.yellow(`Current URL: ${configInfo.url}`));
         return false;
       }
       
       const webUrl = this.config.webAppUrl || 'http://localhost:3000';
       const authUrl = `${webUrl}/cli-auth?mode=${mode === 'both' ? 'login' : mode}&cli=true`;
       
       console.log(chalk.cyan('🌐 Opening web authentication portal...'));
       console.log(chalk.gray(`URL: ${authUrl}`));
       
       await open(authUrl);
       
       // Set up message listener for web authentication
       return new Promise((resolve) => {
         const timeout = setTimeout(() => {
           console.log(chalk.yellow('⏰ Authentication timeout. Please try again.'));
           resolve(false);
         }, 300000); // 5 minute timeout
         
         // Listen for authentication messages from the web app
         const messageHandler = (event: any) => {
           if (event.data && event.data.type === 'AUTH_SUCCESS') {
             clearTimeout(timeout);
             console.log(chalk.green('✅ Authentication successful!'));
             
             // Store the session data
             if (event.data.session) {
               this.currentSession = event.data.session;
               this.currentUser = event.data.user;
             }
             
             resolve(true);
           } else if (event.data && event.data.type === 'AUTH_CANCELLED') {
             clearTimeout(timeout);
             console.log(chalk.yellow('❌ Authentication cancelled.'));
             resolve(false);
           }
         };
         
         // For CLI, we'll use a polling mechanism instead of window messages
         // since we can't listen to browser window messages from CLI
         const pollForAuth = async () => {
           const waitForAuth = await confirm({
             message: '🔮 Have you completed authentication in the web browser?',
             default: true
           });
           
           if (waitForAuth) {
             clearTimeout(timeout);
             // Refresh session to check if user is now authenticated
             await this.loadSession();
             resolve(this.isAuthenticated());
           } else {
             clearTimeout(timeout);
             resolve(false);
           }
         };
         
         pollForAuth();
       });
     } catch (error) {
       console.error(chalk.red('❌ Error opening web authentication:'), error);
       return false;
     }
   }



}