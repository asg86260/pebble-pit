# Supervises the board of times' server for the auto-start scheduled task:
# a restart loop, no console window. Ported from last-ball-standing's
# deploy/run-app.ps1, whose notes apply verbatim:
#
# - Launch via Start-Process -Wait -PassThru with SEPARATE stdout/stderr
#   files, never `& bun *>> log`: PowerShell 5.1 wraps a native exe's stderr
#   as NativeCommandError and corrupts exit-code detection.
# - A global named mutex keeps this to ONE supervisor, so a stray `bun run dev`
#   cannot take over the port.
#
# Logs, in server\logs\: app.log (this supervisor), server-out.log and
# server-err.log (the server, overwritten each launch).

$ErrorActionPreference = "Stop"
$root = "C:\git\boulder-clicker\server"
$bun  = (Get-Command bun).Source
$port = 3100

$logDir = Join-Path $root "logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$log    = Join-Path $logDir "app.log"
$outLog = Join-Path $logDir "server-out.log"
$errLog = Join-Path $logDir "server-err.log"

function Log($msg) { "$(Get-Date -Format o)  $msg" | Out-File -FilePath $log -Append -Encoding utf8 }

Set-Location $root

$mutex = New-Object System.Threading.Mutex($false, "Global\pebble-times-app-supervisor")
try {
  $hasHandle = $mutex.WaitOne(0)
} catch [System.Threading.AbandonedMutexException] {
  $hasHandle = $true
}
if (-not $hasHandle) { Log "another supervisor already running - exiting"; exit 0 }

$baseDelay = 3
$maxDelay = 60
$minHealthy = 30
$maxFastCrashes = 6
$delay = $baseDelay
$fastCrashes = 0

try {
  while ($true) {
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique |
      ForEach-Object {
        try { Stop-Process -Id $_ -Force -ErrorAction Stop; Log "freed port $port (killed PID $_)" } catch {}
      }

    $startedAt = Get-Date
    Log "==== app start ===="
    try {
      $env:PORT = "$port"
      $env:TIMES_DB = Join-Path $root "times.sqlite"
      $proc = Start-Process -FilePath $bun `
        -ArgumentList "src\index.ts" `
        -WorkingDirectory $root -WindowStyle Hidden -PassThru -Wait `
        -RedirectStandardOutput $outLog -RedirectStandardError $errLog
      $code = $proc.ExitCode
    } catch {
      Log "LAUNCH ERROR: $_"
      $code = -1
    }
    $ranFor = ((Get-Date) - $startedAt).TotalSeconds
    Log "==== app exited code $code after $([int]$ranFor)s ===="

    if ($ranFor -ge $minHealthy) {
      $fastCrashes = 0
      $delay = $baseDelay
    } else {
      $fastCrashes++
      if ($fastCrashes -ge $maxFastCrashes) {
        Log "==== giving up after $fastCrashes fast crashes - check logs\server-err.log, then restart the task ===="
        break
      }
      $delay = [Math]::Min($delay * 2, $maxDelay)
    }
    Log "==== restarting in $delay s ===="
    Start-Sleep -Seconds $delay
  }
} finally {
  $mutex.ReleaseMutex()
  $mutex.Dispose()
}
