$log = "f:\VScode\store\.cline\p6.log"
$done = "f:\VScode\store\.cline\p6_done.txt"
Remove-Item $log,$done -ErrorAction SilentlyContinue
$bat = "f:\VScode\store\.cline\do_p6.bat"
$NODE = "$env:LOCALAPPDATA\node"
@(
  "@echo off",
  "setlocal",
  "cd /d f:\VScode\store",
  "set npm_config_progress=false",
  "set npm_config_audit=false",
  "set npm_config_fund=false",
  "set PATH=$NODE;%PATH%",
  "echo === downgrade prisma to v6 === >> `"$log`"",
  "call `"$NODE\npm.cmd`" install prisma@^6 @prisma/client@^6 >> `"$log`" 2>&1",
  "echo INSTALL_EXIT=%errorlevel% >> `"$log`"",
  "call `"$NODE\npm.cmd`" install-scripts approve prisma @prisma/engines @prisma/client >> `"$log`" 2>&1",
  "echo APPROVE_EXIT=%errorlevel% >> `"$log`"",
  "echo === prisma generate === >> `"$log`"",
  "call `"$NODE\npx.cmd`" prisma generate >> `"$log`" 2>&1",
  "echo GEN_EXIT=%errorlevel% >> `"$log`"",
  "echo P6_COMPLETE > `"$done`""
) | Set-Content $bat -Encoding ASCII
Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$bat`"" -WindowStyle Hidden
"LAUNCHED" | Out-File "f:\VScode\store\.cline\p6_launch.txt" -Encoding utf8
