# Supervises the `pebble-times` Cloudflare Tunnel for the auto-start scheduled
# task. Ported from last-ball-standing's deploy/run-tunnel.ps1.
#
# --config IS PASSED EXPLICITLY, every time: this machine has three tunnels and
# ~/.cloudflared/config.yml belongs to pirate-ship. Without the flag cloudflared
# reads that file and uses the pirate-ship tunnel id whatever name is on the
# command line, which is how another hostname once got CNAMEd to the wrong
# tunnel. Never drop it.

$ErrorActionPreference = "Stop"
$root = "C:\git\boulder-clicker\server"
$cfg  = "C:\Users\asg86\.cloudflared\config-pebble.yml"
$tunnel = "pebble-times"

$logDir = Join-Path $root "logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$log    = Join-Path $logDir "tunnel.log"
$outLog = Join-Path $logDir "tunnel-out.log"
$errLog = Join-Path $logDir "tunnel-err.log"

function Log($msg) { "$(Get-Date -Format o)  $msg" | Out-File -FilePath $log -Append -Encoding utf8 }

$cloudflared = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
if (-not $cloudflared) { Log "cloudflared not on PATH - install it"; exit 1 }
if (-not (Test-Path $cfg)) { Log "missing config $cfg"; exit 1 }

$mutex = New-Object System.Threading.Mutex($false, "Global\pebble-times-tunnel-supervisor")
try { $hasHandle = $mutex.WaitOne(0) }
catch [System.Threading.AbandonedMutexException] { $hasHandle = $true }
if (-not $hasHandle) { Log "another tunnel supervisor already running - exiting"; exit 0 }

$delay = 5
try {
  while ($true) {
    $startedAt = Get-Date
    Log "==== tunnel start ===="
    try {
      $proc = Start-Process -FilePath $cloudflared `
        -ArgumentList "tunnel", "--config", "`"$cfg`"", "run", $tunnel `
        -WorkingDirectory $root -WindowStyle Hidden -PassThru -Wait `
        -RedirectStandardOutput $outLog -RedirectStandardError $errLog
      $code = $proc.ExitCode
    } catch {
      Log "LAUNCH ERROR: $_"
      $code = -1
    }
    $ranFor = ((Get-Date) - $startedAt).TotalSeconds
    Log "==== tunnel exited code $code after $([int]$ranFor)s - restarting in $delay s ===="
    Start-Sleep -Seconds $delay
  }
} finally {
  $mutex.ReleaseMutex()
  $mutex.Dispose()
}
