# Convierte recursivamente todos los archivos .ts de una carpeta a .mp4
# Uso:
#   .\convert-ts-to-mp4.ps1 -Path "C:\Users\nas\Downloads\ts-conversion"
#   .\convert-ts-to-mp4.ps1 -Path "C:\...\curso" -DeleteOriginal
#   .\convert-ts-to-mp4.ps1 -Path "C:\...\curso" -ReEncode           # modo lento para archivos corruptos
#   .\convert-ts-to-mp4.ps1 -Path "C:\...\curso" -RetryFailed        # re-procesa solo los .ts sin .mp4 adyacente

param(
    [Parameter(Mandatory = $true)]
    [string]$Path,

    [switch]$DeleteOriginal,
    [switch]$ReEncode,
    [switch]$RetryFailed
)

if (-not (Test-Path $Path)) {
    Write-Error "No existe la ruta: $Path"
    exit 1
}

$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
    Write-Error "ffmpeg no esta instalado. Ejecuta: winget install ffmpeg"
    exit 1
}

$logPath = Join-Path $Path "conversion-errors.log"
"=== Conversion started: $(Get-Date) ===" | Out-File $logPath -Encoding utf8

$allTs = Get-ChildItem -Path $Path -Recurse -Filter *.ts

if ($RetryFailed) {
    $files = $allTs | Where-Object {
        $mp4 = [System.IO.Path]::ChangeExtension($_.FullName, '.mp4')
        -not (Test-Path $mp4)
    }
    Write-Host "`nModo RetryFailed: $($files.Count) archivos sin .mp4 adyacente" -ForegroundColor Yellow
} else {
    $files = $allTs
}

if ($files.Count -eq 0) {
    Write-Host "No hay archivos para procesar." -ForegroundColor Yellow
    exit 0
}

$mode = if ($ReEncode) { "RE-ENCODE (lento pero robusto)" } else { "REMUX (rapido)" }
Write-Host "`nModo: $mode" -ForegroundColor Cyan
Write-Host "Archivos: $($files.Count)" -ForegroundColor Cyan
Write-Host "Log de errores: $logPath`n" -ForegroundColor DarkGray

$ok = 0
$fail = 0
$failedFiles = @()
$i = 0

foreach ($file in $files) {
    $i++
    $mp4 = [System.IO.Path]::ChangeExtension($file.FullName, '.mp4')

    if ((Test-Path $mp4) -and -not $RetryFailed) {
        Write-Host "[$i/$($files.Count)] SKIP (ya existe): $($file.Name)" -ForegroundColor DarkGray
        continue
    }

    Write-Host "[$i/$($files.Count)] $($file.Name)" -ForegroundColor White

    if ($ReEncode) {
        # Re-encodea video a H.264 y audio a AAC. Arregla problemas de codec/timestamps.
        $args = @(
            '-fflags', '+genpts+igndts',
            '-err_detect', 'ignore_err',
            '-i', $file.FullName,
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '20',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-movflags', '+faststart',
            '-loglevel', 'error',
            '-y', $mp4
        )
    } else {
        # Remux: solo cambia contenedor, sin re-codificar.
        $args = @(
            '-i', $file.FullName,
            '-c', 'copy',
            '-bsf:a', 'aac_adtstoasc',
            '-loglevel', 'error',
            '-y', $mp4
        )
    }

    $errorOutput = & ffmpeg @args 2>&1

    if ($LASTEXITCODE -eq 0 -and (Test-Path $mp4) -and (Get-Item $mp4).Length -gt 0) {
        $ok++
        if ($DeleteOriginal) {
            Remove-Item $file.FullName -Force
        }
    } else {
        $fail++
        $failedFiles += $file.FullName
        Write-Host "   FALLO: $($file.Name)" -ForegroundColor Red
        "--- FAIL: $($file.FullName) ---" | Out-File $logPath -Append -Encoding utf8
        $errorOutput | Out-File $logPath -Append -Encoding utf8
        if (Test-Path $mp4) { Remove-Item $mp4 -Force }
    }
}

Write-Host "`nConvertidos: $ok / $($files.Count) | Fallos: $fail" -ForegroundColor Green

if ($fail -gt 0) {
    Write-Host "`nArchivos que fallaron:" -ForegroundColor Yellow
    $failedFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    Write-Host "`nDetalles del error en: $logPath" -ForegroundColor Yellow
    if (-not $ReEncode) {
        Write-Host "Sugerencia: re-intenta los fallos con:" -ForegroundColor Cyan
        Write-Host "  .\convert-ts-to-mp4.ps1 -Path `"$Path`" -RetryFailed -ReEncode" -ForegroundColor White
    }
}

if ($DeleteOriginal -and $ok -gt 0) {
    Write-Host "Los .ts convertidos fueron borrados." -ForegroundColor Yellow
}
