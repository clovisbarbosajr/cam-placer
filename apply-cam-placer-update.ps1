# =============================================================================
#  cam-placer — apply imperial / Hikvision update and push to GitHub
#  Run from any PowerShell window (no admin needed).
# =============================================================================

$projectPath = "C:\Users\clovi\OneDrive\Desktop\cameras"
$zipPath     = "$env:USERPROFILE\Downloads\cam-placer-imperial.zip"

# ---- 1. Sanity checks ------------------------------------------------------
if (-not (Test-Path $projectPath)) {
    Write-Host "ERROR: Project folder not found at $projectPath" -ForegroundColor Red
    return
}
if (-not (Test-Path $zipPath)) {
    Write-Host "ERROR: ZIP not found at $zipPath" -ForegroundColor Red
    Write-Host "Download cam-placer-imperial.zip into your Downloads folder first." -ForegroundColor Yellow
    return
}

Push-Location $projectPath

# ---- 2. Confirm the folder is the right git repo ---------------------------
$remote = git remote get-url origin 2>$null
if ($remote -notmatch "cam-placer") {
    Write-Host "ERROR: $projectPath is not the cam-placer repo (remote = $remote). Aborting." -ForegroundColor Red
    Pop-Location
    return
}
Write-Host "Repo confirmed: $remote" -ForegroundColor Green

# ---- 3. Stash any local changes (safety net) -------------------------------
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
git stash push -u -m "claude-backup-$ts" 2>&1 | Out-Null
Write-Host "Local changes stashed under: claude-backup-$ts" -ForegroundColor Yellow

# ---- 4. Pull latest from remote (Lovable may have committed) ---------------
$branch = git rev-parse --abbrev-ref HEAD
Write-Host "Pulling latest from origin/$branch ..." -ForegroundColor Cyan
git pull origin $branch 2>&1 | Out-Null

# ---- 5. Extract ZIP over the project ---------------------------------------
# Expand-Archive -Force overwrites files of the same name. Files unique to the
# local folder (e.g. .git/, node_modules/) are preserved.
Write-Host "Extracting $zipPath ..." -ForegroundColor Cyan
Expand-Archive -Path $zipPath -DestinationPath $projectPath -Force
Write-Host "Extraction complete." -ForegroundColor Green

# ---- 6. Show what changed --------------------------------------------------
Write-Host "`nFiles changed:" -ForegroundColor Cyan
git status --short

# ---- 7. Commit & push ------------------------------------------------------
git add -A
$staged = git diff --cached --name-only
if (-not $staged) {
    Write-Host "Nothing to commit. Already up to date." -ForegroundColor Yellow
    Pop-Location
    return
}

git commit -m "feat: imperial units (ft) + Hikvision ColorVu 8MP specs + camera placement v2"
Write-Host "Pushing to origin/$branch ..." -ForegroundColor Cyan
git push origin $branch

Pop-Location
Write-Host "`nDone. Lovable should detect the push within ~1 minute." -ForegroundColor Green
