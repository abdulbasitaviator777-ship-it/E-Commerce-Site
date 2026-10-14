$log = "f:\VScode\store\.cline\migrate.log"
$done = "f:\VScode\store\.cline\migrate_done.txt"
Remove-Item $log,$done -ErrorAction SilentlyContinue
$bat = "f:\VScode\store\.cline\do_migrate.bat"
$NODE = "$env:LOCALAPPDATA\node"
@(
  "@echo off",
  "setlocal",
  "cd /d f:\VScode\store",
  "set PATH=$NODE;%PATH%",
  "echo === prisma migrate dev === >> `"$log`"",
  "call `"$NODE\npx.cmd`" prisma migrate dev --name init --skip-seed >> `"$log`" 2>&1",
  "echo MIGRATE_EXIT=%errorlevel% >> `"$log`"",
  "echo MIGRATE_COMPLETE > `"$done`""
) | Set-Content $bat -Encoding ASCII
Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$bat`"" -WindowStyle Hidden
"LAUNCHED" | Out-File "f:\VScode\store\.cline\migrate_launch.txt" -Encoding utf8
