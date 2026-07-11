param(
    [string]$SiteRoot = $PSScriptRoot
)

$ErrorActionPreference = 'Stop'

$customRoot = Join-Path $SiteRoot 'custom'
$manifestPath = Join-Path $SiteRoot 'assets\data\assets-manifest.json'
$manifestJsPath = Join-Path $SiteRoot 'assets\data\assets-manifest.js'
$supportedExtensions = @('.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg')

$flatCategories = @(
    'country-flags',
    'piece-colors',
    'board-skins',
    'portraits',
    'banners',
    'ui-icons',
    'battlefx'
)

$subfolderCategories = @(
    @{ name = 'piece-designs'; label = 'Design Frames' }
)

$pieceTypeRoot = Join-Path $customRoot 'pieces'
if (-not (Test-Path -LiteralPath $pieceTypeRoot)) {
    New-Item -ItemType Directory -Path $pieceTypeRoot -Force | Out-Null
}

$pieceCategories = @(
    Get-ChildItem -LiteralPath $pieceTypeRoot -Directory |
        Sort-Object Name |
        ForEach-Object { @{ name = "pieces/$($_.Name)"; label = "Piece: $($_.Name)" } }
)

function Convert-ToLabel {
    param([string]$Name)

    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($Name)
    $clean = $baseName -replace '[-_]+', ' '
    $words = $clean -split '\s+' | Where-Object { $_ -ne '' }
    return (($words | ForEach-Object {
        if ($_.Length -gt 1) {
            $_.Substring(0, 1).ToUpper() + $_.Substring(1).ToLower()
        } else {
            $_.ToUpper()
        }
    }) -join ' ')
}

function Get-RelativeSiteUrl {
    param(
        [string]$Root,
        [string]$FilePath
    )

    $rootWithSlash = $Root
    if (-not $rootWithSlash.EndsWith('\')) {
        $rootWithSlash += '\'
    }

    $rootUri = New-Object System.Uri($rootWithSlash)
    $fileUri = New-Object System.Uri($FilePath)
    $relativePath = $rootUri.MakeRelativeUri($fileUri).ToString()
    $normalized = [System.Uri]::UnescapeDataString($relativePath) -replace '\\', '/'
    return './' + $normalized
}

foreach ($item in $flatCategories) {
    $categoryPath = Join-Path $customRoot $item
    if (-not (Test-Path -LiteralPath $categoryPath)) {
        New-Item -ItemType Directory -Path $categoryPath -Force | Out-Null
    }
}

foreach ($item in $subfolderCategories) {
    $categoryPath = Join-Path $customRoot $item.name
    if (-not (Test-Path -LiteralPath $categoryPath)) {
        New-Item -ItemType Directory -Path $categoryPath -Force | Out-Null
    }
}

$manifestAssets = [ordered]@{}
$counts = [ordered]@{}

foreach ($category in $flatCategories) {
    $categoryPath = Join-Path $customRoot $category
    $files = Get-ChildItem -LiteralPath $categoryPath -File |
        Where-Object { $supportedExtensions -contains $_.Extension.ToLowerInvariant() } |
        Sort-Object Name

    $manifestAssets[$category] = @(
        foreach ($file in $files) {
            [ordered]@{
                category = $category
                fileName = $file.Name
                label = Convert-ToLabel -Name $file.Name
                url = Get-RelativeSiteUrl -Root $SiteRoot -FilePath $file.FullName
            }
        }
    )

    $counts[$category] = $manifestAssets[$category].Count
}

foreach ($entry in ($subfolderCategories + $pieceCategories)) {
    $category = $entry.name
    $categoryPath = Join-Path $customRoot $category
    $files = Get-ChildItem -LiteralPath $categoryPath -File -Recurse |
        Where-Object { $supportedExtensions -contains $_.Extension.ToLowerInvariant() } |
        Sort-Object FullName

    $manifestAssets[$category] = @(
        foreach ($file in $files) {
            [ordered]@{
                category = $category
                fileName = $file.Name
                label = Convert-ToLabel -Name $file.Name
                url = Get-RelativeSiteUrl -Root $SiteRoot -FilePath $file.FullName
            }
        }
    )

    $counts[$category] = $manifestAssets[$category].Count
}

$manifest = [ordered]@{
    generatedAt = [DateTime]::UtcNow.ToString('o')
    root = './custom'
    counts = $counts
    assets = $manifestAssets
}

$json = $manifest | ConvertTo-Json -Depth 8
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($manifestPath, $json, $utf8NoBom)
[System.IO.File]::WriteAllText($manifestJsPath, "window.PagkamakabayanAssetManifest = $json;", $utf8NoBom)

Write-Host "Asset manifest refreshed at $manifestPath"
Write-Host "Script manifest refreshed at $manifestJsPath"
foreach ($key in $counts.Keys) {
    Write-Host (" - {0}: {1}" -f $key, $counts[$key])
}
