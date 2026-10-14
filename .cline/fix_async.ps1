$log = "f:\VScode\store\.cline\fix.log"
Remove-Item $log -ErrorAction SilentlyContinue
$bat = "f:\VScode\store\.cline\do_fix.bat"
$done = "f:\VScode\store\.cline\fix_done.txt"
Remove-Item $done -ErrorAction SilentlyContinue
$NODE = "$env:LOCALAPPDATA\node"
@(
  "@echo off",
  "setlocal",
  "cd /d f:\VScode\store",
  "set npm_config_progress=false",
  "set npm_config_audit=false",
  "set npm_config_fund=false",
  "set PATH=$NODE;%PATH%",
  "echo === devdeps === >> `"$log`"",
  "call `"$NODE\npm.cmd`" install -D @types/bcryptjs@^2.4.6 tsx@^4.19.2 vitest@^2.1.9 @vitejs/plugin-react@^4.3.4 vite-tsconfig-paths@^5.1.4 dotenv-cli@^7.4.4 >> `"$log`" 2>&1",
  "echo DEV_EXIT=%errorlevel% >> `"$log`"",
  "echo === approve scripts === >> `"$log`"",
  "call `"$NODE\npm.cmd`" install-scripts approve prisma @prisma/engines @prisma/client unrs-resolver >> `"$log`" 2>&1",
  "echo APPROVE_EXIT=%errorlevel% >> `"$log`"",
  "echo FIX_COMPLETE > `"$done`""
) | Set-Content $bat -Encoding ASCII
Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$bat`"" -WindowStyle Hidden
"LAUNCHED" | Out-File "f:\VScode\store\.cline\fix_launch.txt" -Encoding utf8
