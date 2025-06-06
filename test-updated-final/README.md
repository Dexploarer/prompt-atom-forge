# test-updated-final

MCP Server for test-updated-final

## Features

- ✨ Prompt generation and management
- 🔧 Multiple transport protocols (stdio)
- 💾 Memory storage
- 🔐 undefined authentication
- 🚀 Easy deployment to multiple platforms

## Installation

```bash
npm install
npm run build
```

## Usage

### Local Development

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

### Transport Modes

```bash
# STDIO (for local MCP clients)
npm run start:stdio

# HTTP (for remote MCP clients)
npm run start:http
```

## Configuration

Copy `.env.example` to `.env` and configure your settings:

```bash
cp .env.example .env
```

## Available Tools

This MCP server provides the following tools:

- **create_prompt_block**: Create a new prompt block
- **build_prompt**: Build a complete prompt from blocks
- **inject_prompt**: Inject text into existing prompts
- **save_prompt**: Save prompts for later use
- **load_prompt**: Load saved prompts
- **list_prompts**: List all saved prompts
- **delete_prompt**: Delete saved prompts
- **get_block_types**: Get available block types
- **get_inject_modes**: Get available injection modes

## Deployment

### Local Deployment

```bash
npm run build
npm start
```

## License

MIT
