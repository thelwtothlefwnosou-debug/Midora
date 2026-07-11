# Install git hooks from scripts/hooks/ into .git/hooks/
param(
  [switch]$PreCommit
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$SourceDir = Join-Path $PSScriptRoot "hooks"
$TargetDir = Join-Path $Root ".git\hooks"

if (-not (Test-Path $TargetDir)) {
  throw "Not a git repository: $Root"
}

$always = @("post-commit")
$optional = if ($PreCommit) { @("pre-commit") } else { @() }

foreach ($name in ($always + $optional)) {
  $src = Join-Path $SourceDir $name
  if (-not (Test-Path $src)) { continue }
  $dest = Join-Path $TargetDir $name
  Copy-Item -Path $src -Destination $dest -Force
  Write-Host "Installed hook: $name"
}

if (-not $PreCommit) {
  $preDest = Join-Path $TargetDir "pre-commit"
  if (Test-Path $preDest) {
    Remove-Item $preDest -Force
    Write-Host "Skipped optional pre-commit (use -PreCommit to enable)" -ForegroundColor DarkGray
  }
}

& powershell -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\record-current-commit.ps1")

Write-Host ""
Write-Host "Git hooks ready. post-commit updates CURRENT_GIT_COMMIT.txt" -ForegroundColor Green
if (-not $PreCommit) {
  Write-Host "Optional: npm run git:hooks -- -PreCommit  (runs npm run check before commit)" -ForegroundColor DarkGray
}
Write-Host ""
