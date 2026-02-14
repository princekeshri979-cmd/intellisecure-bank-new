# Installing face_recognition on Windows

The `face_recognition` library requires C++ compilation tools because it depends on `dlib`.

## Option 1: Install Visual Studio Build Tools (Recommended)

1. **Download Visual Studio Build Tools**:
   - Link: https://visualstudio.microsoft.com/visual-cpp-build-tools/

2. **During installation, select**:
   - ✅ "Desktop development with C++"
   - This includes MSVC, Windows SDK, and CMake

3. **Restart your PowerShell**, then install:
   ```powershell
   cd backend
   venv\Scripts\activate
   pip install cmake
   pip install dlib
   pip install face_recognition
   ```

## Option 2: Use Pre-built Wheels (Easier, Faster)

1. **Download pre-compiled dlib wheel** for Python 3.14:
   - Check: https://github.com/jloh02/dlib/releases
   - Or: https://www.lfd.uci.edu/~gohlke/pythonlibs/#dlib
   
2. **Install the wheel**:
   ```powershell
   cd backend
   venv\Scripts\activate
   pip install path\to\dlib-19.24.6-cp314-cp314-win_amd64.whl
   pip install face_recognition
   ```

## Option 3: Use Alternative Library (For Now)

Since Python 3.14.2 is very new, pre-built wheels might not be available yet. Alternative:

### Use MediaPipe for face detection (lighter weight):
```powershell
pip install mediapipe opencv-python
```

This will work for face detection and landmarks but won't provide the same quality embeddings as face_recognition.

## After Installing face_recognition Successfully

1. **Uncomment these lines in requirements.txt**:
   ```
   dlib==19.24.6
   face_recognition==1.3.0
   ```

2. **The facial verification module will work automatically**

## Current Status

✅ All other dependencies installed successfully
⏳ face_recognition pending C++ build tools installation

The project can run without face_recognition for now, but facial verification features will be disabled until it's installed.
