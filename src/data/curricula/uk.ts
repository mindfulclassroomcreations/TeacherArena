// Curated UK curricula (initial seed)
export const UK_COUNTRIES = ['England','Scotland','Wales','Northern Ireland']

export type CurriculumGrouping = {
  curriculum_name: string
  states: string[]
  description: string
  source_url?: string
  sources?: Record<string, string>
}

export function getUKScienceGroupings(): CurriculumGrouping[] {
  return [
    {
      curriculum_name: 'National Curriculum – Science (England)',
      states: ['England'],
      description: 'Science within the National Curriculum for England.',
      source_url: 'https://www.gov.uk/national-curriculum',
      sources: { 'England': 'https://www.gov.uk/government/collections/national-curriculum' }
    },
    {
      curriculum_name: 'Curriculum for Excellence – Sciences (Scotland)',
      states: ['Scotland'],
      description: 'Sciences area of the Curriculum for Excellence.',
      source_url: 'https://education.gov.scot/education-scotland/scottish-education-system/policy-for-scottish-education/policy-drivers/cfe-building-from-the-statement-appendix-incl-btc1-5/what-is-curriculum-for-excellence/',
      sources: { 'Scotland': 'https://education.gov.scot/' }
    },
    {
      curriculum_name: 'Curriculum for Wales – Science and Technology',
      states: ['Wales'],
      description: 'Area of learning and experience: Science and Technology.',
      source_url: 'https://hwb.gov.wales/curriculum-for-wales',
      sources: { 'Wales': 'https://hwb.gov.wales/' }
    },
    {
      curriculum_name: 'Northern Ireland Curriculum – Science and Technology',
      states: ['Northern Ireland'],
      description: 'Northern Ireland Curriculum area related to science/technology.',
      source_url: 'https://ccea.org.uk/key-stage-3/curriculum/science-and-technology',
      sources: { 'Northern Ireland': 'https://ccea.org.uk/' }
    }
  ]
}

export function getUKMathGroupings(): CurriculumGrouping[] {
  return [
    {
      curriculum_name: 'National Curriculum – Mathematics (England)',
      states: ['England'],
      description: 'Mathematics within the National Curriculum for England.',
      source_url: 'https://www.gov.uk/national-curriculum',
      sources: { 'England': 'https://www.gov.uk/government/collections/national-curriculum' }
    },
    {
      curriculum_name: 'Curriculum for Excellence – Mathematics (Scotland)',
      states: ['Scotland'],
      description: 'Mathematics within CfE.',
      source_url: 'https://education.gov.scot/',
      sources: { 'Scotland': 'https://education.gov.scot/' }
    },
    {
      curriculum_name: 'Curriculum for Wales – Mathematics and Numeracy',
      states: ['Wales'],
      description: 'Area of learning and experience: Mathematics and Numeracy.',
      source_url: 'https://hwb.gov.wales/curriculum-for-wales',
      sources: { 'Wales': 'https://hwb.gov.wales/' }
    },
    {
      curriculum_name: 'Northern Ireland Curriculum – Mathematics and Numeracy',
      states: ['Northern Ireland'],
      description: 'Northern Ireland Curriculum area related to Mathematics.',
      source_url: 'https://ccea.org.uk/',
      sources: { 'Northern Ireland': 'https://ccea.org.uk/' }
    }
  ]
}

export function getUKELAGroupings(): CurriculumGrouping[] {
  return [
    {
      curriculum_name: 'National Curriculum – English (England)',
      states: ['England'],
      description: 'English within the National Curriculum for England.',
      source_url: 'https://www.gov.uk/national-curriculum',
      sources: { 'England': 'https://www.gov.uk/government/collections/national-curriculum' }
    },
    {
      curriculum_name: 'Curriculum for Excellence – Literacy and English (Scotland)',
      states: ['Scotland'],
      description: 'CfE Literacy and English.',
      source_url: 'https://education.gov.scot/',
      sources: { 'Scotland': 'https://education.gov.scot/' }
    },
    {
      curriculum_name: 'Curriculum for Wales – Languages, Literacy and Communication',
      states: ['Wales'],
      description: 'Area of learning and experience for English and languages.',
      source_url: 'https://hwb.gov.wales/curriculum-for-wales',
      sources: { 'Wales': 'https://hwb.gov.wales/' }
    },
    {
      curriculum_name: 'Northern Ireland Curriculum – Language and Literacy',
      states: ['Northern Ireland'],
      description: 'Northern Ireland Curriculum area related to Language and Literacy.',
      source_url: 'https://ccea.org.uk/',
      sources: { 'Northern Ireland': 'https://ccea.org.uk/' }
    }
  ]
}
