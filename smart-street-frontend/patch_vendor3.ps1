$filePath = "src\pages\VendorDashboard.jsx"
$content = [System.IO.File]::ReadAllText($filePath)
# Try LF line endings
$old = "                  onOpenQr={handleOpenQr}`n                  onRequestClick={setSelectedRequest}`n                  sheetState={sheetState}`n                  setSheetState={setSheetState}`n                />"
$new = "                  onOpenQr={handleOpenQr}`n                  onRequestClick={setSelectedRequest}`n                  sheetState={sheetState}`n                  setSheetState={setSheetState}`n                  onRefreshRequests={fetchRequests}`n                />"
if ($content.Contains($old)) {
    $content = $content.Replace($old, $new)
    [System.IO.File]::WriteAllText($filePath, $content)
    Write-Host "SUCCESS - onRefreshRequests added with LF"
} else {
    Write-Host "Pattern not found with LF. Trying to find lines..."
    $lines = $content -split "`n"
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "handleOpenQr|setSheetState|onRequestClick") {
            Write-Host "Line $($i+1): [$($lines[$i])]"
        }
    }
}
