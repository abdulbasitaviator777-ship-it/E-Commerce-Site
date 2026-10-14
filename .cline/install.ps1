$out = "f:\VScode\store\.cline\deps2.log"
Remove-Item $out -ErrorAction SilentlyContinue
$env:Path = "$env:LOCALAPPDATA\node;$env:Path"
$env:npm_config_progress = "false"
$env:npm_config_audit = "false"
$env:npm_config_fund = "false"
Set-Location "f:\VScode\store"
"=== START npm install ===" | Out-File $out -Encoding utf8
& cmd.exe /c "npm install prisma@^7 @prisma/client@^7 zod lucide-react clsx tailwind-merge bcryptjs 2>&1" | Out-File $out -Append -Encoding utf8
"=== npm install EXIT: $LASTEXITCODE ===" | Out-File $out -Append -Encoding utf8
& cmd.exe /c "npm install -D @types/bcryptjs tsx vitest @vitejs/plugin-react vite-tsconfig-paths dotenv-cli 2>&1" | Out-File $out -Append -Encoding utf8
"=== npm install -D EXIT: $LASTEXITCODE ===" | Out-File $out -Append -Encoding utf8
