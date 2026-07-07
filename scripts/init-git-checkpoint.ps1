# Initialize git + first checkpoint branch when Git for Windows is installed.
param(
  [string]$Branch = "recovery/midora-stabilize"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

function Find-Git {
  $fromPath = Get-Command git -ErrorAction SilentlyContinue
  $paths = @()
  if ($fromPath) { $paths += $fromPath.Source }
  $paths += @(
    "C:\Program Files\Git\cmd\git.exe",
    "C:\Program Files (x86)\Git\cmd\git.exe",
    "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe"
  )
  return $paths | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
}

$git = Find-Git
if (-not $git) {
  Write-Host ""
  Write-Host "Git is not installed on this machine." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Install Git for Windows, then run again:"
  Write-Host "  winget install --id Git.Git -e"
  Write-Host "  npm run git:init"
  Write-Host ""
  Write-Host "Until then, use file checkpoints (already set up):"
  Write-Host "  npm run checkpoint          # save snapshot"
  Write-Host "  npm run checkpoint:list     # list snapshots"
  Write-Host ""
  exit 1
}

Set-Location $Root

if (-not (Test-Path (Join-Path $Root ".git"))) {
  Write-Host "Initializing git repository..."
  & $git init
}

& $git add -A
$status = & $git status --porcelain
if (-not $status) {
  Write-Host "Nothing to commit — working tree clean."
} else {
  & $git commit -m @"
chore: recovery checkpoint — canonical search UI + stabilisation baseline

Baseline before next Master Brief phases. Includes MapLibre search,
2-column SearchListingCard grid, single rental type policy.
"@
}

& $git branch -M main 2>$null
& $git checkout -B $Branch 2>$null
if ($LASTEXITCODE -ne 0) {
  & $git branch $Branch
  & $git checkout $Branch
}

Write-Host ""
Write-Host "Git checkpoint ready on branch: $Branch" -ForegroundColor Green
Write-Host "Commit: $(& $git log -1 --oneline)"
Write-Host ""
Write-Host "Daily safety:"
Write-Host "  npm run checkpoint"
Write-Host "  git add -A && git commit -m `"your message`""
Write-Host ""
