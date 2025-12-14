# Office Visits Analyzer - GitHub Deployment Script
# Run this after creating your GitHub repository

Write-Host "🚀 Office Visits Analyzer - GitHub Deployment" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "❌ Git not initialized. Run 'git init' first." -ForegroundColor Red
    exit 1
}

# Get GitHub username and repository name
Write-Host "📝 Please provide your GitHub details:" -ForegroundColor Yellow
$username = Read-Host "GitHub Username"
$repoName = Read-Host "Repository Name (e.g., office-visits-analyzer)"

if ([string]::IsNullOrWhiteSpace($username) -or [string]::IsNullOrWhiteSpace($repoName)) {
    Write-Host "❌ Username and repository name are required!" -ForegroundColor Red
    exit 1
}

$repoUrl = "https://github.com/$username/$repoName.git"

Write-Host ""
Write-Host "📋 Configuration:" -ForegroundColor Green
Write-Host "  Repository: $repoUrl"
Write-Host "  GitHub Pages URL: https://$username.github.io/$repoName/"
Write-Host ""

# Confirm
$confirm = Read-Host "Continue with deployment? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "❌ Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔧 Setting up remote..." -ForegroundColor Cyan

# Remove existing remote if it exists
git remote remove origin 2>$null

# Add remote
git remote add origin $repoUrl

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to add remote. Please check your repository URL." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Remote added successfully" -ForegroundColor Green

# Rename branch to main
Write-Host "🔧 Renaming branch to main..." -ForegroundColor Cyan
git branch -M main

# Push to GitHub
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully deployed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Go to: https://github.com/$username/$repoName/settings/pages"
    Write-Host "  2. Under 'Source', select 'main' branch"
    Write-Host "  3. Click 'Save'"
    Write-Host "  4. Wait 1-2 minutes for deployment"
    Write-Host "  5. Visit: https://$username.github.io/$repoName/"
    Write-Host ""
    Write-Host "🔒 Privacy Reminder:" -ForegroundColor Magenta
    Write-Host "  - Your Timeline JSON data is NOT in the repository"
    Write-Host "  - Data is stored locally in your browser's IndexedDB"
    Write-Host "  - Consider making the repository private in settings"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Push failed. Please check:" -ForegroundColor Red
    Write-Host "  - Repository exists on GitHub"
    Write-Host "  - You have write access"
    Write-Host "  - Git credentials are configured"
    Write-Host ""
    Write-Host "💡 Manual push command:" -ForegroundColor Yellow
    Write-Host "  git push -u origin main"
}
