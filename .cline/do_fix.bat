@echo off
setlocal
cd /d f:\VScode\store
set npm_config_progress=false
set npm_config_audit=false
set npm_config_fund=false
set PATH=C:\Users\Nova\AppData\Local\node;%PATH%
echo === devdeps === >> "f:\VScode\store\.cline\fix.log"
call "C:\Users\Nova\AppData\Local\node\npm.cmd" install -D @types/bcryptjs@^2.4.6 tsx@^4.19.2 vitest@^2.1.9 @vitejs/plugin-react@^4.3.4 vite-tsconfig-paths@^5.1.4 dotenv-cli@^7.4.4 >> "f:\VScode\store\.cline\fix.log" 2>&1
echo DEV_EXIT=%errorlevel% >> "f:\VScode\store\.cline\fix.log"
echo === approve scripts === >> "f:\VScode\store\.cline\fix.log"
call "C:\Users\Nova\AppData\Local\node\npm.cmd" install-scripts approve prisma @prisma/engines @prisma/client unrs-resolver >> "f:\VScode\store\.cline\fix.log" 2>&1
echo APPROVE_EXIT=%errorlevel% >> "f:\VScode\store\.cline\fix.log"
echo FIX_COMPLETE > "f:\VScode\store\.cline\fix_done.txt"
