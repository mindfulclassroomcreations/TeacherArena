import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'

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

// Simple helper to build a task card section
function taskCard(title: string, content: string) {
  return [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: content, size: 24 }),
      ],
      spacing: { after: 240 },
    }),
  ]
}

export async function generateTaskCardsDocx(lesson: LessonItem, source: LessonSource, typeNum: string) {
  // Only implement for Group A / A-02 / Type 02 initially
  if (!(source.groupId === 'group-a' && source.subPageId === 'a-02' && (typeNum === '02' || typeNum === '2'))) {
    throw new Error('This generator is currently available only for Group A / A-02 / Product Type 02')
  }

  const lessonTitle = lesson.title || lesson.name || 'Untitled Lesson'
  const desc = lesson.description || 'No description provided.'
  const std = lesson.standard_code || lesson.code || source.subStandard || 'N/A'

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "Task Cards",
            heading: HeadingLevel.TITLE,
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Product Type: 02`, bold: true }),
              new TextRun({ text: `  |  Category: GROUP A  |  Sub-Page: A-02`, break: 1 }),
              new TextRun({ text: `Standard: ${std}`, break: 1 }),
              new TextRun({ text: `Lesson: ${lessonTitle}`, break: 1 }),
            ],
            spacing: { after: 240 },
          }),

          // Four example task cards derived from the lesson description
          ...taskCard('Task 1', `Overview: ${desc}`),
          ...taskCard('Task 2', 'List three key points from the lesson and provide a real-world example for each.'),
          ...taskCard('Task 3', 'Create a short activity or prompt that assesses understanding at the application level.'),
          ...taskCard('Task 4', 'Write a reflection or exit-ticket question based on the main objective.'),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const safeTitle = lessonTitle.replace(/[^a-z0-9\-\_]+/gi, '_')
  saveAs(blob, `${safeTitle}_Task_Cards_Type02_A02.docx`)
}
