import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

export interface LessonItem {
  title?: string
  name?: string
  description?: string
  standard_code?: string
  code?: string
  lesson_code?: string
}

export interface LessonSource {
  groupId: string
  subPageId: string
  subStandard: string
}

const A4_PORTRAIT = { w: 595.28, h: 841.89 }
const A4_LANDSCAPE = { w: A4_PORTRAIT.h, h: A4_PORTRAIT.w }

const inch = 72
const MARGIN = 0.5 * inch
const COLS = 2
const ROWS = 2

const HEADER_H = 0.8 * inch
const BORDER_THICK = 3
const RADIUS = 10
const PAD = 8

const TEAL = rgb(0, 0.5, 0.5)
const BLACK = rgb(0, 0, 0)
const WHITE = rgb(1, 1, 1)

async function fetchFont(url: string) {
  const res = await fetch(url)
  return new Uint8Array(await res.arrayBuffer())
}

function wrapText(text: string, maxWidth: number, font: any, size: number) {
  const words = (text || '').split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const w of words) {
    const trial = current ? current + ' ' + w : w
    const width = font.widthOfTextAtSize(trial, size)
    if (width > maxWidth && current) {
      lines.push(current)
      current = w
    } else {
      current = trial
    }
  }
  if (current) lines.push(current)
  return lines
}

function drawRoundedRect(page: any, x: number, y: number, w: number, h: number, radius = RADIUS) {
  page.drawRectangle({ x, y, width: w, height: h, color: undefined, borderColor: TEAL, borderWidth: BORDER_THICK, borderRadius: radius })
}

function drawHeader(page: any, x: number, y: number, w: number, h: number) {
  page.drawRectangle({ x, y: y + (h - HEADER_H), width: w, height: HEADER_H, color: BLACK })
}

function drawTitle(page: any, x: number, y: number, w: number, title: string, font: any) {
  const size = 14
  const textWidth = font.widthOfTextAtSize(title, size)
  const tx = x + (w - textWidth) / 2
  const ty = y + (HEADER_H - size) / 2 + (w > 0 ? (HEADER_H * 0.15) : 0)
  page.drawText(title, { x: tx, y: y + (HEADER_H - size) / 2 + (HEADER_H * 0.1), size, font, color: WHITE })
}

function drawCardNumber(page: any, x: number, y: number, w: number, h: number, num: number, font: any) {
  const radius = 12
  const cx = x + w - PAD - 20
  const cy = y + h - PAD - 16
  page.drawCircle({ x: cx, y: cy, size: radius, borderColor: BLACK, borderWidth: 1.5 })
  const size = 10
  const text = String(num)
  const tw = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: cx - tw / 2, y: cy - size / 2 + 2, size, font, color: BLACK })
}

export async function generateTaskCardsPdf(lesson: LessonItem, source: LessonSource, typeNum: string) {
  // Only for Group A / A-01 / Type 02
  if (!(source.groupId === 'group-a' && source.subPageId === 'a-01' && (typeNum === '02' || typeNum === '2'))) {
    throw new Error('This PDF generator is available only for Group A / A-01 / Product Type 02')
  }

  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)

  // Load fonts
  const dejavuBytes = await fetchFont('/fonts/DejaVuSans.ttf')
  const dejavu = await doc.embedFont(dejavuBytes, { subset: true })
  const bold = dejavu

  const page = doc.addPage([A4_LANDSCAPE.w, A4_LANDSCAPE.h])
  const PAGE_W = A4_LANDSCAPE.w
  const PAGE_H = A4_LANDSCAPE.h

  const CARD_W = (PAGE_W - (COLS + 1) * MARGIN) / COLS
  const CARD_H = (PAGE_H - (ROWS + 1) * MARGIN) / ROWS

  // Compute positions 2x2
  const positions: Array<{ x: number; y: number }> = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = MARGIN + col * (CARD_W + MARGIN)
      const y = PAGE_H - MARGIN - (row + 1) * CARD_H - row * MARGIN
      positions.push({ x, y })
    }
  }

  const lessonTitle = (lesson.title || lesson.name || 'Lesson').toUpperCase()
  const desc = lesson.description || 'No description provided.'
  const std = lesson.standard_code || lesson.code || source.subStandard || 'N/A'

  // Build 4 simple cards based on description placeholder
  const cards = [
    { q: `Overview: ${desc}`, opts: ['Key point 1', 'Key point 2', 'Key point 3', 'Key point 4'] },
    { q: `Identify a main idea from: ${lessonTitle}`, opts: ['Idea A', 'Idea B', 'Idea C', 'Idea D'] },
    { q: `Relate to standard ${std}: choose the best match`, opts: ['Match A', 'Match B', 'Match C', 'Match D'] },
    { q: `Quick check: Which is true about this lesson?`, opts: ['Statement 1', 'Statement 2', 'Statement 3', 'Statement 4'] },
  ]

  cards.forEach((card, i) => {
    const { x, y } = positions[i]

    // Border and header
    drawRoundedRect(page, x, y, CARD_W, CARD_H)
    drawHeader(page, x, y, CARD_W, CARD_H)

    // Title and number
    drawTitle(page, x, y + CARD_H - HEADER_H, CARD_W, lessonTitle, bold)
    drawCardNumber(page, x, y, CARD_W, CARD_H, i + 1, dejavu)

    // Body text
    const bodyX = x + PAD
    let bodyY = y + CARD_H - HEADER_H - PAD - 14

    // Question
    const qSize = 12
    const maxW = CARD_W - 2 * PAD
    const qLines = wrapText(card.q, maxW, dejavu, qSize)
    qLines.forEach((ln) => {
      page.drawText(ln, { x: bodyX, y: bodyY, size: qSize, font: dejavu, color: BLACK })
      bodyY -= 14
    })

    bodyY -= 6

    // Options A-D
    const oSize = 12
    const letters = ['A', 'B', 'C', 'D']
    card.opts.forEach((opt, idx) => {
      const line = `${letters[idx]}. ${opt}`
      const lines = wrapText(line, maxW, dejavu, oSize)
      lines.forEach((ln) => {
        page.drawText(ln, { x: bodyX, y: bodyY, size: oSize, font: dejavu, color: BLACK })
        bodyY -= 14
      })
    })
  })

  const pdfBytes = await doc.save()
  // Ensure types are compatible with BlobPart in TS DOM libs
  const arrayBuffer = (pdfBytes as unknown as Uint8Array).buffer as ArrayBuffer
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
  const safeTitle = (lesson.title || lesson.name || 'Lesson').replace(/[^a-z0-9\-\_]+/gi, '_')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${safeTitle}_Task_Cards_Type02_A01.pdf`
  link.click()
  URL.revokeObjectURL(link.href)
}
