# Starting MongoDB on Windows

MongoDB is installed but needs to be started. Here are the options:

## Option 1: Start MongoDB as a Service (Requires Admin)

**Run PowerShell as Administrator**, then:

```powershell
net start MongoDB
```

## Option 2: Start MongoDB Manually (No Admin Required)

```powershell
# Navigate to MongoDB bin directory (adjust path if different)
cd "C:\Program Files\MongoDB\Server\7.0\bin"

# Start MongoDB
.\mongod.exe --dbpath "C:\data\db"
```

**Note**: Make sure the data directory exists:
```powershell
mkdir C:\data\db
```

## Option 3: Check if MongoDB is Already Running

```powershell
# Check MongoDB service status
sc query MongoDB

# Or check if MongoDB process is running
tasklist | findstr mongod
```

## After Starting MongoDB

Once MongoDB is running, the backend server will automatically connect.

You should see this message in the backend logs:
```
INFO: Connected to MongoDB at mongodb://localhost:27017
```

## Test the Backend

Once both are running:

1. **API Root**: http://localhost:8000
2. **API Docs**: http://localhost:8000/docs
3. **Health Check**: http://localhost:8000/health

## Current Status

- ✅ Backend server code ready
- ✅ Dependencies installed
- ✅ MongoDB downloaded
- ⏳ MongoDB service needs to be started
- ⏳ Backend waiting for MongoDB connection

## Next Step

**Please run PowerShell as Administrator** and execute:
```powershell
net start MongoDB
```

Then the backend will connect automatically!
