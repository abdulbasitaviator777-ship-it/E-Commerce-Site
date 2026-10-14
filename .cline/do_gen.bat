@echo off
setlocal
cd /d f:\VScode\store
set PATH=C:\Users\Nova\AppData\Local\node;%PATH%
echo === approve esbuild === >> "f:\VScode\store\.cline\gen.log"
call "C:\Users\Nova\AppData\Local\node\npm.cmd" install-scripts approve esbuild >> "f:\VScode\store\.cline\gen.log" 2>&1
echo === prisma generate === >> "f:\VScode\store\.cline\gen.log"
call "C:\Users\Nova\AppData\Local\node\npx.cmd" prisma generate >> "f:\VScode\store\.cline\gen.log" 2>&1
echo GEN_EXIT=%errorlevel% >> "f:\VScode\store\.cline\gen.log"
echo GEN_COMPLETE > "f:\VScode\store\.cline\gen_done.txt"
