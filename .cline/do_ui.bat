@echo off
setlocal
cd /d f:\VScode\store
set npm_config_progress=false
set npm_config_audit=false
set npm_config_fund=false
set PATH=C:\Users\Nova\AppData\Local\node;%PATH%
echo === ui deps === >> "f:\VScode\store\.cline\ui.log"
call "C:\Users\Nova\AppData\Local\node\npm.cmd" install class-variance-authority @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-select @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-avatar @radix-ui/react-separator >> "f:\VScode\store\.cline\ui.log" 2>&1
echo INSTALL_EXIT=%errorlevel% >> "f:\VScode\store\.cline\ui.log"
call "C:\Users\Nova\AppData\Local\node\npm.cmd" install-scripts approve @radix-ui/rc-tooltip esbuild sharp >> "f:\VScode\store\.cline\ui.log" 2>&1
echo UI_COMPLETE > "f:\VScode\store\.cline\ui_done.txt"
