const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const cyan = '\x1b[36m';
const yellow = '\x1b[33m';
const green = '\x1b[32m';
const reset = '\x1b[0m';
const red = '\x1b[31m';

console.log(`${cyan}Starting OpenclubOS Setup...${reset}`);

try {
  execSync('pnpm --version', { stdio: 'ignore' });
} catch (e) {
  console.error(`${red}pnpm not found. Please install it: npm install -g pnpm${reset}`);
  process.exit(1);
}

let hasDocker = true;
try {
  execSync('docker --version', { stdio: 'ignore' });
} catch (e) {
  console.warn(`${yellow}Docker not found. Infrastructure services will not start.${reset}`);
  hasDocker = false;
}

console.log(`${yellow}Installing dependencies...${reset}`);
execSync('pnpm install', { stdio: 'inherit' });

const envExamplePath = path.join(__dirname, '../.env.example');
const envPath = path.join(__dirname, '../.env');

if (!fs.existsSync(envPath)) {
  console.log(`${yellow}Creating .env from .env.example...${reset}`);
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
  } else {
    console.warn(`${yellow}.env.example not found!${reset}`);
  }
}

if (hasDocker) {
  console.log(`${yellow}Starting infrastructure with Docker...${reset}`);
  try {
    execSync('docker compose up -d', { stdio: 'inherit' });
  } catch (e) {
    console.error(`${red}Failed to start Docker containers. Make sure Docker daemon is running.${reset}`);
  }
}

console.log(`${green}Setup complete! Run 'pnpm dev' to start development servers.${reset}`);
