# Servidor estático APENAS para visualizar o site localmente sem Node.js.
# Não processa formulários (/api/leads) nem o painel: para isso use "node server.js".
param([int]$Port = $(if ($env:PORT) { [int]$env:PORT } else { 8080 }))
$root = Join-Path $PSScriptRoot 'public'
$mime = @{ '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='application/javascript; charset=utf-8'; '.json'='application/json; charset=utf-8'; '.svg'='image/svg+xml'; '.jpg'='image/jpeg'; '.png'='image/png'; '.webp'='image/webp' }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Host "Visualização em http://localhost:$Port (Ctrl+C para parar)"
while ($l.IsListening) {
  $ctx = $l.GetContext(); $res = $ctx.Response
  try {
    $p = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($p.EndsWith('/')) { $p += 'index.html' }
    $f = [IO.Path]::GetFullPath((Join-Path $root $p.TrimStart('/')))
    if ($f.StartsWith($root) -and (Test-Path $f -PathType Leaf)) {
      $b = [IO.File]::ReadAllBytes($f)
      $ext = [IO.Path]::GetExtension($f).ToLower()
      $res.ContentType = if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
      $res.OutputStream.Write($b, 0, $b.Length)
    } else {
      $res.StatusCode = 404
      $b = [Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"Rota indisponivel no servidor de visualizacao."}')
      $res.ContentType = 'application/json'
      $res.OutputStream.Write($b, 0, $b.Length)
    }
  } catch { $res.StatusCode = 500 } finally { $res.Close() }
}
