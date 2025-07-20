#!/usr/bin/env node

/**
 * AIDA MVP Quick Start Script
 * 
 * This script helps you quickly start the AIDA MVP server with basic validation.
 * Run with: node start-mvp.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`🚀 ${message}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Check if required files exist
 */
function checkRequiredFiles() {
  logHeader('Checking Required Files');
  
  const requiredFiles = [
    'package.json',
    'src/server-mvp.ts',
    'src/routes/mvp.routes.ts',
    'src/services/aida-mvp.service.ts',
    'src/types/database.ts'
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      logSuccess(`Found ${file}`);
    } else {
      logError(`Missing ${file}`);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

/**
 * Check environment configuration
 */
function checkEnvironment() {
  logHeader('Checking Environment Configuration');
  
  // Check if .env file exists
  if (!fs.existsSync('.env')) {
    logWarning('.env file not found');
    if (fs.existsSync('.env.example')) {
      logInfo('Found .env.example - please copy it to .env and configure your values');
      logInfo('Command: cp .env.example .env');
    }
    return false;
  }
  
  logSuccess('Found .env file');
  
  // Read and check required environment variables
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'EVOLUTION_API_URL',
    'EVOLUTION_API_KEY',
    'JWT_SECRET',
    'OPENAI_API_KEY'
  ];
  
  let allVarsSet = true;
  
  for (const varName of requiredVars) {
    const regex = new RegExp(`^${varName}=.+`, 'm');
    if (regex.test(envContent) && !envContent.includes(`${varName}=your-`)) {
      logSuccess(`${varName} is configured`);
    } else {
      logWarning(`${varName} needs to be configured`);
      allVarsSet = false;
    }
  }
  
  return allVarsSet;
}

/**
 * Check if dependencies are installed
 */
function checkDependencies() {
  logHeader('Checking Dependencies');
  
  if (!fs.existsSync('node_modules')) {
    logError('node_modules not found - please run: npm install');
    return false;
  }
  
  logSuccess('Dependencies are installed');
  
  // Check for MVP-specific dependencies
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    '@hono/node-server',
    'tsx',
    'dotenv',
    'jsonwebtoken',
    'uuid'
  ];
  
  let allDepsInstalled = true;
  
  for (const dep of requiredDeps) {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      logSuccess(`${dep} is available`);
    } else {
      logWarning(`${dep} might be missing`);
      allDepsInstalled = false;
    }
  }
  
  return allDepsInstalled;
}

/**
 * Start the MVP server
 */
function startServer() {
  logHeader('Starting AIDA MVP Server');
  
  logInfo('Starting server with: npm run dev:mvp');
  logInfo('Server will be available at: http://localhost:3000');
  logInfo('Health check: http://localhost:3000/health');
  logInfo('Press Ctrl+C to stop the server');
  
  log('\n' + '-'.repeat(60), 'cyan');
  
  const serverProcess = spawn('npm', ['run', 'dev:mvp'], {
    stdio: 'inherit',
    shell: true
  });
  
  serverProcess.on('error', (error) => {
    logError(`Failed to start server: ${error.message}`);
    process.exit(1);
  });
  
  serverProcess.on('close', (code) => {
    if (code !== 0) {
      logError(`Server process exited with code ${code}`);
    } else {
      logInfo('Server stopped gracefully');
    }
  });
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    log('\n\n🛑 Stopping server...', 'yellow');
    serverProcess.kill('SIGINT');
  });
}

/**
 * Show helpful information
 */
function showInfo() {
  logHeader('AIDA MVP Quick Start');
  
  logInfo('This script will help you start the AIDA MVP server');
  logInfo('Make sure you have configured your environment variables');
  logInfo('The server provides a simplified WhatsApp AI assistant platform');
  
  log('\n📋 Key Features:', 'bright');
  log('  • Phone-based authentication via WhatsApp');
  log('  • One-click user onboarding');
  log('  • Fixed monthly billing (R$250)');
  log('  • AI-powered customer support');
  log('  • Product catalog management');
  log('  • Conversation tracking');
  
  log('\n🔗 Important URLs:', 'bright');
  log('  • Health Check: http://localhost:3000/health');
  log('  • API Documentation: See README-MVP.md');
  log('  • Dashboard: Configure your frontend to connect');
}

/**
 * Main execution
 */
function main() {
  showInfo();
  
  // Run all checks
  const filesOk = checkRequiredFiles();
  const envOk = checkEnvironment();
  const depsOk = checkDependencies();
  
  if (!filesOk) {
    logError('Required files are missing. Please check your installation.');
    process.exit(1);
  }
  
  if (!depsOk) {
    logError('Dependencies are missing. Please run: npm install');
    process.exit(1);
  }
  
  if (!envOk) {
    logWarning('Environment configuration is incomplete.');
    logInfo('Please configure your .env file before starting the server.');
    logInfo('See .env.example for required variables.');
    
    // Ask if user wants to continue anyway
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('\nDo you want to start the server anyway? (y/N): ', (answer) => {
      rl.close();
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        startServer();
      } else {
        logInfo('Please configure your environment and try again.');
        process.exit(0);
      }
    });
  } else {
    logSuccess('All checks passed! Starting server...');
    setTimeout(startServer, 1000);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  checkRequiredFiles,
  checkEnvironment,
  checkDependencies,
  startServer
};