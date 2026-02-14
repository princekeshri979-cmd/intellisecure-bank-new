# Python Installation Guide for IntelliSecure Bank

## Required Python Version
**Python 3.10.x or 3.11.x** (Recommended: 3.10.11)

## Why This Version?
- Best compatibility with `face_recognition` library (dlib-based)
- Stable support for FastAPI and all async features
- Compatible with scikit-learn, TensorFlow dependencies

## Installation Steps for Windows

### 1. Download Python
- Visit: https://www.python.org/downloads/
- Download **Python 3.10.11** (stable version)
- Or download **Python 3.11.x** (latest stable)

### 2. Install Python
**IMPORTANT**: During installation, make sure to:
- ✅ **Check "Add Python to PATH"** (critical!)
- ✅ Select "Install for all users" (recommended)
- ✅ Click "Install Now"

### 3. Verify Installation
After installation, open a **new PowerShell window** and run:
```powershell
python --version
```
You should see: `Python 3.10.x` or `Python 3.11.x`

Also verify pip:
```powershell
pip --version
```

### 4. Install Visual C++ Build Tools (Required for face_recognition)
The `face_recognition` library requires C++ build tools:

**Option 1: Install Visual Studio Build Tools**
- Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- Install "Desktop development with C++" workload

**Option 2: Install dlib pre-built wheel (easier)**
After Python is installed, we'll use:
```powershell
pip install cmake
pip install dlib
```

## After Python Installation
Once Python is verified, I will:
1. Create Python virtual environment
2. Install all backend dependencies
3. Set up the project structure
4. Continue with frontend setup

## Troubleshooting
- If `python` command not found → Restart PowerShell or add Python to PATH manually
- If dlib fails to install → Install Visual Studio Build Tools first
- If face_recognition fails → Try pre-built wheel from https://github.com/jloh02/dlib/releases
