import React from 'react';
import { ExecutionResult } from '../hooks/useChainManager';

interface ExecutionResultsProps {
  isVisible: boolean;
  onClose: () => void;
  results: ExecutionResult[];
  isExecuting: boolean;
}

const getStatusIcon = (status: ExecutionResult['status']) => {
  switch (status) {
    case 'success':
      return '✅';
    case 'failure':
      return '❌';
    case 'timeout':
      return '⏰';
    case 'running':
      return '🔄';
    default:
      return '❓';
  }
};

const getStatusColor = (status: ExecutionResult['status']) => {
  switch (status) {
    case 'success':
      return 'text-green-600 bg-green-50';
    case 'failure':
      return 'text-red-600 bg-red-50';
    case 'timeout':
      return 'text-yellow-600 bg-yellow-50';
    case 'running':
      return 'text-blue-600 bg-blue-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const formatExecutionTime = (ms: number) => {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
};

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString();
};

export const ExecutionResults: React.FC<ExecutionResultsProps> = ({
  isVisible,
  onClose,
  results,
  isExecuting
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-800">
              Execution Results
            </h2>
            {isExecuting && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">Executing...</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No execution results yet.</p>
            <p className="text-sm mt-2">Execute a chain to see results here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={`${result.step_id}-${index}`}
                className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getStatusIcon(result.status)}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{result.step_name}</h3>
                      <p className="text-sm opacity-75">
                        Status: {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm opacity-75">
                    <p>Execution Time: {formatExecutionTime(result.execution_time)}</p>
                    <p>Timestamp: {formatTimestamp(result.timestamp)}</p>
                  </div>
                </div>

                {result.output && (
                  <div className="mt-3">
                    <h4 className="font-medium mb-2">Output:</h4>
                    <div className="bg-white bg-opacity-50 rounded p-3 font-mono text-sm whitespace-pre-wrap">
                      {result.output}
                    </div>
                  </div>
                )}

                {result.error && (
                  <div className="mt-3">
                    <h4 className="font-medium mb-2 text-red-700">Error:</h4>
                    <div className="bg-red-100 border border-red-300 rounded p-3 font-mono text-sm text-red-800">
                      {result.error}
                    </div>
                  </div>
                )}

                {result.status === 'running' && (
                  <div className="mt-3">
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-sm">Step is currently executing...</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                Total Steps: {results.length}
              </span>
              <span>
                Success Rate: {results.length > 0 
                  ? Math.round((results.filter(r => r.status === 'success').length / results.filter(r => r.status !== 'running').length) * 100) 
                  : 0}%
              </span>
              <span>
                Total Time: {formatExecutionTime(
                  results.reduce((total, result) => total + result.execution_time, 0)
                )}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};