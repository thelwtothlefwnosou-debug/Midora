$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Port = 3000
$Url = "http://127.0.0.1:$Port"
$ChromePaths = @(
  "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "${env:LocalAppData}\Google\Chrome\Application\chrome.exe"
)

function Stop-PortListeners([int]$listenPort) {
  $connections = Get-NetTCPConnection -LocalPort $listenPort -State Listen -ErrorAction SilentlyContinue
  foreach ($conn in $connections) {
    if ($conn.OwningProcess -gt 0) {
      Write-Host "Stopping process $($conn.OwningProcess) on port $listenPort..."
      Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
  }
}

function Test-ServerReady([string]$targetUrl) {
  try {
    $response = Invoke-WebRequest -Uri $targetUrl -UseBasicParsing -TimeoutSec 20
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
  } catch {
    return $false
  }
}

function Open-Browser([string]$targetUrl) {
  foreach ($path in $ChromePaths) {
    if (Test-Path $path) {
      Start-Process -FilePath $path -ArgumentList $targetUrl
      return
    }
  }
  Start-Process $targetUrl
}

Set-Location $Root

Write-Host "Cleaning stale dev server on port $Port..."
Stop-PortListeners $Port
Start-Sleep -Seconds 1

$lockFile = Join-Path $Root ".next\dev\lock"
if (Test-Path $lockFile) {
  Remove-Item $lockFile -Force
}

Write-Host "Starting Next.js dev server..."
$npmCmd = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $npmCmd) {
  $npmCmd = Join-Path $env:ProgramFiles "nodejs\npm.cmd"
}
if (-not (Test-Path $npmCmd)) {
  throw "npm.cmd not found"
}

$dev = Start-Process `
  -FilePath $npmCmd `
  -ArgumentList @("run", "dev", "--", "-H", "127.0.0.1", "-p", "$Port") `
  -WorkingDirectory $Root `
  -PassThru `
  -WindowStyle Hidden

Write-Host "Waiting for $Url ..."
$ready = $false
for ($i = 1; $i -le 60; $i++) {
  if (Test-ServerReady $Url) {
    $ready = $true
    break
  }
  Start-Sleep -Seconds 2
}

if (-not $ready) {
  Write-Host "Server did not become ready in time."
  if ($dev -and -not $dev.HasExited) {
    Stop-Process -Id $dev.Id -Force -ErrorAction SilentlyContinue
  }
  exit 1
}

Write-Host "Ready: $Url"
Open-Browser $Url
Write-Host "Opened in browser."
