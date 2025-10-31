/*
Converts an Excel file of US state education department URLs to a JSON mapping used by the app.
Usage:
  node scripts/convert-usa-sea.js path/to/USA.xlsx src/data/us-sea.json
Requires:
  npm i -D xlsx
Excel expectations:
  - First row is a header
  - Columns include at least: State, URL (case-insensitive)
*/

const fs = require('fs')
const path = require('path')

async function main() {
  const [, , inputPath, outputPath] = process.argv
  if (!inputPath || !outputPath) {
    console.error('Usage: node scripts/convert-usa-sea.js <input.xlsx> <output.json>')
    process.exit(1)
  }
  let xlsx
  try {
    xlsx = require('xlsx')
  } catch (e) {
    console.error('Please install xlsx: npm i -D xlsx')
    process.exit(1)
  }
  const wb = xlsx.readFile(inputPath)
  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const rows = xlsx.utils.sheet_to_json(ws, { defval: '' })
  const mapping = {}
  // Heuristics: find likely state and URL column names
  const allHeaders = new Set()
  rows.forEach((r) => Object.keys(r).forEach((k) => allHeaders.add(String(k))))
  const headers = Array.from(allHeaders)
  const headerLc = headers.map((h) => h.toLowerCase())
  const findHeader = (patterns) => {
    for (const p of patterns) {
      const idx = headerLc.findIndex((h) => h.includes(p))
      if (idx >= 0) return headers[idx]
    }
    return null
  }
  const stateHeader = findHeader(['state/territory','state','region']) || headers.find((h) => /state|region|territory/i.test(h))
  const urlHeader = findHeader(['url','website','web','link']) || headers.find((h) => /http|www|url|web|link/i.test(h))
  if (!stateHeader || !urlHeader) {
    console.warn('Could not auto-detect columns. Headers found:', headers)
  }
  for (const row of rows) {
    const stateRaw = stateHeader ? String(row[stateHeader] || '') : ''
    const urlRaw = urlHeader ? String(row[urlHeader] || '') : ''
    if (!stateRaw || !urlRaw) continue
    const state = stateRaw.replace(/\s+/g, ' ').trim().replace(/\b\w/g, (m) => m.toUpperCase())
    const url = urlRaw.trim()
    if (!/^https?:\/\//i.test(url)) continue
    mapping[state] = url
  }
  fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2))
  console.log('Detected headers:', { stateHeader, urlHeader })
  console.log('Wrote', Object.keys(mapping).length, 'entries to', outputPath)
}

main().catch((e) => { console.error(e); process.exit(1) })
