# Quick sanity check: confirms the search UI still uses the canonical components.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

$checks = @(
  @{
    file = "src/components/listings/ListingsSearchView.tsx"
    mustContain = @("SearchListingCardGrid", "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2")
  },
  @{
    file = "src/components/search/LocationSearchField.tsx"
    mustContain = @("Πού", "Προσθήκη προορισμού")
  },
  @{
    file = "src/components/map/PropertyMapLoader.tsx"
    mustContain = @("MidoraResultsMap")
  },
  @{
    file = "src/components/listings/SearchListingCard.tsx"
    mustNotContain = @("ListingCardBadges")
  },
  @{
    file = "src/app/listings/page.tsx"
    mustContain = @("getUnavailablePeriodsByListingIds")
  }
)

$failed = 0

foreach ($check in $checks) {
  $path = Join-Path $Root $check.file
  if (-not (Test-Path $path)) {
    Write-Host "FAIL missing file: $($check.file)" -ForegroundColor Red
    $failed++
    continue
  }

  $content = Get-Content $path -Raw

  foreach ($needle in @($check.mustContain)) {
    if (-not $needle) { continue }
    if ($content -notmatch [regex]::Escape($needle)) {
      Write-Host "FAIL $($check.file) missing: $needle" -ForegroundColor Red
      $failed++
    }
  }

  foreach ($needle in @($check.mustNotContain)) {
    if (-not $needle) { continue }
    if ($content -match [regex]::Escape($needle)) {
      Write-Host "FAIL $($check.file) should not contain: $needle" -ForegroundColor Red
      $failed++
    }
  }
}

if ($failed -eq 0) {
  Write-Host "OK - canonical search UI files look correct." -ForegroundColor Green
  exit 0
}

Write-Host ""
Write-Host "$failed check(s) failed. Run npm run checkpoint:list and compare with last good snapshot."
exit 1
