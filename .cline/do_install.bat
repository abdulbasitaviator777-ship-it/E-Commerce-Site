@echo off
setlocal
cd /d f:\VScode\store
set npm_config_progress=false
set npm_config_audit=false
set npm_config_fund=false
call "C:\Users\Nova\AppData\Local\node\npm.cmd" install prisma@^7 @prisma/client@^7 zod lucide-react clsx tailwind-merge bcryptjs > "f:\VScode\store\.cline\install_run.log" 2>&1
echo PROD_EXIT=%errorlevel% >> "f:\VScode\store\.cline\install_run.log"
call "C:\Users\Nova\AppData\Local\node\npm.cmd" install -D @types/bcryptjs tsx vitest @vitejs/plugin-react vite-tsconfig-paths dotenv-cli >> "f:\VScode\store\.cline\install_run.log" 2>&1
echo DEV_EXIT=%errorlevel% >> "f:\VScode\store\.cline\install_run.log"
echo INSTALL_COMPLETE > "f:\VScode\store\.cline\install_done.txt"
