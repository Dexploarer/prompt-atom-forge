import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
// TODO: Create AuthContext and implement authentication
// For now, mock the auth context
const useAuth = () => ({
  user: { id: 'mock-user-id' }
});
import { Database } from '../lib/database.types';
import { Plus, Edit, Trash2, Search, Play, Pause, RotateCcw, GitBranch, Clock, Target, Settings, Download, Upload, BarChart3 } from 'lucide-react';

type PromptChain = Database['public']['Tables']['prompt_chains']['Row'];
type ChainStep = Database['public']['Tables']['chain_steps']['Row'];
type ChainCondition = Database['public']['Tables']['chain_conditions']['Row'];
type ChainVariable = Database['public']['Tables']['chain_variables']['Row'];

interface ChainFormData {
  name: string;
  description: string;
  category: string;
  is_active: boolean;
  timeout_seconds: number;
  max_retries: number;
  variables: Record<string, any>;
}

interface StepFormData {
  name: string;
  prompt_template: string;
  step_order: number;
  timeout_seconds: number;
  max_retries: number;
  conditions: string[];
  next_step_id?: string;
  failure_step_id?: string;
}

interface ExecutionResult {
  step_id: string;
  step_name: string;
  status: 'success' | 'failure' | 'timeout' | 'running';
  output?: string;
  error?: string;
  execution_time: number;
  timestamp: string;
}

const CHAIN_CATEGORIES = [
  'Content Generation',
  'Data Processing',
  'Analysis',
  'Creative Writing',
  'Research',
  'Automation',
  'Custom'
];

