$log = "f:\VScode\store\.cline\ui.log"
$done = "f:\VScode\store\.cline\ui_done.txt"
Remove-Item $log,$done -ErrorAction SilentlyContinue
$bat = "f:\VScode\store\.cline\do_ui.bat"
$NODE = "$env:LOCALAPPDATA\node"
@(
  "@echo off",
  "setlocal",
  "cd /d f:\VScode\store",
  "set npm_config_progress=false",
  "set npm_config_audit=false",
  "set npm_config_fund=false",
  "set PATH=$NODE;%PATH%",
  "echo === ui deps === >> `"$log`"",
  "call `"$NODE\npm.cmd`" install class-variance-authority @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-select @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-avatar @radix-ui/react-separator >> `"$log`" 2>&1",
  "echo INSTALL_EXIT=%errorlevel% >> `"$log`"",
  "call `"$NODE\npm.cmd`" install-scripts approve @radix-ui/rc-tooltip esbuild sharp >> `"$log`" 2>&1",
  "echo UI_COMPLETE > `"$done`""
) | Set-Content $bat -Encoding ASCII
Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$bat`"" -WindowStyle Hidden
"LAUNCHED" | Out-File "f:\VScode\store\.cline\ui_launch.txt" -Encoding utf8
