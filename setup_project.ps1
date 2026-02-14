<#
.SYNOPSIS
    Automated setup script for IntelliSecure Bank project on Windows.
    Handles virtual environment creation, dependency installation, and optional face recognition setup.

.DESCRIPTION
    1. Checks for Python and Node.js
    2. Sets up Python virtual environment in backend/venv
    3. Installs core backend dependencies
    4. Attempts to install face recognition dependencies (optional)
    5. Installs frontend dependencies via npm
#>

Write-Host "Starting IntelliSecure Bank Setup..." -ForegroundColor Cyan

# Check Prerequisites
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python not found. Please install Python 3.10+." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Found: $pythonVersion" -ForegroundColor Green

$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Node.js not found. Frontend setup will be skipped." -ForegroundColor Yellow
} else {
    Write-Host "✅ Found Node.js: $nodeVersion" -ForegroundColor Green
}

# --- Backend Setup ---
Write-Host "`nSetting up Backend..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\backend"

if (-not (Test-Path "venv")) {
    Write-Host "   Creating virtual environment..."
    python -m venv venv
}

# Activate venv
if (Test-Path "venv\Scripts\Activate.ps1") {
    # Verify activation
    & ".\venv\Scripts\python.exe" -m pip install --upgrade pip | Out-Null
} else {
    Write-Host "❌ Failed to create virtual environment." -ForegroundColor Red
    exit 1
}

Write-Host "   Installing core dependencies..."
& ".\venv\Scripts\pip.exe" install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install core dependencies." -ForegroundColor Red
    exit 1
}

Write-Host "   Attempting to install Face Recognition dependencies (Optional)..."
& ".\venv\Scripts\pip.exe" install -r requirements-face.txt 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Face Recognition libraries installed successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Face Recognition installation failed (likely missing C++ Build Tools)." -ForegroundColor Yellow
    Write-Host "   The app will run without face features. See FACE_RECOGNITION_INSTALL.md to fix this later." -ForegroundColor Yellow
}

# Setup .env
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "   Created .env file from example."
    }
}

# --- Frontend Setup ---
if ($nodeVersion) {
    Write-Host "`nSetting up Frontend..." -ForegroundColor Cyan
    Set-Location "$PSScriptRoot\frontend"
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "   Installing npm packages (this may take a while)..."
        npm install | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Frontend dependencies installed." -ForegroundColor Green
        } else {
            Write-Host "❌ Frontend installation failed." -ForegroundColor Red
        }
    } else {
        Write-Host "   Frontend dependencies already installed."
    }

    # Setup .env
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "   Created .env file from example."
        }
    }
}

Write-Host "`nSetup Complete!" -ForegroundColor Cyan
Write-Host "To run the project:"
Write-Host "1. Backend:  cd backend; .\venv\Scripts\activate; uvicorn main:app --reload"
Write-Host "2. Frontend: cd frontend; npm run dev"
Write-Host "3. MongoDB:  Ensure MongoDB is running locally."
