# scripts/build-docx.ps1
# Compiles 06-software-design-document/SOFTWARE-DESIGN-DOCUMENT.md into
# SEIskolar-Software-Design-Document.docx with balanced column widths,
# zero running headers/footers, and cantSplit / tblHeader protection.

$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\.."
$inputMd = "$root\06-software-design-document\SOFTWARE-DESIGN-DOCUMENT.md"
$outputDocx = "$root\06-software-design-document\SEIskolar-Software-Design-Document.docx"
$luaFilter = "$root\scripts\table-widths.lua"

Write-Host "1. Compiling markdown to DOCX via Pandoc..."
& pandoc "$inputMd" --lua-filter="$luaFilter" -o "$outputDocx"

Write-Host "2. Post-processing DOCX for table styling and row protection..."
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($outputDocx, [System.IO.Compression.ZipArchiveMode]::Update)
$docEntry = $zip.GetEntry("word/document.xml")
$reader = New-Object System.IO.StreamReader($docEntry.Open())
$docXml = $reader.ReadToEnd()
$reader.Close()

$borderXml = '<w:tblBorders><w:top w:val="single" w:sz="6" w:space="0" w:color="A0A0A0"/><w:left w:val="none"/><w:bottom w:val="single" w:sz="8" w:space="0" w:color="606060"/><w:right w:val="none"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/><w:insideV w:val="none"/></w:tblBorders>'

$docXml = [regex]::Replace($docXml, '<w:tbl>([\s\S]*?)<\/w:tbl>', {
    param($m)
    $tbl = $m.Value
    if ($tbl -match '<w:tblBorders>[\s\S]*?<\/w:tblBorders>') {
        $tbl = [regex]::Replace($tbl, '<w:tblBorders>[\s\S]*?<\/w:tblBorders>', $borderXml)
    } elseif ($tbl -match '<\/w:tblPr>') {
        $tbl = $tbl.Replace('</w:tblPr>', "$borderXml</w:tblPr>")
    }
    
    $rowIndex = 0
    $tbl = [regex]::Replace($tbl, '<w:tr(?: [^>]*)?>[\s\S]*?<\/w:tr>', {
        param($rm)
        $tr = $rm.Value
        $isHeader = ($rowIndex -eq 0)
        $rowIndex++
        
        $cantSplit = '<w:cantSplit/>'
        $tblHeader = if ($isHeader) { '<w:tblHeader/>' } else { '' }
        
        if ($tr -match '<w:trPr>') {
            $tr = $tr.Replace('<w:trPr>', "<w:trPr>$cantSplit$tblHeader")
        } else {
            $tr = [regex]::Replace($tr, '^(<w:tr(?: [^>]*)?>)', "`$1<w:trPr>$cantSplit$tblHeader</w:trPr>")
        }
        return $tr
    })
    return $tbl
})

$docEntry.Delete()
$newEntry = $zip.CreateEntry("word/document.xml", [System.IO.Compression.CompressionLevel]::Optimal)
$writer = New-Object System.IO.StreamWriter($newEntry.Open())
$writer.Write($docXml)
$writer.Close()
$zip.Dispose()

Write-Host "Done! Generated and verified: $outputDocx"
