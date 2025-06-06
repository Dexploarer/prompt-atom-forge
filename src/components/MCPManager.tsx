import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/use-auth';
import { Server, Settings, Play, Pause, Download, Upload, Package, CheckCircle, AlertCircle, Clock, Database, Wifi, Globe, HardDrive, FileText, Code, Terminal, Zap } from 'lucide-react';

interface MCPServer {
  id: string;
  name: string;
  description: string;
  transport: 'STDIO' | 'SSE' | 'HTTP';
  storage: 'Memory' | 'File' | 'Database';
  status: 'active' | 'inactive' | 'deploying' | 'error';
  config: Record<string, any>;
  template: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface ServerTemplate {
  id: string;
  name: string;
  description: string;
  transport: 'STDIO' | 'SSE' | 'HTTP';
  storage: 'Memory' | 'File' | 'Database';
  config: Record<string, any>;
  code_template: string;
}

interface ServerFormData {
  name: string;
  description: string;
  transport: 'STDIO' | 'SSE' | 'HTTP';
  storage: 'Memory' | 'File' | 'Database';
  template: string;
  config: Record<string, any>;
}

const SERVER_TEMPLATES: ServerTemplate[] = [
  {
    id: 'basic-stdio',
    name: 'Basic STDIO Server',
    description: 'Simple MCP server using STDIO transport',
    transport: 'STDIO',
    storage: 'Memory',
    config: {
      port: 3000,
      timeout: 30000,
      maxConnections: 100
    },
    code_template: `#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

class BasicMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: '{{name}}',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.setupTools();
  }

  setupTools() {
    // Add your tools here
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'example_tool',
            description: 'An example tool',
            inputSchema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Message to process'
                }
              },
              required: ['message']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;
      
      if (name === 'example_tool') {
        return {
          content: [
            {
              type: 'text',
              text: \`Processed: \${args.message}\`
            }
          ]
        };
      }
      
      throw new Error(\`Unknown tool: \${name}\`);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new BasicMCPServer();
server.run().catch(console.error);`
  },
  {
    id: 'http-api',
    name: 'HTTP API Server',
    description: 'MCP server with HTTP transport for web integration',
    transport: 'HTTP',
    storage: 'Database',
    config: {
      port: 8080,
      host: 'localhost',
      cors: true,
      rateLimit: 100
    },
    code_template: `#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');

class HTTPMCPServer {
  constructor() {
    this.app = express();
    this.server = new Server(
      {
        name: '{{name}}',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupTools();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    this.app.post('/mcp', async (req, res) => {
      try {
        const transport = new SSEServerTransport('/mcp/sse', res);
        await this.server.connect(transport);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  setupTools() {
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'http_request',
            description: 'Make HTTP requests',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
                headers: { type: 'object' },
                body: { type: 'string' }
              },
              required: ['url', 'method']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;
      
      if (name === 'http_request') {
        // Implement HTTP request logic
        return {
          content: [
            {
              type: 'text',
              text: \`HTTP \${args.method} request to \${args.url}\`
            }
          ]
        };
      }
      
      throw new Error(\`Unknown tool: \${name}\`);
    });
  }

  start(port = {{port}}) {
    this.app.listen(port, () => {
      console.log(\`MCP HTTP Server running on port \${port}\`);
    });
  }
}

const server = new HTTPMCPServer();
server.start();`
  },
  {
    id: 'file-processor',
    name: 'File Processing Server',
    description: 'MCP server for file operations and processing',
    transport: 'STDIO',
    storage: 'File',
    config: {
      workingDirectory: './workspace',
      maxFileSize: '10MB',
      allowedExtensions: ['.txt', '.json', '.csv', '.md']
    },
    code_template: `#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

class FileProcessorMCPServer {
  constructor() {
    this.workingDir = '{{workingDirectory}}';
    this.server = new Server(
      {
        name: '{{name}}',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );
    
    this.setupTools();
    this.setupResources();
  }

  setupTools() {
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'read_file',
            description: 'Read file contents',
            inputSchema: {
              type: 'object',
              properties: {
                filepath: { type: 'string', description: 'Path to the file' }
              },
              required: ['filepath']
            }
          },
          {
            name: 'write_file',
            description: 'Write content to file',
            inputSchema: {
              type: 'object',
              properties: {
                filepath: { type: 'string', description: 'Path to the file' },
                content: { type: 'string', description: 'Content to write' }
              },
              required: ['filepath', 'content']
            }
          },
          {
            name: 'list_files',
            description: 'List files in directory',
            inputSchema: {
              type: 'object',
              properties: {
                directory: { type: 'string', description: 'Directory path' }
              },
              required: ['directory']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case 'read_file': {
            const fullPath = path.join(this.workingDir, args.filepath);
            const content = await fs.readFile(fullPath, 'utf8');
            return {
              content: [
                {
                  type: 'text',
                  text: content
                }
              ]
            };
          }
          
          case 'write_file': {
            const fullPath = path.join(this.workingDir, args.filepath);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, args.content, 'utf8');
            return {
              content: [
                {
                  type: 'text',
                  text: \`File written successfully: \${args.filepath}\`
                }
              ]
            };
          }
          
          case 'list_files': {
            const fullPath = path.join(this.workingDir, args.directory);
            const files = await fs.readdir(fullPath);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(files, null, 2)
                }
              ]
            };
          }
          
          default:
            throw new Error(\`Unknown tool: \${name}\`);
        }
      } catch (error) {
        throw new Error(\`Tool execution failed: \${error.message}\`);
      }
    });
  }

  setupResources() {
    this.server.setRequestHandler('resources/list', async () => {
      return {
        resources: [
          {
            uri: 'file://workspace',
            name: 'Workspace Directory',
            description: 'Access to workspace files',
            mimeType: 'inode/directory'
          }
        ]
      };
    });
  }

  async run() {
    // Ensure working directory exists
    await fs.mkdir(this.workingDir, { recursive: true });
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new FileProcessorMCPServer();
server.run().catch(console.error);`
  }
];

const MCPManager: React.FC = () => {
  const { user } = useAuth();
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showServerForm, setShowServerForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServer | null>(null);
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ServerTemplate | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTransport, setFilterTransport] = useState('');
  const [filterStorage, setFilterStorage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [serverFormData, setServerFormData] = useState<ServerFormData>({
    name: '',
    description: '',
    transport: 'STDIO',
    storage: 'Memory',
    template: '',
    config: {}
  });

  useEffect(() => {
    if (user) {
      fetchServers();
    }
  }, [user]);

  const fetchServers = async () => {
    try {
      // Since we don't have MCP servers table in the schema yet,
      // we'll simulate with local storage for now
      const storedServers = localStorage.getItem(`mcp_servers_${user?.id}`);
      if (storedServers) {
        setServers(JSON.parse(storedServers));
      }
    } catch (error) {
      console.error('Error fetching servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveServers = (updatedServers: MCPServer[]) => {
    localStorage.setItem(`mcp_servers_${user?.id}`, JSON.stringify(updatedServers));
    setServers(updatedServers);
  };

  const generateServerCode = (template: ServerTemplate, formData: ServerFormData) => {
    let code = template.code_template;
    
    // Replace template variables
    code = code.replace(/{{name}}/g, formData.name);
    code = code.replace(/{{description}}/g, formData.description);
    
    // Replace config values
    Object.entries(formData.config).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      code = code.replace(regex, String(value));
    });
    
    return code;
  };

  const handleTemplateSelect = (template: ServerTemplate) => {
    setSelectedTemplate(template);
    setServerFormData(prev => ({
      ...prev,
      transport: template.transport,
      storage: template.storage,
      template: template.id,
      config: { ...template.config }
    }));
    setShowTemplates(false);
  };

  const handleServerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTemplate) return;

