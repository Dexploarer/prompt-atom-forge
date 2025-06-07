
import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus, Users, Heart, Link, Server, Download, Zap } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import DashboardStats from '@/components/DashboardStats';
import ProjectsTable from '@/components/ProjectsTable';
import CharacterManager from '@/components/CharacterManager';
import EmotionManager from '@/components/EmotionManager';
import { ChainManager } from '@/components/ChainManager';
import MCPManager from '@/components/MCPManager';
import ImportExportManager from '@/components/ImportExportManager';
import QuickPromptBuilder from '@/components/QuickPromptBuilder';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

const UserDashboard = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { projects, totalBlocks, isLoading, deleteProject } = useProjects();
  const [cliAuthSuccess, setCliAuthSuccess] = useState(false);
  const [isProcessingToken, setIsProcessingToken] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');
  
  useEffect(() => {
    const handleCLIAuth = async () => {
      const token = searchParams.get('token');
      const isCli = searchParams.get('cli') === 'true';
      
      if (token && isCli && !isAuthenticated) {
        setIsProcessingToken(true);
        try {
          // Get the current session to verify the token
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            throw sessionError;
          }
          
          // If we have a valid session, show success
          if (sessionData.session) {
            setCliAuthSuccess(true);
            // Clear the URL parameters
            navigate('/dashboard', { replace: true });
            
            // Hide success message after 5 seconds
            setTimeout(() => setCliAuthSuccess(false), 5000);
          } else {
            // If no session, redirect to auth
            throw new Error('No valid session found');
          }
        } catch (error) {
          console.error('CLI authentication failed:', error);
          navigate('/auth');
        } finally {
          setIsProcessingToken(false);
        }
      }
    };
    
    handleCLIAuth();
  }, [searchParams, isAuthenticated, navigate]);
  
  useEffect(() => {
    if (!isAuthenticated && !authLoading && !isProcessingToken) {
      navigate('/auth');
      return;
    }
  }, [isAuthenticated, navigate, authLoading, isProcessingToken]);

  if (authLoading || isProcessingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg">
            {isProcessingToken ? 'Processing CLI authentication...' : 'Loading user session...'}
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'projects', name: 'Projects', icon: Plus, description: 'Manage your prompt projects' },
    { id: 'characters', name: 'Characters', icon: Users, description: 'Create and manage character sheets' },
    { id: 'emotions', name: 'Emotions', icon: Heart, description: 'Manage emotional states and history' },
    { id: 'chains', name: 'Chains', icon: Link, description: 'Build advanced prompt chains' },
    { id: 'mcp', name: 'MCP Servers', icon: Server, description: 'Generate and manage MCP servers' },
    { id: 'import-export', name: 'Import/Export', icon: Download, description: 'Backup and migrate data' },
    { id: 'quick-builder', name: 'Quick Builder', icon: Zap, description: 'Rapid prompt generation' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'projects':
        return (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <DashboardStats projects={projects} totalBlocks={totalBlocks} />
                <div className="mt-12">
                  <h2 className="text-2xl font-bold mb-4">Your Projects</h2>
                  <ProjectsTable projects={projects} onDeleteProject={deleteProject} />
                </div>
              </>
            )}
          </>
        );
      case 'characters':
        return <CharacterManager />;
      case 'emotions':
        return <EmotionManager />;
      case 'chains':
        return <ChainManager />;
      case 'mcp':
        return <MCPManager />;
      case 'import-export':
        return <ImportExportManager />;
      case 'quick-builder':
        return (
          <QuickPromptBuilder
            onIntegrateWithBuilder={(prompt, config) => {
              navigate('/projects/new', { state: { generatedPrompt: prompt, config } });
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-10">
      {cliAuthSuccess && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            🔮 CLI Authentication successful! You are now seamlessly connected between the CLI and web interface.
          </AlertDescription>
        </Alert>
      )}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {user?.email}! Manage your projects, characters, emotions, chains, and more.
          </p>
        </div>
        <Button onClick={() => navigate('/projects/new')} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Create New Project
        </Button>
      </div>
      
      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`mr-2 h-5 w-5 ${
                    activeTab === tab.id ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default UserDashboard;
