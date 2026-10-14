$out = "f:\VScode\store\.cline\uicheck.log"
Remove-Item $out -ErrorAction SilentlyContinue
$lines = @()
$pkgs = @('class-variance-authority','@radix-ui/react-slot','@radix-ui/react-dialog','@radix-ui/react-label','@radix-ui/react-toast','@radix-ui/react-tabs','@radix-ui/react-select','@radix-ui/react-dropdown-menu','@radix-ui/react-separator','@radix-ui/react-avatar')
foreach ($p in $pkgs) {
  $path = "f:\VScode\store\node_modules\$p\package.json"
  if (Test-Path $path) {
    $v = (Get-Content $path -Raw | ConvertFrom-Json).version
    $lines += "$p=$v OK"
  } else {
    $lines += "$p=MISSING"
  }
}
$lines | Out-File $out -Encoding utf8
