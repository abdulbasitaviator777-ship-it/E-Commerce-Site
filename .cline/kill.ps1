$out = "f:\VScode\store\.cline\kill.log"
Remove-Item $out -ErrorAction SilentlyContinue
$lines = @()
$procs = Get-Process node -ErrorAction SilentlyContinue
foreach ($p in $procs) {
  $lines += "Killing PID $($p.Id)"
  Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2
$remaining = Get-Process node -ErrorAction SilentlyContinue
$lines += "Remaining node procs: $($remaining.Count)"
$lines | Out-File $out -Encoding utf8
