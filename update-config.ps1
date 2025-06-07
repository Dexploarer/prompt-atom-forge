$configPath = 'C:\Users\blind\.prompt-or-die\config.json'
$content = Get-Content $configPath -Raw
$content = $content -replace 'http://localhost:3000', 'http://localhost:8080'
Set-Content $configPath -Value $content
Write-Host 'Config updated successfully!'