param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$variant = 'original'
$port = 5173
$address = "http://127.0.0.1:$port/"
$projectRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$expectedRoot = [Uri]::new((Join-Path $projectRoot 'vite.config.ts')).AbsoluteUri
$startedServer = $null
function Test-Variant {
    try {
        $identity = Invoke-RestMethod -Uri ($address + '__fact_variant') -TimeoutSec 2
        return ($identity.variant -eq $variant -and $identity.root -eq $expectedRoot)
    } catch { return $false }
}
try {
    if (-not (Test-Variant)) {
        $vite = Join-Path $projectRoot 'node_modules\vite\bin\vite.js'
        if (-not (Test-Path -LiteralPath $vite)) {
            throw 'Dependencies missing. Run npm.cmd ci in this project first.'
        }
        $nodeExe = (Get-Command node.exe -ErrorAction Stop).Source
        $startedServer = Start-Process -FilePath $nodeExe -ArgumentList @('"' + $vite + '"') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
        $ready = $false
        for ($attempt = 0; $attempt -lt 30; $attempt++) {
            Start-Sleep -Milliseconds 300
            if ($startedServer.HasExited) { break }
            if (Test-Variant) { $ready = $true; break }
        }
        if (-not $ready) {
            if (-not $startedServer.HasExited) { Stop-Process -Id $startedServer.Id }
            throw "This variant could not start on port $port. Check whether another service uses it; no other variant was opened."
        }
    }
    if (-not $NoBrowser) { Start-Process $address }
    Write-Output "FACT $variant ready: $address"
} catch {
    Write-Error $_ -ErrorAction Continue
    exit 1
}