    try {
      const newServer: MCPServer = {
        id: editingServer?.id || `mcp_${Date.now()}`,
        ...serverFormData,
        status: 'inactive',
        created_at: editingServer?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id
      };

      const updatedServers = editingServer
        ? servers.map(s => s.id === editingServer.id ? newServer : s)
        : [...servers, newServer];

      saveServers(updatedServers);
      
      // Generate code
      const code = generateServerCode(selectedTemplate, serverFormData);
      setGeneratedCode(code);
      setShowCode(true);
      
      resetServerForm();
    } catch (error) {
      console.error('Error saving server:', error);
    }
  };

  const handleDeleteServer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this MCP server?')) return;

    const updatedServers = servers.filter(s => s.id !== id);
    saveServers(updatedServers);
  };

  const handleEditServer = (server: MCPServer) => {
    setEditingServer(server);
    setServerFormData({
      name: server.name,
      description: server.description,
      transport: server.transport,
      storage: server.storage,
      template: server.template,
      config: server.config
    });
    
    const template = SERVER_TEMPLATES.find(t => t.id === server.template);
    if (template) {
      setSelectedTemplate(template);
    }
    
    setShowServerForm(true);
  };

  const handleToggleServer = async (id: string) => {
    const server = servers.find(s => s.id === id);
    if (!server) return;

    const newStatus = server.status === 'active' ? 'inactive' : 'active';
    const updatedServers = servers.map(s => 
      s.id === id ? { ...s, status: newStatus, updated_at: new Date().toISOString() } : s
    );
    
saveServers(updatedServers as MCPServer[]);
  };

  const handleDeployServer = async (id: string) => {
    const server = servers.find(s => s.id === id);
    if (!server) return;

    // Simulate deployment
    const updatedServers = servers.map(s => 
      s.id === id ? { ...s, status: 'deploying' as const, updated_at: new Date().toISOString() } : s
    );
    saveServers(updatedServers);

    // Simulate deployment time
    setTimeout(() => {
      const finalServers = servers.map(s => 
        s.id === id ? { ...s, status: 'active' as const, updated_at: new Date().toISOString() } : s
      );
      saveServers(finalServers);
    }, 3000);
  };

  const handleExportServer = (server: MCPServer) => {
    const template = SERVER_TEMPLATES.find(t => t.id === server.template);
    if (!template) return;

    const code = generateServerCode(template, server);
    const exportData = {
      server,
      code,
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcp-server-${server.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePackageServer = (server: MCPServer) => {
    const template = SERVER_TEMPLATES.find(t => t.id === server.template);
    if (!template) return;

    const code = generateServerCode(template, server);
    const packageJson = {
      name: server.name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: server.description,
      main: 'index.js',
      scripts: {
        start: 'node index.js',
        dev: 'nodemon index.js'
      },
      dependencies: {
        '@modelcontextprotocol/sdk': '^1.0.0'
      }
    };

    if (server.transport === 'HTTP') {
      (packageJson.dependencies as Record<string, string>)['express'] = '^4.18.0';
      (packageJson.dependencies as Record<string, string>)['cors'] = '^2.8.5';
    }

    const files = {
      'package.json': JSON.stringify(packageJson, null, 2),
      'index.js': code,
      'README.md': `# ${server.name}\n\n${server.description}\n\n## Installation\n\n\`\`\`bash\nnpm install\n\`\`\`\n\n## Usage\n\n\`\`\`bash\nnpm start\n\`\`\``,
      '.gitignore': 'node_modules/\n.env\n*.log'
    };

    // Create a simple zip-like structure (for demo purposes)
    const packageData = {
      name: server.name,
      files,
      created_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(packageData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcp-server-package-${server.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetServerForm = () => {
    setServerFormData({
      name: '',
      description: '',
      transport: 'STDIO',
      storage: 'Memory',
      template: '',
      config: {}
    });
    setEditingServer(null);
    setSelectedTemplate(null);
    setShowServerForm(false);
  };

  const getStatusIcon = (status: MCPServer['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <Pause className="w-4 h-4 text-gray-500" />;
      case 'deploying':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Pause className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransportIcon = (transport: string) => {
    switch (transport) {
      case 'STDIO':
        return <Terminal className="w-4 h-4" />;
      case 'SSE':
        return <Wifi className="w-4 h-4" />;
      case 'HTTP':
        return <Globe className="w-4 h-4" />;
      default:
        return <Server className="w-4 h-4" />;
    }
  };

  const getStorageIcon = (storage: string) => {
    switch (storage) {
      case 'Memory':
        return <Zap className="w-4 h-4" />;
      case 'File':
        return <HardDrive className="w-4 h-4" />;
      case 'Database':
        return <Database className="w-4 h-4" />;
      default:
        return <HardDrive className="w-4 h-4" />;
    }
  };

  const filteredServers = servers.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTransport = !filterTransport || server.transport === filterTransport;
    const matchesStorage = !filterStorage || server.storage === filterStorage;
    const matchesStatus = !filterStatus || server.status === filterStatus;
    
    return matchesSearch && matchesTransport && matchesStorage && matchesStatus;
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
          <h2 className="text-2xl font-bold text-gray-900">MCP Server Management</h2>
          <p className="text-gray-600">Generate, configure, and deploy Model Context Protocol servers</p>
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
            onClick={() => setShowServerForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Server className="w-4 h-4" />
            New Server
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search servers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterTransport}
          onChange={(e) => setFilterTransport(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">All Transports</option>
          <option value="STDIO">STDIO</option>
          <option value="SSE">SSE</option>
          <option value="HTTP">HTTP</option>
        </select>
        
        <select
          value={filterStorage}
          onChange={(e) => setFilterStorage(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">All Storage</option>
          <option value="Memory">Memory</option>
          <option value="File">File</option>
          <option value="Database">Database</option>
        </select>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="deploying">Deploying</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Servers Grid */}
      {filteredServers.length === 0 ? (
        <div className="text-center py-12">
          <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No MCP Servers</h3>
          <p className="text-gray-600 mb-4">Create your first MCP server to get started</p>
          <button
            onClick={() => setShowServerForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Create Server
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServers.map((server) => (
            <div key={server.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(server.status)}
                  <h3 className="font-semibold text-gray-900">{server.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleToggleServer(server.id)}
                    disabled={server.status === 'deploying'}
                    className={`p-1 rounded ${
                      server.status === 'active'
                        ? 'text-red-600 hover:text-red-700'
                        : 'text-green-600 hover:text-green-700'
                    } disabled:text-gray-400`}
                  >
                    {server.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleEditServer(server)}
                    className="p-1 text-gray-600 hover:text-purple-600"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{server.description}</p>
              
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  {getTransportIcon(server.transport)}
                  <span>{server.transport}</span>
                </div>
                <div className="flex items-center gap-1">
                  {getStorageIcon(server.storage)}
                  <span>{server.storage}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeployServer(server.id)}
                  disabled={server.status === 'deploying'}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  Deploy
                </button>
                <button
                  onClick={() => handleExportServer(server)}
                  className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Export
                </button>
                <button
                  onClick={() => handlePackageServer(server)}
                  className="bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700 transition-colors flex items-center gap-1"
                >
                  <Package className="w-3 h-3" />
                  Package
                </button>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Created: {new Date(server.created_at).toLocaleDateString()}</span>
                  <button
                    onClick={() => handleDeleteServer(server.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Server Templates</h3>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SERVER_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getTransportIcon(template.transport)}
                      <h4 className="font-semibold">{template.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        {getTransportIcon(template.transport)}
                        {template.transport}
                      </span>
                      <span className="flex items-center gap-1">
                        {getStorageIcon(template.storage)}
                        {template.storage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Server Form Modal */}
      {showServerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {editingServer ? 'Edit Server' : 'Create New Server'}
              </h3>
              
              {!selectedTemplate && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Please select a template first to configure your server.
                  </p>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="mt-2 text-sm text-yellow-900 underline"
                  >
                    Choose Template
                  </button>
                </div>
              )}
              
              <form onSubmit={handleServerSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Server Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={serverFormData.name}
                    onChange={(e) => setServerFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter server name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={serverFormData.description}
                    onChange={(e) => setServerFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe what this server does"
                  />
                </div>

                {selectedTemplate && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Selected Template: {selectedTemplate.name}</h4>
                      <p className="text-sm text-blue-800">{selectedTemplate.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Transport
                        </label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                          {getTransportIcon(serverFormData.transport)}
                          <span>{serverFormData.transport}</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Storage
                        </label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                          {getStorageIcon(serverFormData.storage)}
                          <span>{serverFormData.storage}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Configuration
                      </label>
                      <div className="space-y-2">
                        {Object.entries(serverFormData.config).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <input
                              type="text"
                              value={key}
                              readOnly
                              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                            />
                            <input
                              type="text"
                              value={String(value)}
                              onChange={(e) => {
                                const newConfig = { ...serverFormData.config };
                                newConfig[key] = e.target.value;
                                setServerFormData(prev => ({ ...prev, config: newConfig }));
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetServerForm}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedTemplate}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                  >
                    {editingServer ? 'Update Server' : 'Create Server'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Generated Code Modal */}
      {showCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Generated Server Code</h3>
                <button
                  onClick={() => setShowCode(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
                  <code>{generatedCode}</code>
                </pre>
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Code className="w-4 h-4" />
                  Copy Code
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([generatedCode], { type: 'text/javascript' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'index.js';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCPManager;