# Remove .next cache (Windows-safe). Used by npm run clean / qa:preflight:clean.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$nextDir = Join-Path $Root ".next"

if (-not (Test-Path $nextDir)) {
  Write-Host "OK: no .next directory"
  exit 0
}

Write-Host "Removing $nextDir ..."
Remove-Item -LiteralPath $nextDir -Recurse -Force
Write-Host "OK: .next removed"
exit 0
