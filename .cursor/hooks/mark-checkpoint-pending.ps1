# Marks that source files changed so auto-checkpoint runs when the agent stops.
$ErrorActionPreference = "SilentlyContinue"

$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$PendingFile = Join-Path $Root ".cursor\.checkpoint-pending"
$TrackedPrefixes = @("src/", "src\", "public/", "public\", "scripts/", "scripts\", "supabase/", "supabase\")

function Test-TrackedPath([string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
  $normalized = $Path.Replace("\", "/")
  foreach ($prefix in $TrackedPrefixes) {
    $p = $prefix.Replace("\", "/")
    if ($normalized.StartsWith($p, [StringComparison]::OrdinalIgnoreCase)) { return $true }
  }
  $leafNames = @(
    "package.json", "package-lock.json", "tsconfig.json",
    "next.config.ts", "next.config.mjs", "next.config.js",
    "postcss.config.mjs", "postcss.config.js",
    "tailwind.config.ts", "tailwind.config.js",
    "eslint.config.mjs", "eslint.config.js",
    "components.json", "AGENTS.md", "CLAUDE.md"
  )
  foreach ($name in $leafNames) {
    if ($normalized.EndsWith("/$name", [StringComparison]::OrdinalIgnoreCase)) { return $true }
  }
  return $false
}

function Get-EditedPaths($payload) {
  $paths = [System.Collections.Generic.List[string]]::new()
  if ($null -eq $payload) { return $paths }

  foreach ($key in @("file_path", "path", "filePath")) {
    $value = $payload.$key
    if ($value) { $paths.Add([string]$value) }
  }

  foreach ($key in @("paths", "edited_paths", "editedPaths", "files")) {
    $value = $payload.$key
    if ($value) {
      foreach ($item in $value) {
        if ($item -is [string]) {
          $paths.Add($item)
        } elseif ($item.path) {
          $paths.Add([string]$item.path)
        } elseif ($item.file_path) {
          $paths.Add([string]$item.file_path)
        }
      }
    }
  }

  return $paths
}

try {
  $raw = [Console]::In.ReadToEnd()
  if ($raw) {
    $payload = $raw | ConvertFrom-Json
    foreach ($path in (Get-EditedPaths $payload)) {
      if (Test-TrackedPath $path) {
        $dir = Split-Path $PendingFile -Parent
        if (-not (Test-Path $dir)) {
          New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        Set-Content -Path $PendingFile -Value (Get-Date).ToString("o") -Encoding UTF8
        break
      }
    }
  }
} catch {
  # Fail open — never block edits because of checkpoint bookkeeping.
}

Write-Output "{}"
exit 0
