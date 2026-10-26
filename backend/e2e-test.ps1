$ErrorActionPreference = "Continue"

# Generate a real 64x64 PNG using Python (avoids base64 shell encoding issues)
$py = "ai-service\.venv\Scripts\python.exe"
$tmpPng = "$env:TEMP\e2e_test.png"
& $py -c "
from PIL import Image, ImageDraw
img = Image.new('RGB', (64, 64), (34, 197, 94))
d = ImageDraw.Draw(img)
d.ellipse([16, 16, 48, 48], fill=(255, 255, 255))
img.save(r'$($tmpPng -replace '\\','\\\\')'.replace('\\\\\\\\','\\\\'))
print('PNG created')
" 2>&1
if (-not (Test-Path $tmpPng)) {
    # fallback: copy any PNG from Pictures
    $fallback = Get-ChildItem "$env:USERPROFILE\Pictures" -Filter "*.png" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($fallback) { Copy-Item $fallback.FullName $tmpPng }
}

Write-Host ""
Write-Host "============================================"
Write-Host "  FULL STACK E2E TESTS"
Write-Host "  Frontend : http://localhost:5173"
Write-Host "  Backend  : http://localhost:8080"
Write-Host "  AI Svc   : http://localhost:8000"
Write-Host "============================================"
Write-Host ""

function Test-Endpoint {
    param($label, [string[]]$curlArgs, $expectCode, $expectBytes)
    $outFile = "$env:TEMP\e2e_out_$([System.IO.Path]::GetRandomFileName()).png"
    $allArgs = @("-s", "-o", $outFile, "-w", "%{http_code}", "--max-time", "180") + $curlArgs
    $code = & curl.exe @allArgs 2>&1
    $size = if (Test-Path $outFile) { (Get-Item $outFile).Length } else { 0 }
    Remove-Item $outFile -ErrorAction SilentlyContinue

    $codeInt = [int]$code
    $icon    = if ($codeInt -eq $expectCode) { "PASS" } else { "FAIL" }
    $extra   = if ($size -gt 10) { " output=$size bytes" } else { "" }
    Write-Host ("  [{0}]  HTTP {1,-4}  {2}{3}" -f $icon, $codeInt, $label, $extra)
}

function Test-Json {
    param($label, [string[]]$curlArgs, $expectCode)
    $allArgs = @("-s", "-w", "`n%{http_code}", "--max-time", "10") + $curlArgs
    $out  = & curl.exe @allArgs 2>&1
    $parts = $out -split "`n"
    $code = ($parts | Select-Object -Last 1).Trim()
    $body = ($parts | Select-Object -SkipLast 1) -join ""
    $j    = $body | ConvertFrom-Json -ErrorAction SilentlyContinue
    $msg  = if ($j.message) { $j.message } elseif ($j.status) { "HTTP $($j.status) $($j.error)" } elseif ($j.status_ok -or $j.status) { "status=$($j.status)" } else { $body.Substring(0,[Math]::Min(60,$body.Length)) }
    $codeInt = [int]$code
    $icon = if ($codeInt -eq $expectCode) { "PASS" } else { "FAIL" }
    Write-Host ("  [{0}]  HTTP {1,-4}  {2,-40} {3}" -f $icon, $codeInt, $label, $msg)
}

# ── AI Service direct ────────────────────────────────────────────────────────
Write-Host "  -- AI service (direct) --"
Test-Json      "Health"                              @("-X","GET","http://127.0.0.1:8000/health")                                                200
Test-Json      "Wrong MIME -> 415"                   @("-X","POST","http://127.0.0.1:8000/remove-background","-F","file=@$tmpPng;type=text/plain") 415
Test-Endpoint  "remove-background (real image)"     @("-X","POST","http://127.0.0.1:8000/remove-background","-F","file=@$tmpPng;type=image/png") 200 1
Test-Endpoint  "smart-crop 1:1 (real image)"        @("-X","POST","http://127.0.0.1:8000/smart-crop","-F","file=@$tmpPng;type=image/png","-F","aspect_w=1","-F","aspect_h=1") 200 1
Write-Host ""

# ── Backend proxy ────────────────────────────────────────────────────────────
Write-Host "  -- Backend proxy (Spring Boot -> AI service) --"
Test-Json      "Health"                              @("-X","GET","http://localhost:8080/api/health")                                           200
Test-Json      "Missing file -> 400"                 @("-X","POST","http://localhost:8080/api/ai/remove-background")                             400
Test-Json      "Wrong MIME -> 400"                   @("-X","POST","http://localhost:8080/api/ai/remove-background","-F","file=@$tmpPng;type=text/plain") 400
Test-Endpoint  "remove-background proxy"            @("-X","POST","http://localhost:8080/api/ai/remove-background","-F","file=@$tmpPng;type=image/png") 200 1
Test-Json      "scale=3 -> 400"                     @("-X","POST","http://localhost:8080/api/ai/upscale","-F","file=@$tmpPng;type=image/png","-F","scale=3") 400
Test-Endpoint  "smart-crop 16:9 proxy"              @("-X","POST","http://localhost:8080/api/ai/smart-crop","-F","file=@$tmpPng;type=image/png","-F","width=16","-F","height=9") 200 1
Write-Host ""

Write-Host "  -- Upscale 2x (downloads ~64 MB weights on first run) --"
Test-Endpoint  "upscale 2x proxy"                   @("-X","POST","http://localhost:8080/api/ai/upscale","-F","file=@$tmpPng;type=image/png","-F","scale=2") 200 1
Write-Host ""

Write-Host "============================================"
Remove-Item $tmpPng -ErrorAction SilentlyContinue
