
import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import DashboardStats from '@/components/DashboardStats';
import ProjectsTable from '@/components/ProjectsTable';
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
            Welcome, {user?.email}! Here's an overview of your projects.
          </p>
        </div>
        <Button onClick={() => navigate('/projects/new')} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Create New Project
        </Button>
      </div>
      
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
    </div>
  );
};

export default UserDashboard;
