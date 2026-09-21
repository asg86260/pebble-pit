# Registers the two logon-triggered scheduled tasks that keep
# times.graham-things.com up: the server supervisor and the tunnel supervisor.
# Ported from last-ball-standing's deploy/register-tasks.ps1.
#
#   powershell -ExecutionPolicy Bypass -File server\deploy\register-tasks.ps1
#   powershell -ExecutionPolicy Bypass -File server\deploy\register-tasks.ps1 -Remove
#
# Logon-triggered and run as the current user: no admin rights, no stored
# password. Each script holds its own named mutex, so a task firing while an
# instance already runs is a no-op.

param([switch]$Remove)

$ErrorActionPreference = "Stop"
$root = "C:\git\boulder-clicker\server"
$tasks = @(
  @{ Name = "pebble-times-app";    Script = "$root\deploy\run-app.ps1" },
  @{ Name = "pebble-times-tunnel"; Script = "$root\deploy\run-tunnel.ps1" }
)

foreach ($t in $tasks) {
  if (Get-ScheduledTask -TaskName $t.Name -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $t.Name -Confirm:$false
    Write-Host "removed existing task $($t.Name)"
  }
  if ($Remove) { continue }

  $argStr = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $t.Script + '"'
  $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $argStr -WorkingDirectory $root
  $trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero)

  Register-ScheduledTask -TaskName $t.Name -Action $action -Trigger $trigger `
    -Settings $settings -Description "Pebble Pit board of times - $($t.Name)" | Out-Null
  Write-Host "registered $($t.Name)"
}

if (-not $Remove) {
  Write-Host ""
  Write-Host "Start them now without logging out:"
  Write-Host "  Start-ScheduledTask -TaskName pebble-times-app"
  Write-Host "  Start-ScheduledTask -TaskName pebble-times-tunnel"
}
