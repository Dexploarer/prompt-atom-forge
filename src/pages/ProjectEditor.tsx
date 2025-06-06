import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import Header from '@/components/Header';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import PromptBuilder from '@/components/PromptBuilder';
import { PromptBlockProps } from '@/components/PromptBlock';

const ProjectEditor = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(!projectId);
  const [projectName, setProjectName] = useState(isCreating ? 'New Project' : '');
  const [blocks, setBlocks] = useState<PromptBlockProps[]>([]);
  
  // Get generated prompt from Quick Prompt Builder if available
  const generatedPrompt = location.state?.generatedPrompt;
  const promptConfig = location.state?.config;
  
  useEffect(() => {
    // If we're creating a new project, no need to fetch data
    if (isCreating) {
      // Initialize project name and blocks based on generated prompt if available
      if (generatedPrompt && promptConfig) {
        setProjectName(`Quick Prompt - ${promptConfig.type} (${new Date().toLocaleDateString()})`);
        setBlocks([
          {
            id: Date.now().toString(),
            type: 'intent',
            label: 'Intent',
            value: promptConfig.goal || 'Generated from Quick Prompt Builder'
          },
          {
            id: (Date.now() + 1).toString(),
            type: 'tone',
            label: 'Tone',
            value: promptConfig.tone
          },
          {
            id: (Date.now() + 2).toString(),
            type: 'context',
            label: 'Context',
            value: promptConfig.context || 'Context from Quick Prompt Builder'
          },
          {
            id: (Date.now() + 3).toString(),
            type: 'format',
            label: 'Format',
            value: `Format: ${promptConfig.format}, Length: ${promptConfig.length}`
          },
          {
            id: (Date.now() + 4).toString(),
            type: 'format',
            label: 'Generated Prompt',
            value: generatedPrompt
          }
        ]);
      }
      setIsLoading(false);
      return;
    }
    
    if (!projectId || !user) {
      navigate('/dashboard');
      return;
    }
    
    const fetchProject = async () => {
      setIsLoading(true);
      
      try {
        // Fetch project details
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single();
          
        if (projectError) throw projectError;
        
        if (!project) {
          toast({
            title: "Project not found",
            description: "The project you're trying to access doesn't exist or you don't have permission to view it.",
            variant: "destructive"
          });
          navigate('/dashboard');
          return;
        }
        
        setProjectName(project.name);
        
        // Fetch project blocks
        const { data: blockData, error: blocksError } = await supabase
          .from('prompt_blocks')
          .select('*')
          .eq('project_id', projectId)
          .order('order', { ascending: true });
          
        if (blocksError) throw blocksError;
        
        if (blockData) {
          const formattedBlocks: PromptBlockProps[] = blockData.map(block => ({
            id: block.id,
            type: block.type as any,
            label: block.label,
            value: block.value
          }));
          
          setBlocks(formattedBlocks);
        }
      } catch (error: any) {
        console.error('Error fetching project:', error);
        toast({
          title: "Error loading project",
          description: error.message || "Failed to load project data",
          variant: "destructive"
        });
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId, user, navigate, toast, isCreating]);
  
  const handleSaveProject = async () => {
    if (!user) return;
    
    try {
      if (isCreating) {
        // Create new project
        const newProjectId = Math.random().toString(36).substring(2, 15);
        
        const { data, error } = await supabase
          .from('projects')
          .insert({
            id: newProjectId,
            name: projectName,
            user_id: user.id,
            last_modified: new Date().toISOString()
          })
          .select();
          
        if (error) throw error;
        
        // Update state and URL to reflect the new project
        setIsCreating(false);
        navigate(`/projects/${newProjectId}`, { replace: true });
        
        toast({
          title: "Project created",
          description: "Your new project has been created successfully"
        });
      } else {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update({ 
            name: projectName,
            last_modified: new Date().toISOString()
          })
          .eq('id', projectId as string)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        toast({
          title: "Project updated",
          description: "Your project has been updated successfully"
        });
      }
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        title: "Error saving project",
        description: error.message || "Failed to save project",
        variant: "destructive"
      });
    }
  };
  
  const handleUpdateBlocks = async (updatedBlocks: PromptBlockProps[]) => {
    if (!projectId || !user) return;
    
    try {
      // First delete all existing blocks for this project
      const { error: deleteError } = await supabase
        .from('prompt_blocks')
        .delete()
        .eq('project_id', projectId);
        
      if (deleteError) throw deleteError;
      
      // Then insert the new blocks with their order
      if (updatedBlocks.length > 0) {
        const blocksToInsert = updatedBlocks.map((block, index) => ({
          id: block.id,
          project_id: projectId,
          user_id: user.id,
          type: block.type,
          label: block.label,
          value: block.value,
          order: index
        }));
        
        const { error: insertError } = await supabase
          .from('prompt_blocks')
          .insert(blocksToInsert);
          
        if (insertError) throw insertError;
      }
      
      toast({
        title: "Blocks updated",
        description: "Your prompt blocks have been saved"
      });
    } catch (error: any) {
      console.error('Error updating blocks:', error);
      toast({
        title: "Error saving blocks",
        description: error.message || "Failed to save prompt blocks",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-2xl font-bold">{isLoading ? 'Loading...' : (isCreating ? 'Create New Project' : projectName)}</h1>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="projectName" 
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleSaveProject} className="bg-primary">
                        <Save className="h-4 w-4 mr-2" />
                        {isCreating ? 'Create Project' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Prompt Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <PromptBuilder 
                  initialBlocks={blocks}
                  onBlocksChange={handleUpdateBlocks}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectEditor;
