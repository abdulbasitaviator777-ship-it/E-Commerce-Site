@echo off
setlocal
cd /d f:\VScode\store
set npm_config_progress=false
set npm_config_audit=false
set npm_config_fund=false
set PATH=C:\Users\Nova\AppData\Local\node;%PATH%
echo === downgrade prisma to v6 === >> "f:\VScode\store\.cline\p6.log"
call "C:\Users\Nova\AppData\Local\node\npm.cmd" install prisma@^6 @prisma/client@^6 >> "f:\VScode\store\.cline\p6.log" 2>&1
echo INSTALL_EXIT=%errorlevel% >> "f:\VScode\store\.cline\p6.log"
call "C:\Users\Nova\AppData\Local\node\npm.cmd" install-scripts approve prisma @prisma/engines @prisma/client >> "f:\VScode\store\.cline\p6.log" 2>&1
echo APPROVE_EXIT=%errorlevel% >> "f:\VScode\store\.cline\p6.log"
echo === prisma generate === >> "f:\VScode\store\.cline\p6.log"
call "C:\Users\Nova\AppData\Local\node\npx.cmd" prisma generate >> "f:\VScode\store\.cline\p6.log" 2>&1
echo GEN_EXIT=%errorlevel% >> "f:\VScode\store\.cline\p6.log"
echo P6_COMPLETE > "f:\VScode\store\.cline\p6_done.txt"
