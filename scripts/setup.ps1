# OpenclubOS Setup Script for Windows

Write-Host "Starting OpenclubOS Setup..." -ForegroundColor Cyan

# Check for pnpm
if (Get-Command pnpm.cmd -ErrorAction SilentlyContinue) {
    $pnpm = "pnpm.cmd"
} elseif (Get-Command pnpm -ErrorAction SilentlyContinue) {
    $pnpm = "pnpm"
} else {
    Write-Error "pnpm not found. Please install it: npm install -g pnpm"
    exit 1
}

# Check for docker
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $docker = "docker"
} else {
    Write-Warning "Docker not found. Infrastructure services will not start."
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
& $pnpm install

# Setup environment
if (-not (Test-Path .env)) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
}

# Start infrastructure
if ($docker) {
    Write-Host "Starting infrastructure with Docker..." -ForegroundColor Yellow
    & $docker compose up -d
}

Write-Host "Setup complete! Run 'pnpm dev' to start development servers." -ForegroundColor Green
