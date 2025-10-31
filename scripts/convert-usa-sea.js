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
  for (const row of rows) {
    const entries = Object.entries(row)
    const kv = Object.fromEntries(entries.map(([k, v]) => [String(k).toLowerCase().trim(), String(v).trim()]))
    const state = kv.state || kv['state/territory'] || kv['region'] || ''
    const url = kv.url || kv.link || kv.website || ''
    if (!state || !url) continue
    mapping[state.replace(/\s+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())] = url
  }
  fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2))
  console.log('Wrote', Object.keys(mapping).length, 'entries to', outputPath)
}

main().catch((e) => { console.error(e); process.exit(1) })
