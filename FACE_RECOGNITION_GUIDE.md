# 👤 Facial Recognition Setup Guide

This guide will help you enable the **Facial Recognition** features (Face Login, Registration, Liveness Check) which are currently disabled because your system is missing the required C++ compilers.

---

## 🛑 The Problem
The library `dlib` (used for face recognition) is a C++ library. To install it on Windows, you need a C++ compiler. Standard Windows installations do not come with this compiler.

## ✅ The Solution: Visual Studio Build Tools

Follow these steps to install the necessary tools.

### Step 1: Download Build Tools
1.  **Click this link** to download the official installer:
    👉 [Download Visual Studio Build Tools 2022](https://aka.ms/vs/17/release/vs_buildtools.exe)

### Step 2: Install & Configure (Crucial Step!)
1.  Run the downloaded `vs_buildtools.exe`.
2.  Wait for the installer to prepare.
3.  **Check the box** for **"Desktop development with C++"**.
    > 🖼️ *Look for the "Desktop & Mobile" section. It is usually the first option on the top left.*
4.  Ensure the following (default) optional components are selected on the right side:
    - `MSVC v143 - VS 2022 C++ x64/x86 build tools`
    - `Windows 11 SDK` (or Windows 10 SDK)
5.  Click **Install** (This will download about 1.5 - 2 GB).
6.  **Restart your computer** after installation is complete.

---

## 🔄 Step 3: Re-run Setup

Once your computer has restarted:

1.  Open **PowerShell** or **Command Prompt** in this folder.
2.  Run the automated setup script again:
    ```powershell
    .\setup_project.ps1
    ```
3.  Watch for the green success message:
    > ✅ Face Recognition libraries installed successfully!

---

## ⚡ Alternative (Faster, Advanced)
If you don't want to install the heavy Build Tools (2GB+), you can try installing a pre-compiled "Wheel" file for Python 3.11.

1.  Download this file: `dlib-19.24.1-cp311-cp311-win_amd64.whl`
    - Search specifically for: **"dlib cp311 win_amd64 wheel"** on Google/GitHub.
2.  Place the file in your `backend` folder.
3.  Install it manually:
    ```powershell
    .\backend\venv\Scripts\pip install dlib-19.24.1-cp311-cp311-win_amd64.whl
    .\backend\venv\Scripts\pip install face_recognition
    ```

---

## ❓ How Do I Know It Worked?

Run this check command:
```powershell
.\backend\venv\Scripts\python.exe -c "import face_recognition; print('SUCCESS: Face Recognition Active!')"
```
If you see **SUCCESS**, you are ready to go!
