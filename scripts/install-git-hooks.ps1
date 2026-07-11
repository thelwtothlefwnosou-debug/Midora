# Install git hooks from scripts/hooks/ into .git/hooks/
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$SourceDir = Join-Path $PSScriptRoot "hooks"
$TargetDir = Join-Path $Root ".git\hooks"

if (-not (Test-Path $TargetDir)) {
  throw "Not a git repository: $Root"
}

Get-ChildItem -Path $SourceDir -File | ForEach-Object {
  $dest = Join-Path $TargetDir $_.Name
  Copy-Item -Path $_.FullName -Destination $dest -Force
  Write-Host "Installed hook: $($_.Name)"
}

& powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\record-current-commit.ps1")

Write-Host ""
Write-Host "Git hooks ready. Each new commit updates CURRENT_GIT_COMMIT.txt" -ForegroundColor Green
Write-Host ""
