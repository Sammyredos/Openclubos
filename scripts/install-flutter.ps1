# OpenclubOS - Automated Flutter & Git Setup Script for Windows
# Run this in PowerShell (elevated as Administrator if possible, or standard user for user-profile installation)

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  OpenclubOS - Flutter & Git Environment Setup" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan

$ToolsDir = "$HOME\tools"
$FlutterDir = "$ToolsDir\flutter"

if (-not (Test-Path $ToolsDir)) {
    New-Item -ItemType Directory -Path $ToolsDir -Force | Out-Null
}

# 1. Check Git
$hasGit = (Get-Command git -ErrorAction SilentlyContinue)
if (-not $hasGit) {
    Write-Host "[1/3] Git is not detected. Installing Git for Windows..." -ForegroundColor Yellow
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "Running: winget install --id Git.Git -e --source winget" -ForegroundColor Gray
        winget install --id Git.Git -e --source winget
    } elseif (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Host "Running: choco install git -y" -ForegroundColor Gray
        choco install git -y
    } else {
        Write-Host "Please download and install Git from: https://git-scm.com/download/win" -ForegroundColor Red
    }
} else {
    Write-Host "[1/3] Git is already installed." -ForegroundColor Green
}

# 2. Install Flutter SDK
$hasFlutter = (Get-Command flutter -ErrorAction SilentlyContinue)
if (-not $hasFlutter) {
    Write-Host "[2/3] Flutter is not detected. Checking $FlutterDir..." -ForegroundColor Yellow
    
    if (-not (Test-Path "$FlutterDir\bin\flutter.bat")) {
        Write-Host "Cloning stable Flutter SDK into $FlutterDir..." -ForegroundColor Cyan
        git clone https://github.com/flutter/flutter.git -b stable "$FlutterDir"
    }

    # Add to User PATH
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($userPath -notlike "*$FlutterDir\bin*") {
        Write-Host "Adding Flutter to User PATH environment variable..." -ForegroundColor Cyan
        $newPath = "$FlutterDir\bin;" + $userPath
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        $env:Path = "$FlutterDir\bin;" + $env:Path
    }
} else {
    Write-Host "[2/3] Flutter SDK is already installed on PATH." -ForegroundColor Green
}

# 3. Enable Web and Verify
Write-Host "[3/3] Verifying Flutter installation..." -ForegroundColor Cyan
if (Get-Command flutter -ErrorAction SilentlyContinue) {
    flutter config --enable-web
    Write-Host "`nSetup complete! You can now run the mobile app with:" -ForegroundColor Green
    Write-Host "  cd apps\mobile-app" -ForegroundColor White
    Write-Host "  flutter run -d chrome" -ForegroundColor White
} else {
    Write-Host "`nFlutter installed at: $FlutterDir\bin" -ForegroundColor Yellow
    Write-Host "Please restart your PowerShell terminal for PATH changes to take effect, then run:" -ForegroundColor Yellow
    Write-Host "  cd apps\mobile-app; flutter run -d chrome" -ForegroundColor White
}
