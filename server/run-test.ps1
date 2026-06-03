$env:LLM_PROVIDER = "mock"
$env:API_KEY = "test-key"
$env:PORT = "3001"
$env:DATA_DIR = ".\data"
Set-Location $PSScriptRoot
# 杀掉占用 3001 端口的旧进程
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 1
# 清理上次的日志和数据
Remove-Item "data\*.json" -ErrorAction SilentlyContinue
Remove-Item "server.out.log" -ErrorAction SilentlyContinue
Remove-Item "server.err.log" -ErrorAction SilentlyContinue
$server = Start-Process -FilePath "node" -ArgumentList "src/server.js" -WorkingDirectory $PSScriptRoot -RedirectStandardOutput "server.out.log" -RedirectStandardError "server.err.log" -PassThru -NoNewWindow
Start-Sleep -Seconds 2
Write-Host "Server PID: $($server.Id)"
Get-Content "server.out.log" -ErrorAction SilentlyContinue
Write-Host "--- running tests ---"
& node scripts/test-api.js 2>&1
$env:HOST = "127.0.0.1"
$env:PORT = "3001"
$env:API_KEY = "test-key"
& node scripts/test-api.js 2>&1
Write-Host "--- shutting down ---"
Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
