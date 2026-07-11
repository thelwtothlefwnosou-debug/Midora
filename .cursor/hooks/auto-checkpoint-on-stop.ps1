# Saves a file checkpoint after agent edits, if any tracked files changed this turn.
$ErrorActionPreference = "SilentlyContinue"

$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$PendingFile = Join-Path $Root ".cursor\.checkpoint-pending"
$CheckpointScript = Join-Path $Root "scripts\checkpoint.ps1"

if (-not (Test-Path $PendingFile)) {
  Write-Output "{}"
  exit 0
}

try {
  Remove-Item -Path $PendingFile -Force -ErrorAction SilentlyContinue
  & powershell -ExecutionPolicy Bypass -File $CheckpointScript -Label "auto-agent" -Quiet
} catch {
  # Fail open — checkpoint is a safety net, not a blocker.
}

Write-Output "{}"
exit 0
