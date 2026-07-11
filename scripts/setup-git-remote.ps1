# Configure a private Git remote and push the current branch (no force push).
param(
  [string]$RemoteUrl = "",
  [string]$Branch = "recovery/midora-stabilize"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Find-Git {
  $fromPath = Get-Command git -ErrorAction SilentlyContinue
  if ($fromPath) { return $fromPath.Source }
  $candidates = @(
    "C:\Program Files\Git\cmd\git.exe",
    "C:\Program Files (x86)\Git\cmd\git.exe"
  )
  return $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}

$git = Find-Git
if (-not $git) { throw "Git not found." }

$remotes = & $git remote
if (-not $remotes -or -not ($remotes -contains "origin")) {
  if (-not $RemoteUrl) {
    Write-Host ""
    Write-Host "No git remote 'origin' configured." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Create a private repo on GitHub/GitLab, then run:"
    Write-Host '  npm run git:remote -- -RemoteUrl "https://github.com/YOU/midora.git"'
    Write-Host ""
    Write-Host "Or manually:"
    Write-Host '  git remote add origin https://github.com/YOU/midora.git'
    Write-Host "  npm run git:push"
    Write-Host ""
    exit 1
  }

  & $git remote add origin $RemoteUrl
  Write-Host "Added remote origin: $RemoteUrl" -ForegroundColor Green
} elseif ($RemoteUrl) {
  & $git remote set-url origin $RemoteUrl
  Write-Host "Updated remote origin: $RemoteUrl" -ForegroundColor Green
}

Write-Host ""
Write-Host "Remote configured. Push with: npm run git:push" -ForegroundColor Cyan
Write-Host ""
