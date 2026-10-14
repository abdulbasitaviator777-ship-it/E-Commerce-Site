@echo off
setlocal
cd /d f:\VScode\store
set PATH=C:\Users\Nova\AppData\Local\node;%PATH%
echo === prisma migrate dev === >> "f:\VScode\store\.cline\migrate.log"
call "C:\Users\Nova\AppData\Local\node\npx.cmd" prisma migrate dev --name init --skip-seed >> "f:\VScode\store\.cline\migrate.log" 2>&1
echo MIGRATE_EXIT=%errorlevel% >> "f:\VScode\store\.cline\migrate.log"
echo MIGRATE_COMPLETE > "f:\VScode\store\.cline\migrate_done.txt"
