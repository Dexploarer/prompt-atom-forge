import React, { useState } from 'react';
import { Zap, ArrowRight, Copy, Download, Save, Wand2, Target, MessageSquare, Palette, Ruler, User, FileText, Lightbulb, Settings } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';
import { supabase } from '../lib/supabase';

interface QuickPromptConfig {
  type: 'creative' | 'analytical' | 'conversational' | 'instructional' | 'technical';
  context: string;
  goal: string;
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'creative' | 'empathetic';
  length: 'brief' | 'medium' | 'detailed' | 'comprehensive';
  audience: string;
  constraints: string[];
  examples: boolean;
  format: 'paragraph' | 'bullet-points' | 'numbered-list' | 'dialogue' | 'structured';
}

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  config: Partial<QuickPromptConfig>;
  template: string;
}

const PROMPT_TYPES = [
  {
    id: 'creative',
    name: 'Creative Writing',
    description: 'For storytelling, poetry, and creative content',
    icon: Palette,
    color: 'purple'
  },
  {
    id: 'analytical',
    name: 'Analysis & Research',
    description: 'For data analysis, research, and critical thinking',
    icon: Target,
    color: 'blue'
  },
  {
    id: 'conversational',
    name: 'Conversation & Chat',
    description: 'For dialogue, Q&A, and interactive conversations',
    icon: MessageSquare,
    color: 'green'
  },
  {
    id: 'instructional',
    name: 'Instructions & Tutorials',
    description: 'For how-to guides, explanations, and teaching',
    icon: Lightbulb,
    color: 'yellow'
  },
  {
    id: 'technical',
    name: 'Technical & Code',
    description: 'For programming, technical documentation, and specs',
    icon: Settings,
    color: 'gray'
  }
];

const TONES = [
  { id: 'professional', name: 'Professional', description: 'Formal and business-appropriate' },
  { id: 'casual', name: 'Casual', description: 'Relaxed and informal' },
  { id: 'friendly', name: 'Friendly', description: 'Warm and approachable' },
  { id: 'authoritative', name: 'Authoritative', description: 'Confident and expert' },
  { id: 'creative', name: 'Creative', description: 'Imaginative and expressive' },
  { id: 'empathetic', name: 'Empathetic', description: 'Understanding and supportive' }
];

const LENGTHS = [
  { id: 'brief', name: 'Brief', description: '1-2 sentences', tokens: '10-30 tokens' },
  { id: 'medium', name: 'Medium', description: '1-2 paragraphs', tokens: '50-150 tokens' },
  { id: 'detailed', name: 'Detailed', description: '3-5 paragraphs', tokens: '200-500 tokens' },
  { id: 'comprehensive', name: 'Comprehensive', description: 'Full analysis', tokens: '500+ tokens' }
];

const FORMATS = [
  { id: 'paragraph', name: 'Paragraph', description: 'Flowing text format' },
  { id: 'bullet-points', name: 'Bullet Points', description: 'Listed items with bullets' },
  { id: 'numbered-list', name: 'Numbered List', description: 'Sequential numbered items' },
  { id: 'dialogue', name: 'Dialogue', description: 'Conversation format' },
  { id: 'structured', name: 'Structured', description: 'Headers and sections' }
];

const QUICK_TEMPLATES: PromptTemplate[] = [
  {
    id: 'blog-post',
    name: 'Blog Post Writer',
    description: 'Create engaging blog posts on any topic',
    config: {
      type: 'creative',
      tone: 'friendly',
      length: 'detailed',
      format: 'structured'
    },
    template: 'Write a {{length}} blog post about {{context}} for {{audience}}. The tone should be {{tone}} and the goal is to {{goal}}. {{#if examples}}Include relevant examples and case studies.{{/if}}'
  },
  {
    id: 'code-review',
    name: 'Code Reviewer',
    description: 'Analyze and review code for improvements',
    config: {
      type: 'technical',
      tone: 'professional',
      length: 'medium',
      format: 'bullet-points'
    },
    template: 'Review the following code for {{context}}. Focus on {{goal}} and provide {{tone}} feedback in {{format}} format. {{#if examples}}Include code examples for suggested improvements.{{/if}}'
  },
  {
    id: 'meeting-summary',
    name: 'Meeting Summarizer',
    description: 'Summarize meetings and extract action items',
    config: {
      type: 'analytical',
      tone: 'professional',
      length: 'medium',
      format: 'structured'
    },
    template: 'Summarize this meeting transcript about {{context}}. The goal is to {{goal}} for {{audience}}. Use a {{tone}} tone and {{format}} format. Focus on key decisions, action items, and next steps.'
  },
  {
    id: 'creative-story',
    name: 'Story Generator',
    description: 'Generate creative stories and narratives',
    config: {
      type: 'creative',
      tone: 'creative',
      length: 'detailed',
      format: 'paragraph'
    },
    template: 'Write a {{length}} creative story about {{context}}. The target audience is {{audience}} and the goal is to {{goal}}. Use a {{tone}} tone and {{format}} format. {{#if examples}}Include vivid descriptions and character development.{{/if}}'
  },
  {
    id: 'tutorial-guide',
    name: 'Tutorial Creator',
    description: 'Create step-by-step tutorials and guides',
    config: {
      type: 'instructional',
      tone: 'friendly',
      length: 'comprehensive',
      format: 'numbered-list'
    },
    template: 'Create a {{length}} tutorial on {{context}} for {{audience}}. The goal is to {{goal}}. Use a {{tone}} tone and {{format}} format. {{#if examples}}Include practical examples and common pitfalls to avoid.{{/if}}'
  }
];

