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
