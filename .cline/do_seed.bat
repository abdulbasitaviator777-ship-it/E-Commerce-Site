@echo off
setlocal
cd /d f:\VScode\store
set PATH=C:\Users\Nova\AppData\Local\node;%PATH%
echo === db:seed === >> "f:\VScode\store\.cline\seed_run.log"
call "C:\Users\Nova\AppData\Local\node\npx.cmd" tsx prisma/seed.ts >> "f:\VScode\store\.cline\seed_run.log" 2>&1
echo SEED_EXIT=%errorlevel% >> "f:\VScode\store\.cline\seed_run.log"
echo SEED_COMPLETE > "f:\VScode\store\.cline\seed_run_done.txt"
