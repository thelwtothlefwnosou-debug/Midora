# Midora source checkpoint — snapshots project source outside the repo so stale
# .next cache or accidental deletes cannot wipe your work.
param(
  [string]$Label = "",
  [switch]$List,
  [string]$Restore = "",
  [switch]$Force,
  [switch]$Quiet
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$StoreRoot = Join-Path (Split-Path -Parent $Root) "midora-checkpoints"

$IncludePaths = @(
  "src",
  "public",
  "scripts",
  "supabase",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.ts",
  "next.config.mjs",
  "next.config.js",
  "postcss.config.mjs",
  "postcss.config.js",
  "tailwind.config.ts",
  "tailwind.config.js",
  "eslint.config.mjs",
  "eslint.config.js",
  "components.json",
  "AGENTS.md",
  "CLAUDE.md"
)

$CanonicalUiFiles = @(
  "src/components/listings/ListingsSearchView.tsx",
  "src/components/listings/SearchListingCard.tsx",
  "src/components/listings/ListingsFilters.tsx",
  "src/components/search/LocationSearchField.tsx",
  "src/components/map/MidoraResultsMap.tsx",
  "src/components/map/PropertyMapLoader.tsx",
  "src/app/listings/page.tsx",
  "src/app/globals.css"
)

function Ensure-StoreRoot {
  if (-not (Test-Path $StoreRoot)) {
    New-Item -ItemType Directory -Path $StoreRoot -Force | Out-Null
  }
}

function Get-CheckpointDirs {
  Ensure-StoreRoot
  Get-ChildItem -Path $StoreRoot -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending
}

function Write-CanonicalUiManifest([string]$destRoot) {
  $manifestPath = Join-Path $destRoot "canonical-ui.json"
  $entries = @()

  foreach ($rel in $CanonicalUiFiles) {
    $abs = Join-Path $Root $rel
    if (-not (Test-Path $abs)) { continue }
    $hash = (Get-FileHash -Path $abs -Algorithm SHA256).Hash
    $entries += [ordered]@{
      path = $rel.Replace("\", "/")
      sha256 = $hash
      bytes = (Get-Item $abs).Length
    }
  }

  $payload = [ordered]@{
    createdAt = (Get-Date).ToString("o")
    project = "midora"
    files = $entries
  }

  $payload | ConvertTo-Json -Depth 6 | Set-Content -Path $manifestPath -Encoding UTF8
}

function New-Checkpoint {
  param([string]$CheckpointLabel)

  Ensure-StoreRoot
  $stamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
  $folderName = if ([string]::IsNullOrWhiteSpace($CheckpointLabel)) {
    $stamp
  } else {
    $safe = ($CheckpointLabel -replace '[^\w\-]+', '-').Trim('-')
    "${stamp}_${safe}"
  }

  $dest = Join-Path $StoreRoot $folderName
  New-Item -ItemType Directory -Path $dest -Force | Out-Null

  $copied = 0
  foreach ($rel in $IncludePaths) {
    $src = Join-Path $Root $rel
    if (-not (Test-Path $src)) { continue }

    $target = Join-Path $dest $rel
    $targetParent = Split-Path $target -Parent
    if (-not (Test-Path $targetParent)) {
      New-Item -ItemType Directory -Path $targetParent -Force | Out-Null
    }

    if ((Get-Item $src).PSIsContainer) {
      Copy-Item -Path $src -Destination $target -Recurse -Force
    } else {
      Copy-Item -Path $src -Destination $target -Force
    }
    $copied++
  }

  Write-CanonicalUiManifest $dest

  $meta = [ordered]@{
    id = $folderName
    createdAt = (Get-Date).ToString("o")
    label = $CheckpointLabel
    projectRoot = $Root
    copiedPaths = $copied
    storeRoot = $StoreRoot
  }
  $meta | ConvertTo-Json -Depth 4 | Set-Content -Path (Join-Path $dest "checkpoint.json") -Encoding UTF8

  if ($Quiet) {
    return $folderName
  }

  Write-Host ""
  Write-Host "Checkpoint saved:" -ForegroundColor Green
  Write-Host "  $dest"
  Write-Host "  Label: $(if ($CheckpointLabel) { $CheckpointLabel } else { '(none)' })"
  Write-Host ""
  Write-Host "Restore later:"
  Write-Host "  npm run checkpoint:restore -- -Restore `"$folderName`""
  Write-Host ""
}

function Show-Checkpoints {
  $dirs = Get-CheckpointDirs
  if (-not $dirs -or $dirs.Count -eq 0) {
    Write-Host "No checkpoints yet. Run: npm run checkpoint"
    return
  }

  Write-Host "Checkpoints in $StoreRoot"
  Write-Host ""
  foreach ($dir in $dirs) {
    $metaPath = Join-Path $dir.FullName "checkpoint.json"
    if (Test-Path $metaPath) {
      $meta = Get-Content $metaPath -Raw | ConvertFrom-Json
      Write-Host "  $($dir.Name)  [$($meta.createdAt)]  label=$($meta.label)"
    } else {
      Write-Host "  $($dir.Name)"
    }
  }
  Write-Host ""
}

function Restore-Checkpoint {
  param([string]$CheckpointId)

  $targetDir = Join-Path $StoreRoot $CheckpointId
  if (-not (Test-Path $targetDir)) {
    throw "Checkpoint not found: $CheckpointId"
  }

  if (-not $Force) {
    Write-Host "This will OVERWRITE current source files from checkpoint:"
    Write-Host "  $targetDir"
    Write-Host ""
    $answer = Read-Host "Type YES to continue"
    if ($answer -ne "YES") {
      Write-Host "Restore cancelled."
      exit 0
    }
  }

  foreach ($rel in $IncludePaths) {
    $src = Join-Path $targetDir $rel
    if (-not (Test-Path $src)) { continue }

    $dest = Join-Path $Root $rel
    if (Test-Path $dest) {
      Remove-Item -Path $dest -Recurse -Force
    }

    $destParent = Split-Path $dest -Parent
    if (-not (Test-Path $destParent)) {
      New-Item -ItemType Directory -Path $destParent -Force | Out-Null
    }

    if ((Get-Item $src).PSIsContainer) {
      Copy-Item -Path $src -Destination $dest -Recurse -Force
    } else {
      Copy-Item -Path $src -Destination $dest -Force
    }
  }

  Write-Host ""
  Write-Host "Restored from checkpoint: $CheckpointId" -ForegroundColor Green
  Write-Host "Run npm run dev:restart and hard refresh the browser (Ctrl+Shift+R)."
  Write-Host ""
}

if ($List) {
  Show-Checkpoints
  exit 0
}

if ($Restore) {
  Restore-Checkpoint -CheckpointId $Restore
  exit 0
}

New-Checkpoint -CheckpointLabel $Label
