#!/usr/bin/env node

/**
 * Simple test script to verify CLI functionality
 */

console.log('🚀 Prompt or Die CLI Test');
console.log('========================');

try {
  // Test basic imports
  const chalk = require('chalk');
  console.log(chalk.green('✓ Chalk import successful'));
  
  const figlet = require('figlet');
  console.log(chalk.green('✓ Figlet import successful'));
  
  const boxen = require('boxen');
  console.log(chalk.green('✓ Boxen import successful'));
  
  // Test core package import
  try {
    const core = require('@prompt-or-die/core');
    console.log(chalk.green('✓ Core package import successful'));
  } catch (err) {
    console.log(chalk.yellow('⚠ Core package not available:', err.message));
  }
  
  // Test inquirer prompts
  try {
    const { input, select } = require('@inquirer/prompts');
    console.log(chalk.green('✓ Inquirer prompts import successful'));
  } catch (err) {
    console.log(chalk.red('✗ Inquirer prompts failed:', err.message));
  }
  
  console.log('\n' + chalk.blue('CLI dependencies test completed!'));
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}