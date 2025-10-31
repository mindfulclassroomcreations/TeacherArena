// Curated Australia curricula (initial seed)
export const AU_REGIONS = [
  'New South Wales','Queensland','South Australia','Tasmania','Victoria','Western Australia','Australian Capital Territory','Northern Territory'
]

export type CurriculumGrouping = {
  curriculum_name: string
  states: string[]
  description: string
  source_url?: string
  sources?: Record<string, string>
}

export function getAustraliaScienceGroupings(): CurriculumGrouping[] {
  return [
    {
      curriculum_name: 'Australian Curriculum: Science (ACARA)',
      states: AU_REGIONS,
      description: 'The Australian Curriculum (ACARA) provides the national framework; states/territories implement with local syllabuses.',
      source_url: 'https://australiancurriculum.edu.au/f-10-curriculum/science/',
      sources: {
        'New South Wales': 'https://curriculum.nsw.edu.au/learning-areas/science',
        'Victoria': 'https://victoriancurriculum.vcaa.vic.edu.au/science/introduction/about-the-study',
        'Queensland': 'https://www.qcaa.qld.edu.au/p-10/aciq/science',
        'South Australia': 'https://www.education.sa.gov.au/teaching/curriculum',
        'Tasmania': 'https://www.education.tas.gov.au/parents-carers/learning/curriculum/',
        'Western Australia': 'https://k10outline.scsa.wa.edu.au/home/teaching/curriculum-browser/science-overview',
        'Australian Capital Territory': 'https://www.education.act.gov.au/teaching_and_learning/learning/curriculum',
        'Northern Territory': 'https://education.nt.gov.au/education/curriculum'
      }
    }
  ]
}

export function getAustraliaMathGroupings(): CurriculumGrouping[] {
  return [
    {
      curriculum_name: 'Australian Curriculum: Mathematics (ACARA)',
      states: AU_REGIONS,
      description: 'Australian Curriculum Mathematics with state/territory implementation.',
      source_url: 'https://australiancurriculum.edu.au/f-10-curriculum/mathematics/',
      sources: {
        'New South Wales': 'https://curriculum.nsw.edu.au/learning-areas/mathematics',
        'Victoria': 'https://victoriancurriculum.vcaa.vic.edu.au/mathematics/introduction/about-the-study',
        'Queensland': 'https://www.qcaa.qld.edu.au/p-10/aciq/mathematics',
        'South Australia': 'https://www.education.sa.gov.au/teaching/curriculum',
        'Tasmania': 'https://www.education.tas.gov.au/parents-carers/learning/curriculum/',
        'Western Australia': 'https://k10outline.scsa.wa.edu.au/home/teaching/curriculum-browser/mathematics',
        'Australian Capital Territory': 'https://www.education.act.gov.au/teaching_and_learning/learning/curriculum',
        'Northern Territory': 'https://education.nt.gov.au/education/curriculum'
      }
    }
  ]
}

export function getAustraliaELAGroupings(): CurriculumGrouping[] {
  return [
    {
      curriculum_name: 'Australian Curriculum: English (ACARA)',
      states: AU_REGIONS,
      description: 'Australian Curriculum English with state/territory implementation.',
      source_url: 'https://australiancurriculum.edu.au/f-10-curriculum/english/',
      sources: {
        'New South Wales': 'https://curriculum.nsw.edu.au/learning-areas/english',
        'Victoria': 'https://victoriancurriculum.vcaa.vic.edu.au/english/introduction/about-the-study',
        'Queensland': 'https://www.qcaa.qld.edu.au/p-10/aciq/english',
        'South Australia': 'https://www.education.sa.gov.au/teaching/curriculum',
        'Tasmania': 'https://www.education.tas.gov.au/parents-carers/learning/curriculum/',
        'Western Australia': 'https://k10outline.scsa.wa.edu.au/home/teaching/curriculum-browser/english',
        'Australian Capital Territory': 'https://www.education.act.gov.au/teaching_and_learning/learning/curriculum',
        'Northern Territory': 'https://education.nt.gov.au/education/curriculum'
      }
    }
  ]
}
