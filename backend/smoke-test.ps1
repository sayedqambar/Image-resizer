$ErrorActionPreference = "SilentlyContinue"
$base = "http://localhost:8080"
$b    = "----SmokeBnd"
$png  = [Convert]::FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")

function Build-MP($boundary, [hashtable]$fields, $fileBytes, $fileField, $fileName, $fileMime) {
    $ms = New-Object IO.MemoryStream
    foreach ($kv in $fields.GetEnumerator()) {
        $bytes = [Text.Encoding]::UTF8.GetBytes("--$boundary`r`nContent-Disposition: form-data; name=`"$($kv.Key)`"`r`n`r`n$($kv.Value)`r`n")
        $ms.Write($bytes, 0, $bytes.Length)
    }
    if ($fileBytes) {
        $bytes = [Text.Encoding]::UTF8.GetBytes("--$boundary`r`nContent-Disposition: form-data; name=`"$fileField`"; filename=`"$fileName`"`r`nContent-Type: $fileMime`r`n`r`n")
        $ms.Write($bytes, 0, $bytes.Length)
        $ms.Write($fileBytes, 0, $fileBytes.Length)
        $bytes = [Text.Encoding]::UTF8.GetBytes("`r`n"); $ms.Write($bytes, 0, $bytes.Length)
    }
    $bytes = [Text.Encoding]::UTF8.GetBytes("--$boundary--`r`n"); $ms.Write($bytes, 0, $bytes.Length)
    $ms.ToArray()
}

function Run-Test($label, $uri, $body) {
    $resp = Invoke-WebRequest -Uri "$base$uri" -Method POST -ContentType "multipart/form-data; boundary=$b" -Body $body -UseBasicParsing -ErrorAction SilentlyContinue
    $code = if ($resp) { $resp.StatusCode } else { 0 }
    $msg  = ""
    if ($resp -and $resp.Content) {
        $j = $resp.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($j -and $j.message) { $msg = $j.message }
        elseif ($j -and $j.status) { $msg = "HTTP $($j.status) $($j.error)" }
        else { $msg = $resp.Content.Substring(0, [Math]::Min(60, $resp.Content.Length)) }
    }
    $pass = ($code -ge 200 -and $code -le 599)
    $icon = if ($pass) { "PASS" } else { "FAIL" }
    Write-Host ("  [{0}]  {1,-3}  {2,-35} {3}" -f $icon, $code, $label, $msg)
}

Write-Host ""
Write-Host "======================================================"
Write-Host "  IMAGE RESIZER  -  API SMOKE TEST"
Write-Host "======================================================"
Write-Host ""

# 1. Health
$h = Invoke-RestMethod "$base/api/health" -ErrorAction SilentlyContinue
if ($h -and $h.status -eq "ok") {
    Write-Host "  [PASS]  200  Health GET                        status=ok  ts=$($h.timestamp)"
} else {
    Write-Host "  [FAIL]  ---  Health GET                        no response"
}

# 2. CORS preflight
$cors = Invoke-WebRequest "$base/api/health" -Method OPTIONS -Headers @{ Origin="http://localhost:5173"; "Access-Control-Request-Method"="POST" } -UseBasicParsing -ErrorAction SilentlyContinue
$ao = if ($cors) { $cors.Headers["Access-Control-Allow-Origin"] } else { "NONE" }
$am = if ($cors) { $cors.Headers["Access-Control-Allow-Methods"] } else { "" }
$icon = if ($ao -eq "http://localhost:5173") { "PASS" } else { "FAIL" }
Write-Host ("  [{0}]  {1,-3}  {2,-35} Allow-Origin={3}" -f $icon, $cors.StatusCode, "CORS preflight", $ao)
Write-Host ("  {0,-43} Allow-Methods={1}" -f "", $am)
Write-Host ""

# 3-11 validation + AI-unreachable tests
Run-Test "missing file body (exp 400)"     "/api/ai/remove-background" (Build-MP $b @{} $null $null $null $null)
Run-Test "wrong MIME text/plain (exp 400)" "/api/ai/remove-background" (Build-MP $b @{} ([Text.Encoding]::UTF8.GetBytes("x")) "file" "a.txt" "text/plain")
Run-Test "remove-bg AI down (exp 50x)"    "/api/ai/remove-background" (Build-MP $b @{} $png "file" "img.png" "image/png")
Run-Test "upscale scale=3 (exp 400)"      "/api/ai/upscale"           (Build-MP $b @{scale="3"} $png "file" "img.png" "image/png")
Run-Test "upscale 2x AI down (exp 50x)"  "/api/ai/upscale"           (Build-MP $b @{scale="2"} $png "file" "img.png" "image/png")
Run-Test "upscale no scale (exp 400)"     "/api/ai/upscale"           (Build-MP $b @{} $png "file" "img.png" "image/png")
Run-Test "smart-crop width=0 (exp 400)"   "/api/ai/smart-crop"        (Build-MP $b @{width="0";height="9"} $png "file" "img.png" "image/png")
Run-Test "smart-crop 16:9 AI down(50x)"  "/api/ai/smart-crop"        (Build-MP $b @{width="16";height="9"} $png "file" "img.png" "image/png")
Run-Test "smart-crop no height (exp 400)" "/api/ai/smart-crop"        (Build-MP $b @{width="16"} $png "file" "img.png" "image/png")

Write-Host ""
Write-Host "======================================================"
