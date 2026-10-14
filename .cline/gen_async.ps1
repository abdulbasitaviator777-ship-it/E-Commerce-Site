$log = "f:\VScode\store\.cline\gen.log"
$done = "f:\VScode\store\.cline\gen_done.txt"
Remove-Item $log,$done -ErrorAction SilentlyContinue
$bat = "f:\VScode\store\.cline\do_gen.bat"
$NODE = "$env:LOCALAPPDATA\node"
@(
  "@echo off",
  "setlocal",
  "cd /d f:\VScode\store",
  "set PATH=$NODE;%PATH%",
  "echo === approve esbuild === >> `"$log`"",
  "call `"$NODE\npm.cmd`" install-scripts approve esbuild >> `"$log`" 2>&1",
  "echo === prisma generate === >> `"$log`"",
  "call `"$NODE\npx.cmd`" prisma generate >> `"$log`" 2>&1",
  "echo GEN_EXIT=%errorlevel% >> `"$log`"",
  "echo GEN_COMPLETE > `"$done`""
) | Set-Content $bat -Encoding ASCII
Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$bat`"" -WindowStyle Hidden
"LAUNCHED" | Out-File "f:\VScode\store\.cline\gen_launch.txt" -Encoding utf8
