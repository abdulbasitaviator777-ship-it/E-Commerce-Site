$out = "f:\VScode\store\.cline\check.log"
Remove-Item $out -ErrorAction SilentlyContinue
$env:Path = "$env:LOCALAPPDATA\node;$env:Path"
$lines = @()
$lines += "node procs:"
Get-Process node -ErrorAction SilentlyContinue | ForEach-Object { $lines += "  PID $($_.Id) CPU=$([math]::Round($_.CPU,1))s" }
$pkgs = @('prisma','zod','lucide-react','bcryptjs','clsx','tailwind-merge','@prisma/client')
foreach ($p in $pkgs) {
  $path = "f:\VScode\store\node_modules\$p"
  $lines += "$p = $(Test-Path $path)"
}
$lines | Out-File $out -Encoding utf8
