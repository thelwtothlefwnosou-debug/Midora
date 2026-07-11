# Prunes old auto-agent checkpoints; never deletes manual checkpoints.
param(
  [switch]$DryRun,
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$StoreRoot = Join-Path (Split-Path -Parent $Root) "midora-checkpoints"

function Get-CheckpointMeta([string]$dirPath) {
  $metaPath = Join-Path $dirPath "checkpoint.json"
  if (Test-Path $metaPath) {
    return Get-Content $metaPath -Raw | ConvertFrom-Json
  }
  return [pscustomobject]@{ label = ""; createdAt = $null }
}

function Test-IsAutoCheckpoint([string]$folderName, $meta) {
  $label = [string]$meta.label
  if ($label -eq "auto-agent") { return $true }
  if ($folderName -match "_auto-agent$") { return $true }
  return $false
}

function Get-CreatedDate($meta, [string]$folderName) {
  if ($meta.createdAt) {
    return [datetime]::Parse($meta.createdAt)
  }
  if ($folderName -match "^(\d{4}-\d{2}-\d{2})_") {
    return [datetime]::ParseExact($Matches[1], "yyyy-MM-dd", $null)
  }
  return [datetime]::MinValue
}

if (-not (Test-Path $StoreRoot)) {
  Write-Host "No checkpoints folder: $StoreRoot"
  exit 0
}

$now = Get-Date
$sevenDaysAgo = $now.AddDays(-7)
$thirtyDaysAgo = $now.AddDays(-30)

$entries = Get-ChildItem -Path $StoreRoot -Directory | ForEach-Object {
  $meta = Get-CheckpointMeta $_.FullName
  [pscustomobject]@{
    Dir = $_
    Name = $_.Name
    Meta = $meta
    IsAuto = Test-IsAutoCheckpoint $_.Name $meta
    Created = Get-CreatedDate $meta $_.Name
  }
}

$toDelete = [System.Collections.Generic.List[object]]::new()
$autoOlderThan7 = $entries | Where-Object { $_.IsAuto -and $_.Created -lt $sevenDaysAgo }

# Within 7-30 days: keep newest auto checkpoint per calendar day
$autoBetween7And30 = $autoOlderThan7 | Where-Object { $_.Created -ge $thirtyDaysAgo }
$keepIds = [System.Collections.Generic.HashSet[string]]::new()

foreach ($group in ($autoBetween7And30 | Group-Object { $_.Created.ToString("yyyy-MM-dd") })) {
  $newest = $group.Group | Sort-Object Created -Descending | Select-Object -First 1
  [void]$keepIds.Add($newest.Name)
}

foreach ($entry in $entries) {
  if (-not $entry.IsAuto) { continue } # manual: never delete
  if ($entry.Created -ge $sevenDaysAgo) { continue } # keep all recent 7 days

  if ($entry.Created -ge $thirtyDaysAgo) {
    if ($keepIds.Contains($entry.Name)) { continue }
    $toDelete.Add($entry)
    continue
  }

  $toDelete.Add($entry)
}

if ($toDelete.Count -eq 0) {
  Write-Host "Nothing to prune."
  exit 0
}

Write-Host ""
Write-Host "Checkpoint prune plan ($($toDelete.Count) auto-agent folders):" -ForegroundColor Yellow
Write-Host ""
foreach ($entry in ($toDelete | Sort-Object Created)) {
  Write-Host "  $($entry.Name)  [$($entry.Created.ToString('yyyy-MM-dd'))]  label=$($entry.Meta.label)"
}
Write-Host ""
Write-Host "Kept: all manual checkpoints, all auto from last 7 days, one daily auto for days 8-30."
Write-Host ""

if ($DryRun) {
  Write-Host "Dry-run only. No folders deleted." -ForegroundColor Cyan
  exit 0
}

if (-not $Force) {
  $answer = Read-Host "Type YES to delete the folders above"
  if ($answer -ne "YES") {
    Write-Host "Prune cancelled."
    exit 0
  }
}

foreach ($entry in $toDelete) {
  Remove-Item -Path $entry.Dir.FullName -Recurse -Force
  Write-Host "Deleted: $($entry.Name)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Prune complete." -ForegroundColor Green
Write-Host ""
