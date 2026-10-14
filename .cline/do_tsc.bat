@echo off
setlocal
cd /d f:\VScode\store
set PATH=C:\Users\Nova\AppData\Local\node;%PATH%
echo === tsc --noEmit === > "f:\VScode\store\.cline\tsc.log"
call "C:\Users\Nova\AppData\Local\node\npx.cmd" tsc --noEmit >> "f:\VScode\store\.cline\tsc.log" 2>&1
echo TSC_EXIT=%errorlevel% >> "f:\VScode\store\.cline\tsc.log"
echo TSC_COMPLETE > "f:\VScode\store\.cline\tsc_done.txt"
