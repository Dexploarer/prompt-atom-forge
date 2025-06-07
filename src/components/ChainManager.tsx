import React, { useState } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useChainManager, ChainFormData, StepFormData } from '../hooks/useChainManager';
import { ChainForm } from './ChainForm';
import { StepForm } from './StepForm';
import { ExecutionResults } from './ExecutionResults';

const CHAIN_CATEGORIES = [
  'All Categories',
  'Content Generation',
  'Data Processing',
  'Analysis',
  'Creative Writing',
  'Research',
  'Customer Service',
  'Education',
  'Marketing',
  'Development',
  'Other'
];

export const ChainManager: React.FC = () => {
  const { user } = useAuth();
  const {
    chains,
    steps,
    loading,
    selectedChain,
    executionResults,
    isExecuting,
    setSelectedChain,
    createChain,
    updateChain,
    deleteChain,
    createStep,
    updateStep,
    deleteStep,
    executeChain
  } = useChainManager(user?.id);

  // UI State
  const [showChainForm, setShowChainForm] = useState(false);
  const [showStepForm, setShowStepForm] = useState(false);
  const [showExecutionResults, setShowExecutionResults] = useState(false);
  const [editingChain, setEditingChain] = useState<string>('');
  const [editingStep, setEditingStep] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Filtered data
  const filteredChains = chains.filter(chain => {
    const matchesSearch = chain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (chain.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || (chain.metadata as { category?: string })?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedChainData = chains.find(c => c.id === selectedChain);
  const chainSteps = steps.filter(s => s.chain_id === selectedChain).sort((a, b) => a.step_order - b.step_order);

  // Event handlers
  const handleCreateChain = () => {
    setEditingChain('');
    setShowChainForm(true);
  };

  const handleEditChain = (chainId: string) => {
    setEditingChain(chainId);
    setShowChainForm(true);
  };

  const handleDeleteChain = async (chainId: string) => {
    if (window.confirm('Are you sure you want to delete this chain? This action cannot be undone.')) {
      try {
        await deleteChain(chainId);
        if (selectedChain === chainId) {
          setSelectedChain('');
        }
      } catch (error) {
        alert('Failed to delete chain: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  const handleChainSubmit = async (formData: ChainFormData) => {
    if (editingChain) {
      await updateChain(editingChain, formData);
    } else {
      await createChain(formData);
    }
  };

  const handleCreateStep = () => {
    if (!selectedChain) {
      alert('Please select a chain first');
      return;
    }
    setEditingStep('');
    setShowStepForm(true);
  };

  const handleEditStep = (stepId: string) => {
    setEditingStep(stepId);
    setShowStepForm(true);
  };

  const handleDeleteStep = async (stepId: string) => {
    if (window.confirm('Are you sure you want to delete this step?')) {
      try {
        await deleteStep(stepId);
      } catch (error) {
        alert('Failed to delete step: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  const handleStepSubmit = async (formData: StepFormData) => {
    if (!selectedChain) return;
    
    if (editingStep) {
      await updateStep(editingStep, formData);
    } else {
      await createStep(selectedChain, formData);
    }
  };

  const handleExecuteChain = async (chainId: string) => {
    try {
      setShowExecutionResults(true);
      await executeChain(chainId);
    } catch (error) {
      alert('Failed to execute chain: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const getEditingChainData = (): ChainFormData | undefined => {
    if (!editingChain) return undefined;
    const chain = chains.find(c => c.id === editingChain);
    if (!chain) return undefined;
    
    return {
      name: chain.name,
      description: chain.description || '',
      category: (chain.metadata as { category?: string })?.category || '',
      is_active: chain.is_active ?? false,
      timeout_seconds: (chain.metadata as { timeout_seconds?: number })?.timeout_seconds || 30,
      max_retries: (chain.metadata as { max_retries?: number })?.max_retries || 3,
      variables: (chain.metadata as { variables?: Record<string, any> })?.variables || {}
    };
  };

  const getEditingStepData = (): StepFormData | undefined => {
    if (!editingStep) return undefined;
    const step = steps.find(s => s.id === editingStep);
    if (!step) return undefined;
    
    return {
      name: step.name,
      prompt_template: step.prompt_template,
      step_order: step.step_order,
      timeout_seconds: step.timeout_seconds || 30,
      max_retries: step.retries || 3,
      conditions: []
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Chain Manager</h1>
        <p className="text-gray-600">Create and manage prompt chains for complex AI workflows</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search chains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {CHAIN_CATEGORIES.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <button
          onClick={handleCreateChain}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          Create Chain
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chains List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Chains ({filteredChains.length})</h2>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredChains.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No chains found.</p>
                <p className="text-sm mt-1">Create your first chain to get started.</p>
              </div>
            ) : (
              filteredChains.map(chain => (
                <div
                  key={chain.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedChain === chain.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => setSelectedChain(chain.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{chain.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{chain.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded">{(chain.metadata as { category?: string })?.category || 'Uncategorized'}</span>
                        <span className={chain.is_active ? 'text-green-600' : 'text-red-600'}>
                          {chain.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExecuteChain(chain.id);
                        }}
                        disabled={!chain.is_active || isExecuting}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Execute
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditChain(chain.id);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChain(chain.id);
                        }}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Steps List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Steps {selectedChainData ? `- ${selectedChainData.name}` : ''} ({chainSteps.length})
            </h2>
            {selectedChain && (
              <button
                onClick={handleCreateStep}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Add Step
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {!selectedChain ? (
              <div className="p-6 text-center text-gray-500">
                <p>Select a chain to view its steps.</p>
              </div>
            ) : chainSteps.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No steps found for this chain.</p>
                <p className="text-sm mt-1">Add your first step to get started.</p>
              </div>
            ) : (
              chainSteps.map(step => (
                <div key={step.id} className="p-4 border-b hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">
                          Step {step.step_order}
                        </span>
                        <h3 className="font-medium text-gray-800">{step.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 font-mono bg-gray-50 p-2 rounded">
                        {step.prompt_template.length > 100 
                          ? step.prompt_template.substring(0, 100) + '...' 
                          : step.prompt_template
                        }
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Timeout: {step.timeout_seconds}s</span>
                        <span>Max Retries: {step.retries}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEditStep(step.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStep(step.id)}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Forms and Modals */}
      <ChainForm
        isVisible={showChainForm}
        onClose={() => setShowChainForm(false)}
        onSubmit={handleChainSubmit}
        initialData={getEditingChainData()}
        isEditing={!!editingChain}
      />

      <StepForm
        isVisible={showStepForm}
        onClose={() => setShowStepForm(false)}
        onSubmit={handleStepSubmit}
        initialData={getEditingStepData()}
        isEditing={!!editingStep}
        availableSteps={chainSteps.map(s => ({ id: s.id, name: s.name, step_order: s.step_order }))}
      />

      <ExecutionResults
        isVisible={showExecutionResults}
        onClose={() => setShowExecutionResults(false)}
        results={executionResults}
        isExecuting={isExecuting}
      />
    </div>
  );
};