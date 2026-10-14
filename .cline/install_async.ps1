$log = "f:\VScode\store\.cline\install_run.log"
$done = "f:\VScode\store\.cline\install_done.txt"
Remove-Item $log,$done -ErrorAction SilentlyContinue
$env:Path = "$env:LOCALAPPDATA\node;$env:Path"
$npm = "$env:LOCALAPPDATA\node\npm.cmd"
Set-Location "f:\VScode\store"
# Build a batch file so the whole install (prod + dev deps) runs detached and
# writes a completion marker when finished.
$bat = "f:\VScode\store\.cline\do_install.bat"
@(
  "@echo off",
  "setlocal",
  "cd /d f:\VScode\store",
  "set npm_config_progress=false",
  "set npm_config_audit=false",
  "set npm_config_fund=false",
  "call `"$env:LOCALAPPDATA\node\npm.cmd`" install prisma@^7 @prisma/client@^7 zod lucide-react clsx tailwind-merge bcryptjs > `"$log`" 2>&1",
  "echo PROD_EXIT=%errorlevel% >> `"$log`"",
  "call `"$env:LOCALAPPDATA\node\npm.cmd`" install -D @types/bcryptjs tsx vitest @vitejs/plugin-react vite-tsconfig-paths dotenv-cli >> `"$log`" 2>&1",
  "echo DEV_EXIT=%errorlevel% >> `"$log`"",
  "echo INSTALL_COMPLETE > `"$done`""
) | Set-Content $bat -Encoding ASCII
# Launch fully detached so it survives after this shell exits.
Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$bat`"" -WindowStyle Hidden
"LAUNCHED" | Out-File "f:\VScode\store\.cline\launch.txt" -Encoding utf8