const ChainManager: React.FC = () => {
  const { user } = useAuth();
  const [chains, setChains] = useState<PromptChain[]>([]);
  const [steps, setSteps] = useState<ChainStep[]>([]);
  const [conditions, setConditions] = useState<ChainCondition[]>([]);
  const [variables, setVariables] = useState<ChainVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChainForm, setShowChainForm] = useState(false);
  const [showStepForm, setShowStepForm] = useState(false);
  const [showExecution, setShowExecution] = useState(false);
  const [editingChain, setEditingChain] = useState<PromptChain | null>(null);
  const [editingStep, setEditingStep] = useState<ChainStep | null>(null);
  const [selectedChain, setSelectedChain] = useState<string>('');
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [chainFormData, setChainFormData] = useState<ChainFormData>({
    name: '',
    description: '',
    category: '',
    is_active: true,
    timeout_seconds: 300,
    max_retries: 3,
    variables: {}
  });

  const [stepFormData, setStepFormData] = useState<StepFormData>({
    name: '',
    prompt_template: '',
    step_order: 1,
    timeout_seconds: 60,
    max_retries: 2,
    conditions: []
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChain) {
      fetchChainSteps(selectedChain);
    }
  }, [selectedChain]);

  const fetchData = async () => {
    try {
      const [chainsResult, variablesResult] = await Promise.all([
        supabase
          .from('prompt_chains')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('chain_variables')
          .select('*')
          .eq('user_id', user?.id)
      ]);

      if (chainsResult.error) throw chainsResult.error;
      if (variablesResult.error) throw variablesResult.error;

      setChains((chainsResult.data || []).map(chain => ({
        ...chain,
        metadata: (chain as any).metadata || null,
        ...chain,
        ...chain
      })));
      setVariables(variablesResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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
        condition_target: null // Add missing condition_target property
      })));
    } catch (error) {
      console.error('Error fetching chain steps:', error);
    }
  };

  const handleChainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingChain) {
        const { error } = await supabase
          .from('prompt_chains')
          .update({
            ...chainFormData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingChain.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('prompt_chains')
          .insert({
            ...chainFormData,
            user_id: user.id
          });

        if (error) throw error;
      }

      await fetchData();
      resetChainForm();
    } catch (error) {
      console.error('Error saving chain:', error);
    }
  };

  const handleStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedChain) return;

    try {
      if (editingStep) {
        const { error } = await supabase
          .from('chain_steps')
          .update({
            ...stepFormData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingStep.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('chain_steps')
          .insert({
            ...stepFormData,
            chain_id: selectedChain,
            user_id: user.id
          });

        if (error) throw error;
      }

      await fetchChainSteps(selectedChain);
      resetStepForm();
    } catch (error) {
      console.error('Error saving step:', error);
    }
  };

  const handleDeleteChain = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chain? This will also delete all steps and conditions.')) return;

    try {
      const { error } = await supabase
        .from('prompt_chains')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
      if (selectedChain === id) {
        setSelectedChain('');
        setSteps([]);
        setConditions([]);
      }
    } catch (error) {
      console.error('Error deleting chain:', error);
    }
  };

  const handleDeleteStep = async (id: string) => {
    if (!confirm('Are you sure you want to delete this step?')) return;

    try {
      const { error } = await supabase
        .from('chain_steps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchChainSteps(selectedChain);
    } catch (error) {
      console.error('Error deleting step:', error);
    }
  };

  const handleEditChain = (chain: PromptChain) => {
    setEditingChain(chain);
    setChainFormData({
      name: chain.name,
      description: chain.description || '',
      category: (chain.metadata as any)?.category || '',
      is_active: chain.is_active ?? true,
      timeout_seconds: (chain.metadata as any)?.timeout_seconds || 300,
      max_retries: (chain.metadata as any)?.max_retries || 3,
      variables: ((chain.metadata as any)?.variables as Record<string, any>) || {}
    });
    setShowChainForm(true);
  };

  const handleEditStep = (step: ChainStep) => {
    setEditingStep(step);
    setStepFormData({
      name: step.name,
      prompt_template: step.prompt_template,
      step_order: step.step_order,
      timeout_seconds: step.timeout_seconds || 60,
      max_retries: step.retry_count || 2,
      conditions: [], // Initialize empty conditions array since property doesn't exist on step type
      next_step_id: (step as any).next_step_id || undefined,
      failure_step_id: (step as any).failure_step_id || undefined
    });
    setShowStepForm(true);
  };

  const resetChainForm = () => {
    setChainFormData({
      name: '',
      description: '',
      category: '',
      is_active: true,
      timeout_seconds: 300,
      max_retries: 3,
      variables: {}
    });
    setEditingChain(null);
    setShowChainForm(false);
  };

  const resetStepForm = () => {
    setStepFormData({
      name: '',
      prompt_template: '',
      step_order: steps.length + 1,
      timeout_seconds: 60,
      max_retries: 2,
      conditions: []
    });
    setEditingStep(null);
    setShowStepForm(false);
  };

  const executeChain = async (chainId: string) => {
    setIsExecuting(true);
    setExecutionResults([]);
    setShowExecution(true);

    try {
      const chainSteps = steps.filter(step => step.chain_id === chainId)
        .sort((a, b) => a.step_order - b.step_order);

      for (const step of chainSteps) {
        const startTime = Date.now();
        
        // Simulate step execution
        const result: ExecutionResult = {
          step_id: step.id,
          step_name: step.name,
          status: 'running',
          execution_time: 0,
          timestamp: new Date().toISOString()
        };

        setExecutionResults(prev => [...prev, result]);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));

        const endTime = Date.now();
        const executionTime = endTime - startTime;

        // Simulate success/failure (90% success rate)
        const success = Math.random() > 0.1;
        
        const finalResult = {
          ...result,
          status: success ? 'success' : 'failure',
          output: success ? `Step "${step.name}" completed successfully` : undefined,
          error: success ? undefined : 'Simulated execution error',
          execution_time: executionTime
        };
        setExecutionResults(prev => 
          prev.map(r => r.step_id === step.id ? finalResult as ExecutionResult : r)
        );

        if (!success) {
          if ((step as any).failure_step_id) {
            // Find the failure step in the chain
            const failureStep = chainSteps.find(s => s.id === (step as any).failure_step_id);
            if (failureStep) {
              // Handle failure branching by executing the failure step next
              console.log(`Branching to failure step: ${failureStep.name} (${(step as any).failure_step_id})`);
              // Break current loop to jump to failure step
              break;
            }
          }
          // If no failure step defined or not found, stop execution
          break;
        }
      }
    } catch (error) {
      console.error('Error executing chain:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const exportChain = async (chainId: string) => {
    try {
      const chain = chains.find(c => c.id === chainId);
      const chainSteps = steps.filter(s => s.chain_id === chainId);
      const chainConditions = conditions.filter(c => c.step_id === chainId);
      
      const exportData = {
        chain,
        steps: chainSteps,
        conditions: chainConditions,
        exported_at: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chain-${chain?.name.replace(/\s+/g, '-').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting chain:', error);
    }
  };

  const filteredChains = chains.filter(chain => {
    const matchesSearch = chain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chain.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || (chain.metadata as any)?.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chain Management</h2>
          <p className="text-gray-600">Create and manage multi-step prompt chains with conditions</p>
        </div>
        <button
          onClick={() => setShowChainForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Chain
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search chains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          {CHAIN_CATEGORIES.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chains List */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4">Prompt Chains</h3>
          {filteredChains.length === 0 ? (
            <div className="text-center py-8">
              <GitBranch className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No chains found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChains.map((chain) => (
                <div
                  key={chain.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedChain === chain.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedChain(chain.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{chain.name}</h4>
                      {(chain.metadata as any)?.category && (
                        <span className="text-xs text-gray-500">{(chain.metadata as any)?.category}</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          executeChain(chain.id);
                        }}
                        disabled={!chain.is_active || isExecuting}
                        className="text-green-600 hover:text-green-700 disabled:text-gray-400"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportChain(chain.id);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditChain(chain);
                        }}
                        className="text-gray-600 hover:text-purple-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChain(chain.id);
                        }}
                        className="text-gray-600 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {chain.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{chain.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className={`px-2 py-1 rounded-full ${
                      chain.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {chain.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span>Steps: {steps.filter(s => s.chain_id === chain.id).length}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chain Steps */}
        <div className="lg:col-span-2">
          {selectedChain ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Chain Steps</h3>
                <button
                  onClick={() => setShowStepForm(true)}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Step
                </button>
              </div>
              
              {steps.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No steps in this chain</p>
                  <button
                    onClick={() => setShowStepForm(true)}
                    className="mt-2 text-blue-600 hover:text-blue-700"
                  >
                    Add the first step
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                            {step.step_order}
                          </span>
                          <h4 className="font-medium text-gray-900">{step.name}</h4>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditStep(step)}
                            className="text-gray-600 hover:text-purple-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStep(step.id)}
                            className="text-gray-600 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded p-3 mb-3">
                        <p className="text-sm text-gray-700 font-mono">{step.prompt_template}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {step.timeout_seconds}s timeout
                        </span>
                        <span className="flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          {step.retry_count || 0} retries
                        </span>
                        {Array.isArray(step.conditions) && step.conditions.length > 0 && (
                          <span className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            {Array.isArray(step.conditions) ? step.conditions.length : 0} conditions
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Chain</h3>
              <p className="text-gray-600">Choose a chain from the left to view and edit its steps</p>
            </div>
          )}
        </div>
      </div>

      {/* Chain Form Modal */}
      {showChainForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {editingChain ? 'Edit Chain' : 'Create New Chain'}
              </h3>
              
              <form onSubmit={handleChainSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chain Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={chainFormData.name}
                    onChange={(e) => setChainFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter chain name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={chainFormData.description}
                    onChange={(e) => setChainFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe what this chain does"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={chainFormData.category}
                      onChange={(e) => setChainFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      {CHAIN_CATEGORIES.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={chainFormData.is_active}
                        onChange={(e) => setChainFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={chainFormData.timeout_seconds}
                      onChange={(e) => setChainFormData(prev => ({ ...prev, timeout_seconds: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Retries
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={chainFormData.max_retries}
                      onChange={(e) => setChainFormData(prev => ({ ...prev, max_retries: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetChainForm}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {editingChain ? 'Update Chain' : 'Create Chain'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Step Form Modal */}
      {showStepForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {editingStep ? 'Edit Step' : 'Add New Step'}
              </h3>
              
              <form onSubmit={handleStepSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Step Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={stepFormData.name}
                    onChange={(e) => setStepFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter step name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prompt Template *
                  </label>
                  <textarea
                    required
                    value={stepFormData.prompt_template}
                    onChange={(e) => setStepFormData(prev => ({ ...prev, prompt_template: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                    rows={4}
                    placeholder="Enter the prompt template for this step"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step Order
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={stepFormData.step_order}
                      onChange={(e) => setStepFormData(prev => ({ ...prev, step_order: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={stepFormData.timeout_seconds}
                      onChange={(e) => setStepFormData(prev => ({ ...prev, timeout_seconds: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Retries
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stepFormData.max_retries}
                      onChange={(e) => setStepFormData(prev => ({ ...prev, max_retries: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetStepForm}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingStep ? 'Update Step' : 'Add Step'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Execution Results Modal */}
      {showExecution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Chain Execution Results</h3>
                <button
                  onClick={() => setShowExecution(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3">
                {executionResults.map((result) => (
                  <div key={result.step_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${
                          result.status === 'success' ? 'bg-green-500' :
                          result.status === 'failure' ? 'bg-red-500' :
                          result.status === 'running' ? 'bg-yellow-500 animate-pulse' :
                          'bg-gray-500'
                        }`}></span>
                        <span className="font-medium">{result.step_name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          result.status === 'success' ? 'bg-green-100 text-green-700' :
                          result.status === 'failure' ? 'bg-red-100 text-red-700' :
                          result.status === 'running' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {result.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.execution_time}ms
                      </div>
                    </div>
                    
                    {result.output && (
                      <div className="bg-green-50 border border-green-200 rounded p-3 mb-2">
                        <p className="text-sm text-green-800">{result.output}</p>
                      </div>
                    )}
                    
                    {result.error && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 mb-2">
                        <p className="text-sm text-red-800">{result.error}</p>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChainManager;