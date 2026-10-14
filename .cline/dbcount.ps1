$out = "f:\VScode\store\.cline\dbcounts.log"
Remove-Item $out -ErrorAction SilentlyContinue
$env:Path = "$env:LOCALAPPDATA\node;$env:Path"
Set-Location "f:\VScode\store"
& cmd.exe /c "node .cline\dbcount.js 2>&1" | Out-File $out -Append -Encoding utf8

