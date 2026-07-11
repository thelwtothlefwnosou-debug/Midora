# Writes the latest git commit to CURRENT_GIT_COMMIT.txt for quick copy-paste restore.
$ErrorActionPreference = "Stop"

function Find-Git {
  $fromPath = Get-Command git -ErrorAction SilentlyContinue
  if ($fromPath) { return $fromPath.Source }
  $candidates = @(
    "C:\Program Files\Git\cmd\git.exe",
    "C:\Program Files (x86)\Git\cmd\git.exe",
    "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe"
  )
  return $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}

$git = Find-Git
if (-not $git) { exit 0 }

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$inside = & $git rev-parse --is-inside-work-tree 2>$null
if ($inside -ne "true") { exit 0 }

$short = (& $git log -1 --format="%h").Trim()
$full = (& $git log -1 --format="%H").Trim()
$subject = (& $git log -1 --format="%s").Trim()
$date = (& $git log -1 --format="%ci").Trim()

$outPath = Join-Path $Root "CURRENT_GIT_COMMIT.txt"
$copyLine = "Gyrise sto $short"
$footerLine = "Git: $short - $subject"

$body = @(
  "# Midora - current git commit (auto-updated after each commit)",
  "# An kati xalase, copy COPY line sto chat.",
  "",
  "HASH=$short",
  "FULL=$full",
  "SUBJECT=$subject",
  "DATE=$date",
  "",
  "COPY=$copyLine",
  "FOOTER=$footerLine",
  "PUSH=npm run git:push"
) -join "`n"

Set-Content -Path $outPath -Value $body -Encoding UTF8

Write-Host ""
Write-Host "Git commit recorded: $short - $subject" -ForegroundColor Green
Write-Host "  Saved to: CURRENT_GIT_COMMIT.txt" -ForegroundColor DarkGray
Write-Host "  Restore in chat: Restore to $short" -ForegroundColor Cyan
Write-Host "  Push to remote: npm run git:push" -ForegroundColor Yellow
Write-Host ""
