$configPath = 'C:\Users\blind\.prompt-or-die\config.json'
$content = Get-Content $configPath -Raw
$updatedContent = $content -replace 'https://www.promptordie.tech', 'http://www.promptordie.tech'
Set-Content $configPath $updatedContent
Write-Host "Updated webAppUrl to HTTP"
Get-Content $configPath