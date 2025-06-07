# Environment & AI Model Configuration

This guide explains how to configure environment variables and AI models in the Prompt or Die CLI.

## Quick Start

Run the environment configuration command:

```bash
prompt-or-die env config
```

This will open an interactive menu where you can configure all environment settings.

## Available Commands

### Main Environment Command
```bash
prompt-or-die env [action]
```

### Available Actions

- `config` - Open the interactive configuration menu
- `models` - Manage AI models and their settings
- `keys` - Manage API keys for different providers
- `env` - Manage .env file configuration
- `test` - Test API connections
- `show` - View current configuration

## Configuration Methods

### 1. Interactive Configuration (Recommended)

```bash
prompt-or-die env config
```

This opens a user-friendly menu where you can:
- Set API keys for OpenAI, Anthropic, Google, and other providers
- Select your default AI model
- Configure environment variables
- Test your API connections
- Manage .env file settings

### 2. Direct Command Access

```bash
# Manage AI models
prompt-or-die env models

# Manage API keys
prompt-or-die env keys

# Manage .env file
prompt-or-die env env

# Test connections
prompt-or-die env test

# View current settings
prompt-or-die env show
```

### 3. Environment File (.env)

You can also create a `.env` file in your project root:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Google AI Configuration
GOOGLE_API_KEY=your_google_api_key_here

# Supabase Configuration (for authentication)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Default AI Model
DEFAULT_MODEL=gpt-4
```

### 4. Configuration File

The CLI stores configuration in `~/.prompt-or-die/config.json`:

```json
{
  "apiKeys": {
    "openai": "your_openai_key",
    "anthropic": "your_anthropic_key",
    "google": "your_google_key"
  },
  "defaultModel": "gpt-4",
  "webAppUrl": "http://www.promptordie.tech",
  "environment": {
    "NODE_ENV": "development"
  }
}
```

## Supported AI Models

### OpenAI Models
- `gpt-4`
- `gpt-4-turbo`
- `gpt-3.5-turbo`
- `gpt-4o`
- `gpt-4o-mini`

### Anthropic Models
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`
- `claude-3-5-sonnet-20241022`

### Google Models
- `gemini-pro`
- `gemini-pro-vision`
- `gemini-1.5-pro`
- `gemini-1.5-flash`

## API Key Management

### Setting API Keys

1. **Interactive Method:**
   ```bash
   prompt-or-die env keys
   ```

2. **Environment Variables:**
   ```bash
   export OPENAI_API_KEY="your_key_here"
   export ANTHROPIC_API_KEY="your_key_here"
   export GOOGLE_API_KEY="your_key_here"
   ```

3. **Configuration File:**
   ```bash
   prompt-or-die config edit
   ```

### API Key Priority

The CLI checks for API keys in this order:
1. Environment variables
2. Configuration file (`~/.prompt-or-die/config.json`)
3. `.env` file in current directory
4. `.env` file in project root

## Testing Your Configuration

```bash
prompt-or-die env test
```

This command will:
- Test connectivity to configured AI providers
- Validate API keys
- Check model availability
- Report any configuration issues

## Environment Variables Reference

### Required for AI Functionality
- `OPENAI_API_KEY` - Your OpenAI API key
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `GOOGLE_API_KEY` - Your Google AI API key

### Optional Configuration
- `DEFAULT_MODEL` - Default AI model to use
- `SUPABASE_URL` - Supabase project URL (for authentication)
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `NODE_ENV` - Environment mode (development/production)

### Web App Integration
- `VITE_SUPABASE_URL` - Supabase URL for web app
- `VITE_SUPABASE_ANON_KEY` - Supabase key for web app
- `VITE_OPENAI_API_KEY` - OpenAI key for web app

## Troubleshooting

### Common Issues

1. **API Key Not Found:**
   ```bash
   prompt-or-die env keys
   # Set your API key through the interactive menu
   ```

2. **Model Not Available:**
   ```bash
   prompt-or-die env models
   # Select a different model or check your API access
   ```

3. **Connection Failed:**
   ```bash
   prompt-or-die env test
   # Test your connections and check API keys
   ```

4. **Configuration Reset:**
   ```bash
   prompt-or-die env config
   # Reconfigure all settings from scratch
   ```

### Getting Help

```bash
prompt-or-die env --help
prompt-or-die --help
```

## Security Best Practices

1. **Never commit API keys to version control**
2. **Use environment variables in production**
3. **Regularly rotate your API keys**
4. **Use different keys for development and production**
5. **Keep your `.env` file in `.gitignore`**

## Examples

### Complete Setup Example

```bash
# 1. Configure environment
prompt-or-die env config

# 2. Set OpenAI API key
# (Follow interactive prompts)

# 3. Select default model
# (Choose from available models)

# 4. Test configuration
prompt-or-die env test

# 5. View final configuration
prompt-or-die env show
```

### Quick API Key Setup

```bash
# Set environment variables
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."

# Test the setup
prompt-or-die env test
```

### Project-Specific Configuration

```bash
# Create .env file in your project
echo "OPENAI_API_KEY=your_key_here" > .env
echo "DEFAULT_MODEL=gpt-4" >> .env

# Test project configuration
prompt-or-die env test
```