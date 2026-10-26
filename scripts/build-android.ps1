param(
    [string]$JavaHome = $env:JAVA_HOME,
    [string]$AndroidSdk = $env:ANDROID_HOME
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$previousLocation = Get-Location
$previousJavaHome = $env:JAVA_HOME
$previousAndroidHome = $env:ANDROID_HOME
$previousAndroidSdkRoot = $env:ANDROID_SDK_ROOT

try {
    if (-not $JavaHome -or -not (Test-Path -LiteralPath (Join-Path $JavaHome 'bin\java.exe'))) {
        throw 'Set JAVA_HOME to a JDK 21 installation, or pass -JavaHome.'
    }
    if (-not $AndroidSdk -or -not (Test-Path -LiteralPath (Join-Path $AndroidSdk 'platforms\android-36\android.jar'))) {
        throw 'Set ANDROID_HOME to an Android SDK with platform 36, or pass -AndroidSdk.'
    }
    $env:JAVA_HOME = (Resolve-Path -LiteralPath $JavaHome).Path
    $env:ANDROID_HOME = (Resolve-Path -LiteralPath $AndroidSdk).Path
    $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
    Set-Location -LiteralPath $projectRoot

    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Web production build failed.' }
    & npx.cmd cap sync android
    if ($LASTEXITCODE -ne 0) { throw 'Capacitor Android sync failed.' }

    Set-Location -LiteralPath (Join-Path $projectRoot 'android')
    & .\gradlew.bat --no-daemon :app:assembleDebug :app:lintDebug
    if ($LASTEXITCODE -ne 0) { throw 'Android build or lint failed.' }

    $builtApk = Join-Path $projectRoot 'android\app\build\outputs\apk\debug\app-debug.apk'
    $buildTools = Get-ChildItem -LiteralPath (Join-Path $AndroidSdk 'build-tools') -Directory |
        Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'apksigner.bat') } |
        Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
    if (-not $buildTools) { throw 'Android SDK Build Tools with apksigner are required.' }
    & (Join-Path $buildTools.FullName 'apksigner.bat') verify --verbose $builtApk
    if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
    & (Join-Path $buildTools.FullName 'zipalign.exe') -c -P 16 4 $builtApk
    if ($LASTEXITCODE -ne 0) { throw 'APK alignment verification failed.' }

    # Verify the complete game was bundled, including every original painted asset.
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $apkArchive = [System.IO.Compression.ZipFile]::OpenRead($builtApk)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $distRoot = Join-Path $projectRoot 'dist'
    $assetCount = 0
    try {
        foreach ($asset in Get-ChildItem -LiteralPath $distRoot -File -Recurse) {
            $relativeName = $asset.FullName.Substring($distRoot.Length + 1).Replace('\', '/')
            $entry = $apkArchive.GetEntry("assets/public/$relativeName")
            if (-not $entry) { throw "APK is missing bundled game asset: $relativeName" }
            $entryStream = $entry.Open()
            try { $packedHash = [BitConverter]::ToString($sha256.ComputeHash($entryStream)).Replace('-', '') }
            finally { $entryStream.Dispose() }
            if ($packedHash -ne (Get-FileHash -LiteralPath $asset.FullName -Algorithm SHA256).Hash) {
                throw "APK asset differs from the production build: $relativeName"
            }
            $assetCount++
        }
    }
    finally { $sha256.Dispose(); $apkArchive.Dispose() }
    Write-Output "Verified $assetCount bundled game files byte-for-byte."

    $version = (Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw | ConvertFrom-Json).version
    $artifactDirectory = Join-Path $projectRoot 'artifacts\android'
    New-Item -ItemType Directory -Path $artifactDirectory -Force | Out-Null
    $artifactPath = Join-Path $artifactDirectory "nine-heavens-v$version-debug.apk"
    Copy-Item -LiteralPath $builtApk -Destination $artifactPath -Force
    $checksum = (Get-FileHash -LiteralPath $artifactPath -Algorithm SHA256).Hash.ToLowerInvariant()
    "$checksum  $(Split-Path -Leaf $artifactPath)" | Set-Content -LiteralPath "$artifactPath.sha256" -Encoding utf8
    Write-Output "APK: $artifactPath"
    Write-Output "SHA256: $checksum"
}
finally {
    Set-Location -LiteralPath $previousLocation.Path
    $env:JAVA_HOME = $previousJavaHome
    $env:ANDROID_HOME = $previousAndroidHome
    $env:ANDROID_SDK_ROOT = $previousAndroidSdkRoot
}
