$filePath = "src\pages\VendorDashboard.jsx"
$content = [System.IO.File]::ReadAllText($filePath)
$old = "                  onOpenQr={handleOpenQr}`r`n                  onRequestClick={setSelectedRequest}`r`n                  sheetState={sheetState}`r`n                  setSheetState={setSheetState}`r`n                />"
$new = "                  onOpenQr={handleOpenQr}`r`n                  onRequestClick={setSelectedRequest}`r`n                  sheetState={sheetState}`r`n                  setSheetState={setSheetState}`r`n                  onRefreshRequests={fetchRequests}`r`n                />"
if ($content.Contains($old)) {
    $content = $content.Replace($old, $new)
    [System.IO.File]::WriteAllText($filePath, $content)
    Write-Host "SUCCESS - onRefreshRequests added"
} else {
    Write-Host "Pattern not found - dumping nearby lines:"
    $lines = $content -split "`n"
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "onOpenQr|setSheetState|onRequestClick") {
            Write-Host "Line $i : $($lines[$i])"
        }
    }
}