interface QuickPromptBuilderProps {
  onPromptGenerated?: (prompt: string, config: QuickPromptConfig) => void;
  onIntegrateWithBuilder?: (prompt: string, config: QuickPromptConfig) => void;
}

const QuickPromptBuilder: React.FC<QuickPromptBuilderProps> = ({
  onPromptGenerated,
  onIntegrateWithBuilder
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<QuickPromptConfig>({
    type: 'creative',
    context: '',
    goal: '',
    tone: 'professional',
    length: 'medium',
    audience: '',
    constraints: [],
    examples: false,
    format: 'paragraph'
  });
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [customConstraint, setCustomConstraint] = useState('');
  const [saving, setSaving] = useState(false);

  const generatePrompt = () => {
    let prompt = '';
    
    // Base prompt structure based on type
    switch (config.type) {
      case 'creative':
        prompt = `Create ${config.length === 'brief' ? 'a short' : config.length === 'medium' ? 'a moderate' : config.length === 'detailed' ? 'a detailed' : 'a comprehensive'} creative piece`;
        break;
      case 'analytical':
        prompt = `Analyze and provide ${config.length === 'brief' ? 'a brief' : config.length === 'medium' ? 'a moderate' : config.length === 'detailed' ? 'a detailed' : 'a comprehensive'} analysis`;
        break;
      case 'conversational':
        prompt = `Engage in ${config.length === 'brief' ? 'a brief' : config.length === 'medium' ? 'a moderate' : config.length === 'detailed' ? 'a detailed' : 'an extensive'} conversation`;
        break;
      case 'instructional':
        prompt = `Provide ${config.length === 'brief' ? 'brief' : config.length === 'medium' ? 'clear' : config.length === 'detailed' ? 'detailed' : 'comprehensive'} instructions`;
        break;
      case 'technical':
        prompt = `Generate ${config.length === 'brief' ? 'concise' : config.length === 'medium' ? 'clear' : config.length === 'detailed' ? 'detailed' : 'comprehensive'} technical content`;
        break;
    }

    // Add context
    if (config.context) {
      prompt += ` about ${config.context}`;
    }

    // Add goal
    if (config.goal) {
      prompt += `. The goal is to ${config.goal}`;
    }

    // Add audience
    if (config.audience) {
      prompt += ` for ${config.audience}`;
    }

    // Add tone
    prompt += `. Use a ${config.tone} tone`;

    // Add format
    switch (config.format) {
      case 'bullet-points':
        prompt += ' and format the response as bullet points';
        break;
      case 'numbered-list':
        prompt += ' and format the response as a numbered list';
        break;
      case 'dialogue':
        prompt += ' and format the response as a dialogue';
        break;
      case 'structured':
        prompt += ' and use a structured format with clear headers and sections';
        break;
      default:
        prompt += ' and format the response as flowing paragraphs';
    }

    // Add constraints
    if (config.constraints.length > 0) {
      prompt += `. Important constraints: ${config.constraints.join(', ')}`;
    }

    // Add examples requirement
    if (config.examples) {
      prompt += '. Include relevant examples to illustrate your points.';
    }

    // Add length guidance
    const lengthGuidance = {
      brief: 'Keep the response concise and to the point.',
      medium: 'Provide a balanced level of detail.',
      detailed: 'Include comprehensive details and explanations.',
      comprehensive: 'Provide an exhaustive and thorough response.'
    };
    prompt += ` ${lengthGuidance[config.length]}`;

    setGeneratedPrompt(prompt);
    onPromptGenerated?.(prompt, config);
  };

  const handleTemplateSelect = (template: PromptTemplate) => {
    setConfig(prev => ({ ...prev, ...template.config }));
    setSelectedTemplate(template);
    setShowTemplates(false);
    
    // Generate prompt from template
    let prompt = template.template;
    prompt = prompt.replace(/{{context}}/g, config.context || '[CONTEXT]');
    prompt = prompt.replace(/{{goal}}/g, config.goal || '[GOAL]');
    prompt = prompt.replace(/{{audience}}/g, config.audience || '[AUDIENCE]');
    prompt = prompt.replace(/{{tone}}/g, config.tone);
    prompt = prompt.replace(/{{length}}/g, config.length);
    prompt = prompt.replace(/{{format}}/g, config.format);
    
    // Handle conditional examples
    if (config.examples) {
      prompt = prompt.replace(/\{\{#if examples\}\}(.*?)\{\{\/if\}\}/g, '$1');
    } else {
      prompt = prompt.replace(/\{\{#if examples\}\}(.*?)\{\{\/if\}\}/g, '');
    }
    
    setGeneratedPrompt(prompt);
  };

  const handleSaveAsProject = async () => {
    if (!user || !generatedPrompt) return;

    setSaving(true);
    try {
      // Create a new project with the generated prompt
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          id: crypto.randomUUID(),
          name: `Quick Prompt - ${config.type} (${new Date().toLocaleDateString()})`,
          user_id: user.id
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Create prompt blocks based on the config
      const blocks = [
        {
          id: crypto.randomUUID(),
          project_id: project.id,
          type: 'intent',
          label: 'Intent',
          value: config.goal || 'Generated from Quick Prompt Builder',
          order: 0
        },
        {
          id: crypto.randomUUID(),
          project_id: project.id,
          type: 'tone',
          label: 'Tone',
          value: config.tone,
          order: 1
        },
        {
          id: crypto.randomUUID(),
          project_id: project.id,
          type: 'context',
          label: 'Context',
          value: config.context || 'Context from Quick Prompt Builder',
          order: 2
        },
        {
          id: crypto.randomUUID(),
          project_id: project.id,
          type: 'format',
          label: 'Format',
          value: `Format: ${config.format}, Length: ${config.length}`,
          order: 3
        }
      ];

      const { error: blocksError } = await supabase
        .from('prompt_blocks')
        .insert(blocks);

      if (blocksError) throw blocksError;

      alert('Prompt saved as new project successfully!');
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addConstraint = () => {
    if (customConstraint.trim() && !config.constraints.includes(customConstraint.trim())) {
      setConfig(prev => ({
        ...prev,
        constraints: [...prev.constraints, customConstraint.trim()]
      }));
      setCustomConstraint('');
    }
  };

  const removeConstraint = (constraint: string) => {
    setConfig(prev => ({
      ...prev,
      constraints: prev.constraints.filter(c => c !== constraint)
    }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
  };

  const downloadPrompt = () => {
    const blob = new Blob([generatedPrompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quick-prompt-${config.type}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetBuilder = () => {
    setStep(1);
    setConfig({
      type: 'creative',
      context: '',
      goal: '',
      tone: 'professional',
      length: 'medium',
      audience: '',
      constraints: [],
      examples: false,
      format: 'paragraph'
    });
    setGeneratedPrompt('');
    setSelectedTemplate(null);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Choose Prompt Type';
      case 2: return 'Define Context & Goal';
      case 3: return 'Set Tone & Style';
      case 4: return 'Configure Output';
      case 5: return 'Review & Generate';
      default: return 'Quick Prompt Builder';
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return Boolean(config.type);
      case 2: return config.context !== '' && config.goal !== '';
      case 3: return Boolean(config.tone);
      case 4: return Boolean(config.length) && Boolean(config.format);
      case 5: return true;
      default: return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Quick Prompt Builder
          </h2>
          <p className="text-gray-600">Create optimized prompts in minutes with guided assistance</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Templates
          </button>
          <button
            onClick={resetBuilder}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{getStepTitle()}</span>
          <span className="text-sm text-gray-500">Step {step} of 5</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {/* Step 1: Choose Type */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">What type of prompt do you need?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PROMPT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setConfig(prev => ({ ...prev, type: type.id as any }))}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      config.type === type.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`w-6 h-6 text-${type.color}-600`} />
                      <h4 className="font-medium">{type.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Context & Goal */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Define your context and goal</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Context *
              </label>
              <textarea
                value={config.context}
                onChange={(e) => setConfig(prev => ({ ...prev, context: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                placeholder="What is the subject or topic you want to address?"
              />
              <p className="text-xs text-gray-500 mt-1">Example: "Customer service email responses" or "Python data analysis tutorial"</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Goal *
              </label>
              <textarea
                value={config.goal}
                onChange={(e) => setConfig(prev => ({ ...prev, goal: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                placeholder="What do you want to achieve with this prompt?"
              />
              <p className="text-xs text-gray-500 mt-1">Example: "Improve customer satisfaction" or "Teach beginners how to clean data"</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience
              </label>
              <input
                type="text"
                value={config.audience}
                onChange={(e) => setConfig(prev => ({ ...prev, audience: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Who is this for? (e.g., beginners, professionals, students)"
              />
            </div>
          </div>
        )}

        {/* Step 3: Tone & Style */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Choose tone and style</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tone *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TONES.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setConfig(prev => ({ ...prev, tone: tone.id as any }))}
                    className={`p-3 border rounded-lg text-left transition-all ${
                      config.tone === tone.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <h4 className="font-medium">{tone.name}</h4>
                    <p className="text-sm text-gray-600">{tone.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Constraints
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customConstraint}
                    onChange={(e) => setCustomConstraint(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addConstraint()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Add a constraint (e.g., 'No technical jargon', 'Include statistics')"
                  />
                  <button
                    onClick={addConstraint}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {config.constraints.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {config.constraints.map((constraint, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        {constraint}
                        <button
                          onClick={() => removeConstraint(constraint)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.examples}
                  onChange={(e) => setConfig(prev => ({ ...prev, examples: e.target.checked }))}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Include examples in the response</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 4: Output Configuration */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Configure output format</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Response Length *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LENGTHS.map((length) => (
                  <button
                    key={length.id}
                    onClick={() => setConfig(prev => ({ ...prev, length: length.id as any }))}
                    className={`p-3 border rounded-lg text-left transition-all ${
                      config.length === length.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">{length.name}</h4>
                      <span className="text-xs text-gray-500">{length.tokens}</span>
                    </div>
                    <p className="text-sm text-gray-600">{length.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Output Format *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {FORMATS.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setConfig(prev => ({ ...prev, format: format.id as any }))}
                    className={`p-3 border rounded-lg text-left transition-all ${
                      config.format === format.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <h4 className="font-medium">{format.name}</h4>
                    <p className="text-sm text-gray-600">{format.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Generate */}
        {step === 5 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Review your configuration</h3>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Type:</span>
                  <span className="ml-2 text-sm text-gray-900 capitalize">{config.type}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Tone:</span>
                  <span className="ml-2 text-sm text-gray-900 capitalize">{config.tone}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Length:</span>
                  <span className="ml-2 text-sm text-gray-900 capitalize">{config.length}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Format:</span>
                  <span className="ml-2 text-sm text-gray-900 capitalize">{config.format.replace('-', ' ')}</span>
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Context:</span>
                <p className="text-sm text-gray-900 mt-1">{config.context}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Goal:</span>
                <p className="text-sm text-gray-900 mt-1">{config.goal}</p>
              </div>
              
              {config.audience && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Audience:</span>
                  <span className="ml-2 text-sm text-gray-900">{config.audience}</span>
                </div>
              )}
              
              {config.constraints.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Constraints:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {config.constraints.map((constraint, index) => (
                      <span key={index} className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
                        {constraint}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={generatePrompt}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <Wand2 className="w-5 h-5" />
              Generate Prompt
            </button>

            {generatedPrompt && (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Generated Prompt:</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{generatedPrompt}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={downloadPrompt}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  {user && (
                    <button
                      onClick={handleSaveAsProject}
                      disabled={saving}
                      className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save as Project'}
                    </button>
                  )}
                  {onIntegrateWithBuilder && (
                    <button
                      onClick={() => onIntegrateWithBuilder(generatedPrompt, config)}
                      className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Use in Builder
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <button
          onClick={() => setStep(Math.min(5, step + 1))}
          disabled={step === 5 || !canProceed()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Next
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Quick Prompt Templates</h3>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {QUICK_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <h4 className="font-semibold mb-2">{template.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="capitalize">{template.config.type}</span>
                      <span className="capitalize">{template.config.tone}</span>
                      <span className="capitalize">{template.config.length}</span>
                    </div>
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

export default QuickPromptBuilder;