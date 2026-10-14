# .cline/run.ps1 — reliable command runner for this constrained environment.
# Writes all output to a log file that we then read back (shell capture is flaky).
param(
  [Parameter(Mandatory=$true)][string]$Log,
  [Parameter(Mandatory=$true)][string]$Command,
  [string]$Dir = "f:\VScode\store"
)
$env:Path = "$env:LOCALAPPDATA\node;$env:Path"
$ErrorActionPreference = "Continue"
Remove-Item $Log -ErrorAction SilentlyContinue
Set-Location $Dir
"=== CMD: $Command ===" | Out-File $Log -Encoding utf8
$sw = [System.Diagnostics.Stopwatch]::StartNew()
& cmd.exe /c "$Command 2>&1" | Out-File $Log -Append -Encoding utf8
"=== EXIT: $LASTEXITCODE (elapsed $([math]::Round($sw.Elapsed.TotalSeconds,1))s) ===" | Out-File $Log -Append -Encoding utf8
