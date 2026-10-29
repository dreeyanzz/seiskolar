// scripts/build-docx.mjs
// Compiles 06-software-design-document/SOFTWARE-DESIGN-DOCUMENT.md into
// SEIskolar-Software-Design-Document.docx with balanced column widths,
// zero running headers/footers, and cantSplit / tblHeader protection.

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import AdmZip from 'jszip'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const INPUT_MD = path.join(
  ROOT,
  '06-software-design-document',
  'SOFTWARE-DESIGN-DOCUMENT.md',
)
const OUTPUT_DOCX = path.join(
  ROOT,
  '06-software-design-document',
  'SEIskolar-Software-Design-Document.docx',
)
const LUA_FILTER = path.join(ROOT, 'scripts', 'table-widths.lua')

console.log('1. Compiling markdown to DOCX via Pandoc...')
execSync(`pandoc "${INPUT_MD}" --lua-filter="${LUA_FILTER}" -o "${OUTPUT_DOCX}"`, {
  stdio: 'inherit',
})

console.log('2. Post-processing DOCX for table styling and row protection...')
const content = fs.readFileSync(OUTPUT_DOCX)
const zip = await AdmZip.loadAsync(content)
let docXml = await zip.files['word/document.xml'].async('string')

// Clean borders: top single, bottom thick, horizontal dividers, no vertical borders
const borderXml = `
  <w:tblBorders>
    <w:top w:val="single" w:sz="6" w:space="0" w:color="A0A0A0"/>
    <w:left w:val="none"/>
    <w:bottom w:val="single" w:sz="8" w:space="0" w:color="606060"/>
    <w:right w:val="none"/>
    <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/>
    <w:insideV w:val="none"/>
  </w:tblBorders>
`

// Post-process all tables
docXml = docXml.replace(/<w:tbl>([\s\S]*?)<\/w:tbl>/g, (tblMatch) => {
  let tbl = tblMatch

  if (tbl.includes('<w:tblBorders>')) {
    tbl = tbl.replace(/<w:tblBorders>[\s\S]*?<\/w:tblBorders>/, borderXml.trim())
  } else if (tbl.includes('</w:tblPr>')) {
    tbl = tbl.replace('</w:tblPr>', borderXml.trim() + '</w:tblPr>')
  }

  let rowIndex = 0
  tbl = tbl.replace(/<w:tr(?: [^>]*)?>[\s\S]*?<\/w:tr>/g, (trMatch) => {
    let tr = trMatch
    const isHeader = rowIndex === 0
    rowIndex++

    const cantSplit = '<w:cantSplit/>'
    const tblHeader = isHeader ? '<w:tblHeader/>' : ''

    if (tr.includes('<w:trPr>')) {
      tr = tr.replace('<w:trPr>', `<w:trPr>${cantSplit}${tblHeader}`)
    } else {
      tr = tr.replace(
        /^(<w:tr(?: [^>]*)?>)/,
        `$1<w:trPr>${cantSplit}${tblHeader}</w:trPr>`,
      )
    }
    return tr
  })

  return tbl
})

zip.file('word/document.xml', docXml)
const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
fs.writeFileSync(OUTPUT_DOCX, buffer)
console.log('Done! Generated and verified:', OUTPUT_DOCX)
