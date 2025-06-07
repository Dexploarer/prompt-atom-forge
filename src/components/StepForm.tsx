import React, { useState, useEffect } from 'react';
import { StepFormData } from '../hooks/useChainManager';

interface StepFormProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (data: StepFormData) => Promise<void>;
  initialData?: StepFormData | undefined;
  isEditing?: boolean;
  availableSteps?: Array<{ id: string; name: string; step_order: number }>;
}

const defaultFormData: StepFormData = {
  name: '',
  prompt_template: '',
  step_order: 1,
  timeout_seconds: 30,
  max_retries: 3,
  conditions: []
};

export const StepForm: React.FC<StepFormProps> = ({
  isVisible,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  availableSteps = []
}) => {
  const [formData, setFormData] = useState<StepFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Set default step order to be the next available
      const maxOrder = Math.max(0, ...availableSteps.map(s => s.step_order));
      setFormData({ ...defaultFormData, step_order: maxOrder + 1 });
    }
    setError('');
  }, [initialData, isVisible, availableSteps]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name.trim()) {
      setError('Step name is required');
      return;
    }

    if (!formData.prompt_template.trim()) {
      setError('Prompt template is required');
      return;
    }

    if (formData.step_order < 1) {
      setError('Step order must be at least 1');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save step');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof StepFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Edit Step' : 'Create New Step'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Step Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter step name"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prompt Template *
            </label>
            <textarea
              value={formData.prompt_template}
              onChange={(e) => handleInputChange('prompt_template', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows={6}
              placeholder="Enter the prompt template for this step. Use {{variable_name}} for variables."
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Use double curly braces for variables: {'{variable_name}'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Step Order *
              </label>
              <input
                type="number"
                value={formData.step_order}
                onChange={(e) => handleInputChange('step_order', parseInt(e.target.value) || 1)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeout (seconds)
              </label>
              <input
                type="number"
                value={formData.timeout_seconds}
                onChange={(e) => handleInputChange('timeout_seconds', parseInt(e.target.value) || 30)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="300"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Retries
              </label>
              <input
                type="number"
                value={formData.max_retries}
                onChange={(e) => handleInputChange('max_retries', parseInt(e.target.value) || 3)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="10"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Step (on success)
              </label>
              <select
                value={formData.next_step_id || ''}
                onChange={(e) => handleInputChange('next_step_id', e.target.value || undefined)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                <option value="">End chain (no next step)</option>
                {availableSteps
                  .filter(step => step.step_order !== formData.step_order)
                  .sort((a, b) => a.step_order - b.step_order)
                  .map(step => (
                    <option key={step.id} value={step.id}>
                      Step {step.step_order}: {step.name}
                    </option>
                  ))
                }
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Failure Step (on failure)
              </label>
              <select
                value={formData.failure_step_id || ''}
                onChange={(e) => handleInputChange('failure_step_id', e.target.value || undefined)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              >
                <option value="">End chain (no failure step)</option>
                {availableSteps
                  .filter(step => step.step_order !== formData.step_order)
                  .sort((a, b) => a.step_order - b.step_order)
                  .map(step => (
                    <option key={step.id} value={step.id}>
                      Step {step.step_order}: {step.name}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Step' : 'Create Step')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};