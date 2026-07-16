# Midora QA preflight - typecheck, lint, production build.
$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$failed = $false
$CleanFirst = $env:QA_PREFLIGHT_CLEAN -eq "1" -or ($args -contains "-Clean")

function Stop-PortListeners([int]$listenPort) {
  $connections = Get-NetTCPConnection -LocalPort $listenPort -State Listen -ErrorAction SilentlyContinue
  foreach ($conn in $connections) {
    if ($conn.OwningProcess -gt 0) {
      Write-Host "Stopping process $($conn.OwningProcess) on port $listenPort..."
      Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
  }
}

function Clear-NextCache {
  $nextDir = Join-Path $Root ".next"
  if (Test-Path $nextDir) {
    Write-Host "Removing .next cache (avoids corrupt .next/dev/types)..."
    try {
      Remove-Item -LiteralPath $nextDir -Recurse -Force -ErrorAction Stop
      Write-Host "OK: .next removed"
    } catch {
      Write-Host "WARN: could not fully remove .next: $($_.Exception.Message)" -ForegroundColor Yellow
    }
  } else {
    Write-Host "OK: no .next directory to clean"
  }
}

function Invoke-Step([string]$name, [scriptblock]$block) {
  Write-Host ""
  Write-Host "== $name ==" -ForegroundColor Cyan
  & $block
  if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
    Write-Host "FAILED: $name (exit $LASTEXITCODE)" -ForegroundColor Red
    $script:failed = $true
  } else {
    Write-Host "OK: $name" -ForegroundColor Green
  }
}

if ($CleanFirst) {
  Invoke-Step "Clean .next" { Clear-NextCache; $global:LASTEXITCODE = 0 }
}

Invoke-Step "TypeScript (tsc --noEmit)" {
  npm run typecheck
}

Invoke-Step "ESLint (QA gate paths)" {
  npm run lint:gate
}

Write-Host ""
Write-Host "== ESLint (full project - informational) ==" -ForegroundColor Cyan
npm run lint
if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
  Write-Host "WARN: full lint has pre-existing debt (does not fail preflight)" -ForegroundColor Yellow
} else {
  Write-Host "OK: full lint" -ForegroundColor Green
}

Invoke-Step "Next.js build" {
  Write-Host "Stopping dev server on port 3000 before build (avoids OOM)..."
  Stop-PortListeners 3000
  Start-Sleep -Seconds 2
  # Always clean .next before production build when corrupt types caused prior failures
  if (-not $CleanFirst) {
    Clear-NextCache
  }
  npm run build
}

Write-Host ""
if ($failed) {
  Write-Host "qa:preflight - FAILED" -ForegroundColor Red
  exit 1
}

Write-Host "qa:preflight - PASS" -ForegroundColor Green
exit 0
