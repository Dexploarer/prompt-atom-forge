import { buildPrompt } from 'prompt-or-die/sdk';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Load prompt configuration from JSON
const promptConfig = JSON.parse(readFileSync('prompts/example.json', 'utf8'));

// Build the prompt
const prompt = buildPrompt(promptConfig.blocks);

// Save to output file
writeFileSync('output/prompt.txt', prompt);
console.log('Prompt built and saved to output/prompt.txt');
