$filePath = "src\pages\VendorDashboard.jsx"
$content = Get-Content $filePath -Raw
$old = "                  onOpenQr={handleOpenQr}`r`n                  onRequestClick={setSelectedRequest}`r`n                  sheetState={sheetState}`r`n                  setSheetState={setSheetState}`r`n                />"
$new = "                  onOpenQr={handleOpenQr}`r`n                  onRequestClick={setSelectedRequest}`r`n                  sheetState={sheetState}`r`n                  setSheetState={setSheetState}`r`n                  onRefreshRequests={fetchRequests}`r`n                />"
$content = $content.Replace($old, $new)
Set-Content -Path $filePath -Value $content -NoNewline
Write-Host "Done"
