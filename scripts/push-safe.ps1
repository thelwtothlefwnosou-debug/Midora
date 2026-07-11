# Push current branch and tags to origin — never force push.
param(
  [string]$Branch = "recovery/midora-stabilize",
  [switch]$TagsOnly,
  [switch]$BranchOnly
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Find-Git {
  $fromPath = Get-Command git -ErrorAction SilentlyContinue
  if ($fromPath) { return $fromPath.Source }
  return "C:\Program Files\Git\cmd\git.exe"
}

$git = Find-Git
if (-not (Test-Path $git)) { throw "Git not found." }

$remotes = & $git remote
if (-not $remotes -or -not ($remotes -contains "origin")) {
  Write-Host ""
  Write-Host "No remote 'origin'. Run first:" -ForegroundColor Yellow
  Write-Host '  npm run git:remote -- -RemoteUrl "https://github.com/YOU/midora.git"'
  Write-Host ""
  exit 1
}

$currentBranch = (& $git branch --show-current).Trim()
if ($Branch -and $currentBranch -ne $Branch) {
  Write-Host "Warning: current branch is '$currentBranch', expected '$Branch'." -ForegroundColor Yellow
}

if (-not $TagsOnly) {
  Write-Host "Pushing branch $currentBranch to origin (no force)..." -ForegroundColor Cyan
  & $git push -u origin $currentBranch
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if (-not $BranchOnly) {
  Write-Host "Pushing tags to origin..." -ForegroundColor Cyan
  & $git push origin --tags
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host ""
Write-Host "Push complete." -ForegroundColor Green
Write-Host "After every verified good commit, run: npm run git:push" -ForegroundColor DarkGray
Write-Host ""
