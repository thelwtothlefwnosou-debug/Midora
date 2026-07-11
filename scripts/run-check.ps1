# Run quality checks (TypeScript + lint; optional full build).
param(
  [switch]$Full
)

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$failed = $false

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

Invoke-Step "TypeScript" {
  npx tsc --noEmit
}

Invoke-Step "ESLint" {
  npm run lint
}

if ($Full) {
  Invoke-Step "Next.js build" {
    npm run build
  }
} else {
  Write-Host ""
  Write-Host "Skipping build (use: npm run check:full)" -ForegroundColor DarkGray
}

Write-Host ""
if ($failed) {
  Write-Host "check: one or more steps failed" -ForegroundColor Red
  exit 1
}

Write-Host "check: all steps passed" -ForegroundColor Green
exit 0
