$out = "f:\VScode\store\.cline\engines.log"
Remove-Item $out -ErrorAction SilentlyContinue
$lines = @()
$engines = "f:\VScode\store\node_modules\@prisma\engines"
$lines += "engines dir exists: $(Test-Path $engines)"
if (Test-Path $engines) {
  Get-ChildItem $engines -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object { $lines += "  $($_.FullName.Replace('f:\VScode\store\node_modules\',''))" }
}
$prismaClient = "f:\VScode\store\node_modules\.prisma\client"
$lines += ".prisma/client exists: $(Test-Path $prismaClient)"
$lines | Out-File $out -Encoding utf8
