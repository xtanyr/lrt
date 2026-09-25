param([string]$OutputDirectory = ".local/releases")
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$output = [System.IO.Path]::GetFullPath((Join-Path $root $OutputDirectory))
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$releaseName = "lrt-uat-$stamp"
$tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$stage = Join-Path $tempRoot $releaseName
$archive = Join-Path $output "$releaseName.zip"
$excludedDirectories = @(".git", ".codex", ".agents", ".windsurf", ".superpowers", ".local", "node_modules", "dist", "coverage", "graphify-out")
$excludedExtensions = @(".xlsx", ".xls", ".dump", ".log")

if (-not $output.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Output directory must stay inside the project workspace: $output"
}
if (-not $stage.StartsWith($tempRoot.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Staging directory escaped the system temp directory: $stage"
}
New-Item -ItemType Directory -Force -Path $output, $stage | Out-Null
try {
  Get-ChildItem -LiteralPath $root -Force -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($root.Length).TrimStart([char[]]@('\', '/'))
    $segments = $relative -split '[\\/]'
    if ($segments | Where-Object { $excludedDirectories -contains $_ } | Select-Object -First 1) { return }
    if ($_.Name -eq ".env" -or $_.Name -like ".env.*" -and $_.Name -ne ".env.example") { return }
    if ($excludedExtensions -contains $_.Extension.ToLowerInvariant()) { return }
    if ($_.Name -match '^(backup|database|prod|production).*(\.sql|\.dump|\.bak)$') { return }
    $destination = Join-Path $stage $relative
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null
    Copy-Item -LiteralPath $_.FullName -Destination $destination
  }

  $manifest = Get-ChildItem -LiteralPath $stage -File -Recurse | ForEach-Object {
    [pscustomobject]@{
      path = $_.FullName.Substring($stage.Length).TrimStart([char[]]@('\', '/')).Replace('\', '/')
      sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
      bytes = $_.Length
    }
  } | Sort-Object path
  $manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $stage "release-manifest.json") -Encoding utf8
  if (Test-Path -LiteralPath $archive) { throw "Release archive already exists: $archive" }
  [System.IO.Compression.ZipFile]::CreateFromDirectory($stage, $archive, [System.IO.Compression.CompressionLevel]::Optimal, $false)

  $zip = [System.IO.Compression.ZipFile]::OpenRead($archive)
  try {
    $bad = $zip.Entries | Where-Object { $_.FullName -match '(^|/)\.env($|/)|(^|/)\.env\.(?!example($|/))|(^|/)(node_modules|dist|coverage|\.git|\.local|graphify-out)(/|$)|\.(xlsx|xls|dump|log)$' }
    if ($bad) { throw "Forbidden release content: $($bad.FullName -join ', ')" }
  } finally { $zip.Dispose() }
  $hash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
  Set-Content -LiteralPath "$archive.sha256" -Value "$hash  $(Split-Path -Leaf $archive)" -Encoding ascii
  Write-Output "Release: $archive"
  Write-Output "SHA-256: $hash"
} finally {
  if ((Test-Path -LiteralPath $stage) -and $stage.StartsWith($tempRoot.TrimEnd([char[]]@('\', '/')) + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    Remove-Item -LiteralPath $stage -Recurse -Force
  }
}
