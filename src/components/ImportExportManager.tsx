import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/use-auth';
import { supabase } from '../lib/supabase';
import { Download, Upload, FileText, Database, Users, Heart, Link, Settings, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

// CLI-compatible export format
interface CLIExportData {
  version: string;
  timestamp: string;
  data: {
    characters: CharacterSheet[];
    emotions: EmotionalState[];
    chains: PromptChain[];
    config?: CLIConfig;
  };
}

// Legacy web app export format (for backward compatibility)
interface ExportData {
  characters?: any[];
  emotions?: any[];
  chains?: any[];
  projects?: any[];
  templates?: any[];
  servers?: any[];
  metadata?: {
    exported_at?: string;
    version?: string;
    format?: string;
    user_id?: string;
    total_items?: number;
  };
}

// CLI-compatible types (matching CLI package)
interface CharacterSheet {
  id: string;
  name: string;
  description: string;
  personality: string[];
  background: string;
  goals: string[];
  relationships: Record<string, string>;
  traits: {
    strengths: string[];
    weaknesses: string[];
    quirks: string[];
  };
  emotionalState: EmotionalState;
  createdAt: Date;
  updatedAt: Date;
}

interface EmotionalState {
  id: string;
  name: string;
  description?: string;
  primaryEmotion: string;
  intensity: number; // 1-10
  valence: number; // -1 to 1
  arousal: number; // 0 to 1
  dominance: number; // 0 to 1
  secondaryEmotions: string[];
  context: string[];
  triggers: string[];
  responses: string[];
  createdAt: Date;
  updatedAt: Date;
  history?: {
    emotion: string;
    timestamp: Date;
    context: string;
  }[];
}

interface PromptChain {
  id: string;
  name: string;
  description: string;
  steps: PromptChainStep[];
  variables: Record<string, any>;
  conditions: ChainCondition[];
  metadata: {
    tags: string[];
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number; // minutes
  };
  createdAt: Date;
  updatedAt: Date;
}

interface PromptChainStep {
  id: string;
  name: string;
  prompt: string;
  expectedOutput?: string;
  nextSteps: string[];
  conditions?: ChainCondition[];
  timeout?: number;
  retries?: number;
}

interface ChainCondition {
  type: 'contains' | 'equals' | 'regex' | 'length' | 'custom';
  value: any;
  action: 'continue' | 'skip' | 'retry' | 'branch';
  target?: string;
}

interface CLIConfig {
  apiKey: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  outputFormat: string;
  autoSave: boolean;
  backupCount: number;
  theme: string;
  language: string;
  timezone: string;
  dataDir: string;
  editor: string;
  pager: string;
  apiKeys: {
    openai?: string;
    anthropic?: string;
    google?: string;
  };
  defaultSettings: {
    theme: 'light' | 'dark';
    autoSave: boolean;
    verboseOutput: boolean;
  };
  analytics: {
    enabled: boolean;
    trackUsage: boolean;
    trackErrors: boolean;
    shareAnonymous: boolean;
  };
  ui: {
    showIcons: boolean;
    showProgress: boolean;
    colorOutput: boolean;
    compactMode: boolean;
    animateSpinners: boolean;
    showTimestamps: boolean;
  };
  performance: {
    cacheEnabled: boolean;
    cacheSize: number;
    cacheTTL: number;
    parallelRequests: number;
    requestTimeout: number;
  };
  security: {
    encryptData: boolean;
    requireAuth: boolean;
    sessionTimeout: number;
    logSensitiveData: boolean;
  };
  plugins: string[];
  webAppUrl?: string;
}

interface ImportResult {
  success: boolean;
  imported: {
    characters: number;
    emotions: number;
    chains: number;
    projects: number;
    servers: number;
  };
  errors: string[];
  warnings: string[];
}

interface BackupData {
  id: string;
  name: string;
  created_at: string;
  size: number;
  items_count: number;
  data: ExportData;
}

const ImportExportManager: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'backup'>('export');
  const [loading, setLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    characters: true,
    emotions: true,
    chains: true,
    projects: true,
    servers: true
  });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<ExportData | null>(null);
  const [migrationProgress, setMigrationProgress] = useState<{
    current: number;
    total: number;
    status: string;
  } | null>(null);

  React.useEffect(() => {
    if (user) {
      loadBackups();
    }
  }, [user]);

  const loadBackups = () => {
    try {
      const storedBackups = localStorage.getItem(`backups_${user?.id}`);
      if (storedBackups) {
        setBackups(JSON.parse(storedBackups));
      }
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  };

  const saveBackups = (updatedBackups: BackupData[]) => {
    localStorage.setItem(`backups_${user?.id}`, JSON.stringify(updatedBackups));
    setBackups(updatedBackups);
  };

  const fetchUserData = async () => {
    if (!user) return null;

    try {
      const data: ExportData = {
        metadata: {
          exported_at: new Date().toISOString(),
          version: '1.0.0',
          user_id: user.id,
          total_items: 0
        }
      };

      // Fetch characters from localStorage (since we don't have DB tables yet)
      if (exportOptions.characters) {
        const storedCharacters = localStorage.getItem(`characters_${user.id}`);
        data.characters = storedCharacters ? JSON.parse(storedCharacters) : [];
      }

      // Fetch emotions from localStorage
      if (exportOptions.emotions) {
        const storedEmotions = localStorage.getItem(`emotions_${user.id}`);
        data.emotions = storedEmotions ? JSON.parse(storedEmotions) : [];
      }

      // Fetch chains from localStorage
      if (exportOptions.chains) {
        const storedChains = localStorage.getItem(`chains_${user.id}`);
        data.chains = storedChains ? JSON.parse(storedChains) : [];
      }

      // Fetch MCP servers from localStorage
      if (exportOptions.servers) {
        const storedServers = localStorage.getItem(`mcp_servers_${user.id}`);
        data.servers = storedServers ? JSON.parse(storedServers) : [];
      }

      // Fetch projects from Supabase
      if (exportOptions.projects) {
        const { data: projects, error } = await supabase
          .from('projects')
          .select(`
            *,
            prompt_blocks(*)
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching projects:', error);
          data.projects = [];
        } else {
          data.projects = projects || [];
        }
      }

      // Calculate total items
      data.metadata = data.metadata || {};
      data.metadata.total_items = (
        (data.characters?.length || 0) +
        (data.emotions?.length || 0) +
        (data.chains?.length || 0) +
        (data.projects?.length || 0) +
        (data.servers?.length || 0)
      );

      return data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Convert database character to CLI format
  const convertCharacterToCLI = (dbChar: any): CharacterSheet => {
    return {
      id: dbChar.id,
      name: dbChar.name,
      description: dbChar.description || '',
      personality: dbChar.personality ? dbChar.personality.split(',').map((p: string) => p.trim()) : [],
      background: dbChar.background || '',
      goals: dbChar.goals ? dbChar.goals.split(',').map((g: string) => g.trim()) : [],
      relationships: dbChar.relationships || {},
      traits: {
        strengths: dbChar.strengths ? dbChar.strengths.split(',').map((s: string) => s.trim()) : [],
        weaknesses: dbChar.weaknesses ? dbChar.weaknesses.split(',').map((w: string) => w.trim()) : [],
        quirks: dbChar.quirks ? dbChar.quirks.split(',').map((q: string) => q.trim()) : []
      },
      emotionalState: {
        id: dbChar.emotional_state_id || crypto.randomUUID(),
        name: dbChar.emotional_state || 'neutral',
        primaryEmotion: dbChar.emotional_state || 'neutral',
        intensity: 5,
        valence: 0,
        arousal: 0.5,
        dominance: 0.5,
        secondaryEmotions: [],
        context: [],
        triggers: [],
        responses: [],
        createdAt: new Date(dbChar.created_at),
        updatedAt: new Date(dbChar.updated_at || dbChar.created_at)
      },
      createdAt: new Date(dbChar.created_at),
      updatedAt: new Date(dbChar.updated_at || dbChar.created_at)
    };
  };

  // Convert database emotion to CLI format
  const convertEmotionToCLI = (dbEmotion: any): EmotionalState => {
    return {
      id: dbEmotion.id,
      name: dbEmotion.name,
      description: dbEmotion.description,
      primaryEmotion: dbEmotion.primary_emotion || dbEmotion.name,
      intensity: dbEmotion.intensity || 5,
      valence: dbEmotion.valence || 0,
      arousal: dbEmotion.arousal || 0.5,
      dominance: dbEmotion.dominance || 0.5,
      secondaryEmotions: dbEmotion.secondary_emotions || [],
      context: dbEmotion.context || [],
      triggers: dbEmotion.triggers || [],
      responses: dbEmotion.responses || [],
      createdAt: new Date(dbEmotion.created_at),
      updatedAt: new Date(dbEmotion.updated_at || dbEmotion.created_at)
    };
  };

  const handleExport = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await fetchUserData();
      if (!data) {
        throw new Error('Failed to fetch user data');
      }

      // Create CLI-compatible export
      const cliData: CLIExportData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        data: {
          characters: (data.characters || []).map(convertCharacterToCLI),
          emotions: (data.emotions || []).map(convertEmotionToCLI),
          chains: (data.chains || []).map(chain => ({
            id: chain.id,
            name: chain.name,
            description: chain.description || '',
            steps: chain.steps || [],
            variables: chain.variables || {},
            conditions: chain.conditions || [],
            metadata: {
              tags: chain.tags || [],
              category: chain.category || 'general',
              difficulty: chain.difficulty || 'beginner',
              estimatedTime: chain.estimated_time || 5
            },
            createdAt: new Date(chain.created_at),
            updatedAt: new Date(chain.updated_at || chain.created_at)
          })),
          config: {
            apiKey: '',
            defaultModel: 'gpt-4',
            maxTokens: 2048,
            temperature: 0.7,
            outputFormat: 'json',
            autoSave: true,
            backupCount: 5,
            theme: 'dark',
            language: 'en',
            timezone: 'UTC',
            dataDir: './data',
            editor: 'nano',
            pager: 'less',
            apiKeys: {},
            defaultSettings: {
              theme: 'dark',
              autoSave: true,
              verboseOutput: false
            },
            analytics: {
              enabled: true,
              trackUsage: true,
              trackErrors: true,
              shareAnonymous: false
            },
            ui: {
              showIcons: true,
              showProgress: true,
              colorOutput: true,
              compactMode: false,
              animateSpinners: true,
              showTimestamps: true
            },
            performance: {
              cacheEnabled: true,
              cacheSize: 100,
              cacheTTL: 3600,
              parallelRequests: 3,
              requestTimeout: 30000
            },
            security: {
              encryptData: false,
              requireAuth: false,
              sessionTimeout: 3600,
              logSensitiveData: false
            },
            plugins: [],
            webAppUrl: window.location.origin
          }
        }
      };

      const filename = `prompt-or-die-backup-${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([JSON.stringify(cliData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rawData = JSON.parse(e.target?.result as string);
      
      // Convert CLI format to preview format
      if (isCLIFormat(rawData)) {
        const cliData = rawData as CLIExportData;
        const previewData: ExportData = {
          characters: cliData.data.characters || [],
          emotions: cliData.data.emotions || [],
          chains: cliData.data.chains || [],
          projects: [],
          templates: [],
          metadata: {
            exported_at: cliData.timestamp,
            version: cliData.version,
            format: 'CLI',
            total_items: (cliData.data.characters?.length || 0) + (cliData.data.emotions?.length || 0) + (cliData.data.chains?.length || 0)
          }
        };
        setImportPreviewData(previewData);
      } else {
        const legacyData = rawData as ExportData;
        if (!legacyData.metadata) {
          legacyData.metadata = {
            format: 'Legacy',
            total_items: (legacyData.characters?.length || 0) + (legacyData.emotions?.length || 0) + (legacyData.chains?.length || 0)
          };
        }
        setImportPreviewData(legacyData);
      }
        setShowImportPreview(true);
      } catch (error) {
        alert('Invalid file format. Please select a valid export file.');
      }
    };
    reader.readAsText(file);
  };

  // Convert CLI character to database format
  const convertCharacterFromCLI = (cliChar: CharacterSheet): any => {
    return {
      id: cliChar.id,
      name: cliChar.name,
      description: cliChar.description,
      personality: cliChar.personality.join(', '),
      background: cliChar.background,
      goals: cliChar.goals.join(', '),
      relationships: cliChar.relationships,
      strengths: cliChar.traits.strengths.join(', '),
      weaknesses: cliChar.traits.weaknesses.join(', '),
      quirks: cliChar.traits.quirks.join(', '),
      emotional_state: cliChar.emotionalState.name,
      emotional_state_id: cliChar.emotionalState.id,
      created_at: cliChar.createdAt.toISOString(),
      updated_at: cliChar.updatedAt.toISOString()
    };
  };

  // Convert CLI emotion to database format
  const convertEmotionFromCLI = (cliEmotion: EmotionalState): any => {
    return {
      id: cliEmotion.id,
      name: cliEmotion.name,
      description: cliEmotion.description,
      primary_emotion: cliEmotion.primaryEmotion,
      intensity: cliEmotion.intensity,
      valence: cliEmotion.valence,
      arousal: cliEmotion.arousal,
      dominance: cliEmotion.dominance,
      secondary_emotions: cliEmotion.secondaryEmotions,
      context: cliEmotion.context,
      triggers: cliEmotion.triggers,
      responses: cliEmotion.responses,
      created_at: cliEmotion.createdAt.toISOString(),
      updated_at: cliEmotion.updatedAt.toISOString()
    };
  };

  // Detect if import data is CLI format or legacy format
  const isCLIFormat = (data: any): data is CLIExportData => {
    return data.version && data.timestamp && data.data && 
           typeof data.data === 'object' && 
           (data.data.characters || data.data.emotions || data.data.chains);
  };

  const handleImport = async (importData: ExportData | CLIExportData, options: { overwrite: boolean; merge: boolean }) => {
    if (!user) return;

    setLoading(true);
    setMigrationProgress({ current: 0, total: 5, status: 'Starting import...' });

    try {
      const result: ImportResult = {
        success: true,
        imported: {
          characters: 0,
          emotions: 0,
          chains: 0,
          projects: 0,
          servers: 0
        },
        errors: [],
        warnings: []
      };

      let data: ExportData;

      // Convert CLI format to legacy format for processing
      if (isCLIFormat(importData)) {
        const cliData = importData as CLIExportData;
        data = {
          characters: cliData.data.characters ? cliData.data.characters.map(convertCharacterFromCLI) : [],
          emotions: cliData.data.emotions ? cliData.data.emotions.map(convertEmotionFromCLI) : [],
          chains: cliData.data.chains ? cliData.data.chains.map(chain => ({
            id: chain.id,
            name: chain.name,
            description: chain.description,
            steps: chain.steps,
            variables: chain.variables,
            conditions: chain.conditions,
            tags: chain.metadata.tags,
            category: chain.metadata.category,
            difficulty: chain.metadata.difficulty,
            estimated_time: chain.metadata.estimatedTime,
            created_at: chain.createdAt.toISOString(),
            updated_at: chain.updatedAt.toISOString()
          })) : [],
          projects: [],
          servers: [],
          metadata: {
            exported_at: cliData.timestamp,
            version: cliData.version,
            user_id: user.id,
            total_items: (cliData.data.characters?.length || 0) + (cliData.data.emotions?.length || 0) + (cliData.data.chains?.length || 0)
          }
        };
      } else {
        data = importData as ExportData;
      }

      // Import characters
      if (data.characters && data.characters.length > 0) {
        setMigrationProgress({ current: 1, total: 5, status: 'Importing characters...' });
        try {
          const existingCharacters = localStorage.getItem(`characters_${user.id}`);
          let characters = existingCharacters ? JSON.parse(existingCharacters) : [];
          
          if (options.overwrite) {
            characters = data.characters;
          } else if (options.merge) {
            const existingIds = new Set(characters.map((c: any) => c.id));
            const newCharacters = data.characters.filter((c: any) => !existingIds.has(c.id));
            characters = [...characters, ...newCharacters];
            if (newCharacters.length < data.characters.length) {
              result.warnings.push(`${data.characters.length - newCharacters.length} characters skipped (already exist)`);
            }
          }
          
          localStorage.setItem(`characters_${user.id}`, JSON.stringify(characters));
          result.imported.characters = options.overwrite ? data.characters.length : 
            (characters.length - (existingCharacters ? JSON.parse(existingCharacters).length : 0));
        } catch (error) {
          result.errors.push(`Failed to import characters: ${error}`);
        }
      }

      // Import emotions
      if (data.emotions && data.emotions.length > 0) {
        setMigrationProgress({ current: 2, total: 5, status: 'Importing emotions...' });
        try {
          const existingEmotions = localStorage.getItem(`emotions_${user.id}`);
          let emotions = existingEmotions ? JSON.parse(existingEmotions) : [];
          
          if (options.overwrite) {
            emotions = data.emotions;
          } else if (options.merge) {
            const existingIds = new Set(emotions.map((e: any) => e.id));
            const newEmotions = data.emotions.filter((e: any) => !existingIds.has(e.id));
            emotions = [...emotions, ...newEmotions];
            if (newEmotions.length < data.emotions.length) {
              result.warnings.push(`${data.emotions.length - newEmotions.length} emotions skipped (already exist)`);
            }
          }
          
          localStorage.setItem(`emotions_${user.id}`, JSON.stringify(emotions));
          result.imported.emotions = options.overwrite ? data.emotions.length : 
            (emotions.length - (existingEmotions ? JSON.parse(existingEmotions).length : 0));
        } catch (error) {
          result.errors.push(`Failed to import emotions: ${error}`);
        }
      }

      // Import chains
      if (data.chains && data.chains.length > 0) {
        setMigrationProgress({ current: 3, total: 5, status: 'Importing chains...' });
        try {
          const existingChains = localStorage.getItem(`chains_${user.id}`);
          let chains = existingChains ? JSON.parse(existingChains) : [];
          
          if (options.overwrite) {
            chains = data.chains;
          } else if (options.merge) {
            const existingIds = new Set(chains.map((c: any) => c.id));
            const newChains = data.chains.filter((c: any) => !existingIds.has(c.id));
            chains = [...chains, ...newChains];
            if (newChains.length < data.chains.length) {
              result.warnings.push(`${data.chains.length - newChains.length} chains skipped (already exist)`);
            }
          }
          
          localStorage.setItem(`chains_${user.id}`, JSON.stringify(chains));
          result.imported.chains = options.overwrite ? data.chains.length : 
            (chains.length - (existingChains ? JSON.parse(existingChains).length : 0));
        } catch (error) {
          result.errors.push(`Failed to import chains: ${error}`);
        }
      }

      // Import servers
      if (data.servers && data.servers.length > 0) {
        setMigrationProgress({ current: 4, total: 5, status: 'Importing MCP servers...' });
        try {
          const existingServers = localStorage.getItem(`mcp_servers_${user.id}`);
          let servers = existingServers ? JSON.parse(existingServers) : [];
          
          if (options.overwrite) {
            servers = data.servers;
          } else if (options.merge) {
            const existingIds = new Set(servers.map((s: any) => s.id));
            const newServers = data.servers.filter((s: any) => !existingIds.has(s.id));
            servers = [...servers, ...newServers];
            if (newServers.length < data.servers.length) {
              result.warnings.push(`${data.servers.length - newServers.length} servers skipped (already exist)`);
            }
          }
          
          localStorage.setItem(`mcp_servers_${user.id}`, JSON.stringify(servers));
          result.imported.servers = options.overwrite ? data.servers.length : 
            (servers.length - (existingServers ? JSON.parse(existingServers).length : 0));
        } catch (error) {
          result.errors.push(`Failed to import servers: ${error}`);
        }
      }

      // Import projects
      if (data.projects && data.projects.length > 0) {
        setMigrationProgress({ current: 5, total: 5, status: 'Importing projects...' });
        try {
          for (const project of data.projects) {
            // Update user_id to current user
            const projectData = {
              ...project,
              user_id: user.id,
              id: undefined // Let Supabase generate new ID
            };
            
            const { data: newProject, error: projectError } = await supabase
              .from('projects')
              .insert(projectData)
              .select()
              .single();

            if (projectError) {
              result.errors.push(`Failed to import project "${project.name}": ${projectError.message}`);
              continue;
            }

            // Import prompt blocks for this project
            if (project.prompt_blocks && project.prompt_blocks.length > 0) {
              const blocksData = project.prompt_blocks.map((block: any) => ({
                ...block,
                project_id: newProject.id,
                id: undefined // Let Supabase generate new ID
              }));

              const { error: blocksError } = await supabase
                .from('prompt_blocks')
                .insert(blocksData);

              if (blocksError) {
                result.warnings.push(`Project "${project.name}" imported but some blocks failed: ${blocksError.message}`);
              }
            }

            result.imported.projects++;
          }
        } catch (error) {
          result.errors.push(`Failed to import projects: ${error}`);
        }
      }

      setImportResult(result);
      setShowImportPreview(false);
      
      if (result.errors.length === 0) {
        // Refresh the page to show imported data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        success: false,
        imported: { characters: 0, emotions: 0, chains: 0, projects: 0, servers: 0 },
        errors: [`Import failed: ${error}`],
        warnings: []
      });
    } finally {
      setLoading(false);
      setMigrationProgress(null);
    }
  };

  const handleCreateBackup = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await fetchUserData();
      if (!data) {
        throw new Error('Failed to fetch user data');
      }

      const backup: BackupData = {
        id: `backup_${Date.now()}`,
        name: `Backup ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        created_at: new Date().toISOString(),
        size: JSON.stringify(data).length,
        items_count: data.metadata?.total_items || 0,
        data
      };

      const updatedBackups = [backup, ...backups].slice(0, 10); // Keep only 10 most recent backups
      saveBackups(updatedBackups);
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Backup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (backup: BackupData) => {
    if (!confirm('Are you sure you want to restore this backup? This will overwrite your current data.')) {
      return;
    }

    await handleImport(backup.data, { overwrite: true, merge: false });
  };

  const handleDeleteBackup = (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) return;

    const updatedBackups = backups.filter(b => b.id !== backupId);
    saveBackups(updatedBackups);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Import/Export Manager</h2>
          <p className="text-gray-600">Manage your data with bulk operations, migration tools, and backups</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'export', label: 'Export', icon: Download },
            { id: 'import', label: 'Import', icon: Upload },
            { id: 'backup', label: 'Backup & Restore', icon: Database }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Migration Progress */}
      {migrationProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">{migrationProgress.status}</span>
                <span className="text-sm text-blue-700">
                  {migrationProgress.current} / {migrationProgress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(migrationProgress.current / migrationProgress.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className={`border rounded-lg p-4 ${
          importResult.success && importResult.errors.length === 0
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {importResult.success && importResult.errors.length === 0 ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <h3 className="font-medium">
              {importResult.success && importResult.errors.length === 0 ? 'Import Successful' : 'Import Completed with Issues'}
            </h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            {Object.entries(importResult.imported).map(([type, count]) => (
              <div key={type} className="text-center">
                <div className="text-lg font-semibold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{type}</div>
              </div>
            ))}
          </div>
          
          {importResult.warnings.length > 0 && (
            <div className="mb-3">
              <h4 className="font-medium text-yellow-800 mb-1">Warnings:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {importResult.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          {importResult.errors.length > 0 && (
            <div>
              <h4 className="font-medium text-red-800 mb-1">Errors:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {importResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <button
            onClick={() => setImportResult(null)}
            className="mt-3 text-sm text-gray-600 hover:text-gray-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Export Your Data</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select data to export:
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'characters', label: 'Characters', icon: Users },
                    { key: 'emotions', label: 'Emotions', icon: Heart },
                    { key: 'chains', label: 'Chains', icon: Link },
                    { key: 'projects', label: 'Projects', icon: FileText },
                    { key: 'servers', label: 'MCP Servers', icon: Settings }
                  ].map(({ key, label, icon: Icon }) => (
                    <label key={key} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={exportOptions[key as keyof typeof exportOptions]}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleExport}
                disabled={loading || !Object.values(exportOptions).some(Boolean)}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {loading ? 'Exporting...' : 'Export Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Import Data</h3>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Select Import File</h4>
                <p className="text-gray-600 mb-4">Choose a JSON export file to import your data</p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Choose File
                </button>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Important Notes</h4>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      <li>• Make sure to backup your current data before importing</li>
                      <li>• Import files must be in the correct JSON format</li>
                      <li>• Duplicate items will be handled based on your merge settings</li>
                      <li>• Projects will be imported to your account with new IDs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Backup & Restore</h3>
              <button
                onClick={handleCreateBackup}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                {loading ? 'Creating...' : 'Create Backup'}
              </button>
            </div>
            
            {backups.length === 0 ? (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Backups</h4>
                <p className="text-gray-600">Create your first backup to protect your data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {backups.map((backup) => (
                  <div key={backup.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{backup.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>{new Date(backup.created_at).toLocaleString()}</span>
                          <span>{backup.items_count} items</span>
                          <span>{formatFileSize(backup.size)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRestoreBackup(backup)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(backup.id)}
                          className="text-red-600 hover:text-red-700 px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Preview Modal */}
      {showImportPreview && importPreviewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Import Preview</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">File Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {importPreviewData.metadata?.exported_at && (
                      <div>
                        <span className="text-gray-600">Exported:</span>
                        <span className="ml-2">{new Date(importPreviewData.metadata.exported_at).toLocaleString()}</span>
                      </div>
                    )}
                    {importPreviewData.metadata?.version && (
                      <div>
                        <span className="text-gray-600">Version:</span>
                        <span className="ml-2">{importPreviewData.metadata.version}</span>
                      </div>
                    )}
                    {importPreviewData.metadata?.format && (
                      <div>
                        <span className="text-gray-600">Format:</span>
                        <span className="ml-2">{importPreviewData.metadata.format}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Total Items:</span>
                      <span className="ml-2">{importPreviewData.metadata?.total_items || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Data to Import</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'characters', label: 'Characters', icon: Users },
                      { key: 'emotions', label: 'Emotions', icon: Heart },
                      { key: 'chains', label: 'Chains', icon: Link },
                      { key: 'projects', label: 'Projects', icon: FileText },
                      { key: 'servers', label: 'MCP Servers', icon: Settings }
                    ].map(({ key, label, icon: Icon }) => {
                      const dataArray = importPreviewData[key as keyof ExportData];
                      const count = Array.isArray(dataArray) ? dataArray.length : 0;
                      return (
                        <div key={key} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                          <Icon className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium">{label}</span>
                          <span className="ml-auto text-sm text-gray-600">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Import Options</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="importMode"
                        value="merge"
                        defaultChecked
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm">Merge with existing data (skip duplicates)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="importMode"
                        value="overwrite"
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm">Overwrite existing data (replace all)</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowImportPreview(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const mode = (document.querySelector('input[name="importMode"]:checked') as HTMLInputElement)?.value;
                    handleImport(importPreviewData, {
                      overwrite: mode === 'overwrite',
                      merge: mode === 'merge'
                    });
                  }}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Importing...' : 'Start Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportExportManager;