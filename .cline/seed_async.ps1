$log = "f:\VScode\store\.cline\seed_run.log"
$done = "f:\VScode\store\.cline\seed_run_done.txt"
Remove-Item $log,$done -ErrorAction SilentlyContinue
$bat = "f:\VScode\store\.cline\do_seed.bat"
$NODE = "$env:LOCALAPPDATA\node"
@(
  "@echo off",
  "setlocal",
  "cd /d f:\VScode\store",
  "set PATH=$NODE;%PATH%",
  "echo === db:seed === >> `"$log`"",
  "call `"$NODE\npx.cmd`" tsx prisma/seed.ts >> `"$log`" 2>&1",
  "echo SEED_EXIT=%errorlevel% >> `"$log`"",
  "echo SEED_COMPLETE > `"$done`""
) | Set-Content $bat -Encoding ASCII
Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$bat`"" -WindowStyle Hidden
"LAUNCHED" | Out-File "f:\VScode\store\.cline\seed_launch.txt" -Encoding utf8
