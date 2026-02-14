$baseUrl = "http://localhost:8000"

function Test-Endpoint {
    param (
        [string]$Method,
        [string]$Path,
        [hashtable]$Body = $null
    )

    $url = "$baseUrl$Path"
    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $url -Method Get -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $url -Method Post -Body ($Body | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
        }
        Write-Host "$Method $Path -> OK" -ForegroundColor Green
        # $response | ConvertTo-Json -Depth 2 | Write-Host
    } catch {
        Write-Host "$Method $Path -> FAILED: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
             Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        }
    }
}

Write-Host "Checking API endpoints..."

# 1. Check if server is up
Test-Endpoint -Method "GET" -Path "/"

# 2. Check Admin routes
Test-Endpoint -Method "GET" -Path "/api/admin/notification"

# 3. Check Monitoring Ping
Test-Endpoint -Method "GET" -Path "/api/monitoring/ping"

# 4. Check Monitoring Heartbeat
$heartbeatData = @{
    signals = @{
        device_fingerprint = "test"
        ip_address = "127.0.0.1"
        keystroke_deviation = 0
        mouse_deviation = 0
        face_present = $true
        multiple_faces = $false
        camera_blocked = $false
        facial_captcha_failed = $false
        mouse_entropy = 0
        mouse_velocity_variance = 0
    }
}
Test-Endpoint -Method "POST" -Path "/api/monitoring/heartbeat" -Body $heartbeatData

# 5. Check Face Verification (expect 401)
Test-Endpoint -Method "POST" -Path "/api/face-verification/check" -Body @{ live_embedding = @() }
