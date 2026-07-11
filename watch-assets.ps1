param(
    [string]$SiteRoot = $PSScriptRoot
)

$ErrorActionPreference = 'Stop'

$customRoot = Join-Path $SiteRoot 'custom'
$refreshScript = Join-Path $SiteRoot 'refresh-assets.ps1'

if (-not (Test-Path -LiteralPath $refreshScript)) {
    Write-Error "refresh-assets.ps1 not found at $refreshScript"
    exit 1
}

$global:WatchSiteRoot = $SiteRoot
$global:LastRefresh = [DateTime]::MinValue

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $customRoot
$watcher.IncludeSubdirectories = $true
$watcher.Filter = '*.*'
$watcher.NotifyFilter = [System.IO.NotifyFilters]::FileName -bor [System.IO.NotifyFilters]::LastWrite
$watcher.EnableRaisingEvents = $true

$action = {
    $now = [DateTime]::Now
    if (($now - $global:LastRefresh).TotalSeconds -lt 1) { return }
    $global:LastRefresh = $now
    $script = Join-Path $global:WatchSiteRoot 'refresh-assets.ps1'
    try {
        & $script | Out-Null
        Write-Host ("[watch] {0} - assets changed, manifest refreshed" -f (Get-Date -Format 'HH:mm:ss'))
    } catch {
        Write-Warning ("[watch] refresh failed: {0}" -f $_.Exception.Message)
    }
}

Register-ObjectEvent -InputObject $watcher -EventName Created -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName Deleted -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName Renamed -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName Changed -Action $action | Out-Null

Write-Host "Watching $customRoot for asset changes. Manifest will refresh automatically. Ctrl+C to stop."
try {
    while ($true) { Start-Sleep -Seconds 1 }
} finally {
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
}
