import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type PromptChain = Database['public']['Tables']['prompt_chains']['Row'];
type ChainStep = Database['public']['Tables']['chain_steps']['Row'];
type ChainCondition = Database['public']['Tables']['chain_conditions']['Row'];
type ChainVariable = Database['public']['Tables']['chain_variables']['Row'];

export interface ChainFormData {
  name: string;
  description: string;
  category: string;
  is_active: boolean;
  timeout_seconds: number;
  max_retries: number;
  variables: Record<string, any>;
}

export interface StepFormData {
  name: string;
  prompt_template: string;
  step_order: number;
  timeout_seconds: number;
  max_retries: number;
  conditions: string[];
  next_step_id?: string;
  failure_step_id?: string;
}

export interface ExecutionResult {
  step_id: string;
  step_name: string;
  status: 'success' | 'failure' | 'timeout' | 'running';
  output?: string;
  error?: string;
  execution_time: number;
  timestamp: string;
}

export const useChainManager = (userId?: string) => {
  const [chains, setChains] = useState<PromptChain[]>([]);
  const [steps, setSteps] = useState<ChainStep[]>([]);
  const [conditions, setConditions] = useState<ChainCondition[]>([]);
  const [variables, setVariables] = useState<ChainVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState<string>('');
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedChain) {
      fetchChainSteps(selectedChain);
    }
  }, [selectedChain]);

  const fetchData = async () => {
    if (!userId) return;
    
    try {
      const [chainsResult, variablesResult] = await Promise.all([
        supabase
          .from('prompt_chains')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('chain_variables')
          .select('*')
          .eq('user_id', userId)
      ]);

      if (chainsResult.error) throw chainsResult.error;
      if (variablesResult.error) throw variablesResult.error;

      setChains((chainsResult.data || []).map(chain => ({
        ...chain,
        metadata: (chain as any).metadata || null,
      })));
      setVariables(variablesResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchChainSteps = async (chainId: string) => {
    try {
      const [stepsResult, conditionsResult] = await Promise.all([
        supabase
          .from('chain_steps')
          .select('*')
          .eq('chain_id', chainId)
          .order('step_order'),
        supabase
          .from('chain_conditions')
          .select('*')
          .eq('chain_id', chainId)
      ]);

      if (stepsResult.error) throw stepsResult.error;
      if (conditionsResult.error) throw conditionsResult.error;

      setSteps((stepsResult.data || []).map(step => ({
        ...step,
        conditions: [],
        retries: step.retry_count,
        timeout: step.timeout_seconds
      })));
      setConditions((conditionsResult.data || []).map(condition => ({
        ...condition,
        condition_target: null
      })));
    } catch (error) {
      console.error('Error fetching chain steps:', error);
      throw error;
    }
  };

  const createChain = async (chainData: ChainFormData) => {
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('prompt_chains')
      .insert({
        ...chainData,
        user_id: userId
      });

    if (error) throw error;
    await fetchData();
  };

  const updateChain = async (chainId: string, chainData: ChainFormData) => {
    const { error } = await supabase
      .from('prompt_chains')
      .update({
        ...chainData,
        updated_at: new Date().toISOString()
      })
      .eq('id', chainId);

    if (error) throw error;
    await fetchData();
  };

  const deleteChain = async (chainId: string) => {
    const { error } = await supabase
      .from('prompt_chains')
      .delete()
      .eq('id', chainId);

    if (error) throw error;
    await fetchData();
  };

  const createStep = async (chainId: string, stepData: StepFormData) => {
    const { error } = await supabase
      .from('chain_steps')
      .insert({
        ...stepData,
        chain_id: chainId
      });

    if (error) throw error;
    await fetchChainSteps(chainId);
  };

  const updateStep = async (stepId: string, stepData: StepFormData) => {
    const { error } = await supabase
      .from('chain_steps')
      .update({
        ...stepData,
        updated_at: new Date().toISOString()
      })
      .eq('id', stepId);

    if (error) throw error;
    if (selectedChain) {
      await fetchChainSteps(selectedChain);
    }
  };

  const deleteStep = async (stepId: string) => {
    const { error } = await supabase
      .from('chain_steps')
      .delete()
      .eq('id', stepId);

    if (error) throw error;
    if (selectedChain) {
      await fetchChainSteps(selectedChain);
    }
  };

  const executeChain = async (chainId: string, inputVariables: Record<string, any> = {}) => {
    setIsExecuting(true);
    setExecutionResults([]);

    try {
      const chain = chains.find(c => c.id === chainId);
      if (!chain) throw new Error('Chain not found');

      const chainSteps = steps.filter(s => s.chain_id === chainId).sort((a, b) => a.step_order - b.step_order);
      
      for (const step of chainSteps) {
        const startTime = Date.now();
        
        // Add running status
        setExecutionResults(prev => [...prev, {
          step_id: step.id,
          step_name: step.name,
          status: 'running',
          execution_time: 0,
          timestamp: new Date().toISOString()
        }]);

        try {
          // Simulate step execution (replace with actual AI API call)
          await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
          
          const executionTime = Date.now() - startTime;
          const success = Math.random() > 0.1; // 90% success rate for demo
          
          setExecutionResults(prev => prev.map(result => 
            result.step_id === step.id 
              ? {
                  ...result,
                  status: success ? 'success' : 'failure',
                  output: success ? `Step "${step.name}" completed successfully` : undefined,
                  error: success ? undefined : `Step "${step.name}" failed to execute`,
                  execution_time: executionTime
                }
              : result
          ));

          if (!success && step.failure_step_id) {
            // Handle failure step logic
            continue;
          } else if (!success) {
            break; // Stop execution on failure
          }
        } catch (error) {
          const executionTime = Date.now() - startTime;
          setExecutionResults(prev => prev.map(result => 
            result.step_id === step.id 
              ? {
                  ...result,
                  status: 'failure',
                  error: error instanceof Error ? error.message : 'Unknown error',
                  execution_time: executionTime
                }
              : result
          ));
          break;
        }
      }
    } catch (error) {
      console.error('Chain execution error:', error);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  };

  return {
    // State
    chains,
    steps,
    conditions,
    variables,
    loading,
    selectedChain,
    executionResults,
    isExecuting,
    
    // Actions
    setSelectedChain,
    fetchData,
    fetchChainSteps,
    createChain,
    updateChain,
    deleteChain,
    createStep,
    updateStep,
    deleteStep,
    executeChain,
    setExecutionResults
  };
};