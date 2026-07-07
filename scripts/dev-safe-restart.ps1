# Safe dev restart: always stop the server BEFORE touching .next cache.
param(
  [switch]$CleanCache,
  [string]$OpenUrl = "http://127.0.0.1:3000/listings?rentalType=short_term"
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Port = 3000

function Stop-PortListeners([int]$listenPort) {
  $connections = Get-NetTCPConnection -LocalPort $listenPort -State Listen -ErrorAction SilentlyContinue
  foreach ($conn in $connections) {
    if ($conn.OwningProcess -gt 0) {
      Write-Host "Stopping process $($conn.OwningProcess) on port $listenPort..."
      Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
  }
}

Set-Location $Root

Write-Host "Stopping dev server on port $Port..."
Stop-PortListeners $Port
Start-Sleep -Seconds 2

if ($CleanCache) {
  $nextDir = Join-Path $Root ".next"
  if (Test-Path $nextDir) {
    Write-Host "Removing .next cache (server already stopped)..."
    Remove-Item -Path $nextDir -Recurse -Force
  }
}

$lockFile = Join-Path $Root ".next\dev\lock"
if (Test-Path $lockFile) {
  Remove-Item $lockFile -Force
}

& (Join-Path $Root "scripts\dev-open.ps1")

if ($OpenUrl) {
  $chromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:LocalAppData}\Google\Chrome\Application\chrome.exe"
  )
  foreach ($path in $chromePaths) {
    if (Test-Path $path) {
      Start-Process -FilePath $path -ArgumentList $OpenUrl
      break
    }
  }
}
