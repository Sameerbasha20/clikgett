# Builds signed Play Store bundles (.aab) for both apps against the production API.
#
#   .\build-release.ps1 -ApiUrl https://api.clikgett.com/api
#
# Needs (both git-ignored):
#   UserApp\android\key.properties   and   Deliveryboy\key.properties
# with storeFile / storePassword / keyAlias / keyPassword for each app's upload key
# (see Deliveryboy\key.properties.example). Without them Gradle would sign with the
# debug key, which Play rejects, so this script stops instead.
param(
    [Parameter(Mandatory = $true)][string]$ApiUrl,
    # Address search key; defaults to GOOGLE_PLACES_KEY in ..\..\deploy\app-keys.env.
    [string]$PlacesKey = "",
    [string]$Flutter = "C:\src\flutter\bin\flutter.bat"
)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

if ($ApiUrl -notmatch '^https://') { throw "ApiUrl must be an https:// address (got $ApiUrl)." }
$ApiUrl = $ApiUrl.TrimEnd('/')

foreach ($keyFile in @("$root\UserApp\android\key.properties", "$root\Deliveryboy\key.properties")) {
    if (-not (Test-Path $keyFile)) { throw "Missing $keyFile (upload key settings). See Deliveryboy\key.properties.example." }
}

if (-not $PlacesKey) {
    $keysFile = Join-Path $root "..\..\deploy\app-keys.env"
    if (Test-Path $keysFile) {
        $line = Get-Content $keysFile | Where-Object { $_ -match '^GOOGLE_PLACES_KEY=' } | Select-Object -First 1
        if ($line) { $PlacesKey = ($line -replace '^GOOGLE_PLACES_KEY=', '').Trim() }
    }
}
if (-not $PlacesKey) { throw "No Places key: pass -PlacesKey or set GOOGLE_PLACES_KEY in deploy\app-keys.env (address search needs it)." }

Write-Host "Customer app -> $ApiUrl"
Push-Location "$root\UserApp"
try {
    & $Flutter build appbundle --release "--dart-define=API_BASE_URL=$ApiUrl" "--dart-define=GOOGLE_PLACES_KEY=$PlacesKey"
    if ($LASTEXITCODE -ne 0) { throw "Customer app build failed" }
} finally { Pop-Location }

Write-Host "Delivery app -> $ApiUrl/"
Push-Location "$root\Deliveryboy"
try {
    & .\gradlew.bat bundleRelease "-PapiBaseUrl=$ApiUrl/"
    if ($LASTEXITCODE -ne 0) { throw "Delivery app build failed" }
} finally { Pop-Location }

Write-Host ""
Write-Host "Upload these to Play Console:"
Write-Host "  $root\UserApp\build\app\outputs\bundle\release\app-release.aab"
Write-Host "  $root\Deliveryboy\app\build\outputs\bundle\release\app-release.aab"
