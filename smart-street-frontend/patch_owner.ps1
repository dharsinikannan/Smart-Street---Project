$filePath = "src\pages\OwnerAddSpace.jsx"
$lines = Get-Content $filePath
$out = @()
$skip = $false
$i = 0
while ($i -lt $lines.Count) {
    $line = $lines[$i]
    # Detect start of the old image block
    if ($line -match '^\s+<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">' -and $i -lt ($lines.Count - 2) -and $lines[$i+1] -match 'image_1|image_2|image1Ref|type="url"') {
        # Skip old block until we hit </div> that closes the outer div
        $depth = 0
        while ($i -lt $lines.Count) {
            if ($lines[$i] -match "<div") { $depth++ }
            if ($lines[$i] -match "</div>") { $depth-- }
            $i++
            if ($depth -le 0) { break }
        }
        # Add new file-based image block
        $newBlock = @(
'                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">',
'                                 <div>',
'                                     <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">{t("image_1")}</label>',
'                                     <input ref={image1Ref} type="file" accept="image/*" className="hidden"',
'                                       onChange={e => handleImageFile(e, "image1Url", setImage1Uploading)} />',
'                                     <button type="button" onClick={() => image1Ref.current?.click()} disabled={image1Uploading}',
'                                       className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-400 transition-all text-slate-600 dark:text-slate-400 font-semibold text-sm cursor-pointer disabled:opacity-60">',
'                                       {image1Uploading ? "Reading..." : form.image1Url ? "✓ Change Photo 1" : "Select Photo 1"}',
'                                     </button>',
'                                     {form.image1Url && <img src={form.image1Url} alt="Preview 1" className="mt-2 w-full h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />}',
'                                 </div>',
'                                 <div>',
'                                     <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">{t("image_2")}</label>',
'                                     <input ref={image2Ref} type="file" accept="image/*" className="hidden"',
'                                       onChange={e => handleImageFile(e, "image2Url", setImage2Uploading)} />',
'                                     <button type="button" onClick={() => image2Ref.current?.click()} disabled={image2Uploading}',
'                                       className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-400 transition-all text-slate-600 dark:text-slate-400 font-semibold text-sm cursor-pointer disabled:opacity-60">',
'                                       {image2Uploading ? "Reading..." : form.image2Url ? "✓ Change Photo 2" : "Select Photo 2"}',
'                                     </button>',
'                                     {form.image2Url && <img src={form.image2Url} alt="Preview 2" className="mt-2 w-full h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />}',
'                                 </div>',
'                             </div>'
        )
        $out += $newBlock
    } else {
        $out += $line
        $i++
    }
}
Set-Content -Path $filePath -Value $out
Write-Host "Done - image inputs replaced"
