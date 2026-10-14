$out = "f:\VScode\store\.cline\versions.log"
Remove-Item $out -ErrorAction SilentlyContinue
$lines = @()
$pkgs = @('prisma','zod','lucide-react','bcryptjs','clsx','tailwind-merge','@prisma/client')
foreach ($p in $pkgs) {
  $pj = "f:\VScode\store\node_modules\$p\package.json"
  if (Test-Path $pj) {
    try {
      $json = Get-Content $pj -Raw | ConvertFrom-Json
      $lines += "$p=$($json.version)"
    } catch {
      $lines += "$p=PARSE_ERR"
    }
  } else {
    $lines += "$p=MISSING"
  }
}
$lines | Out-File $out -Encoding utf8
