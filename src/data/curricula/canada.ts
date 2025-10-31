// Curated Canada curricula (initial seed)
// Official sources should be verified and expanded.
export const CANADA_PROVINCES_TERRITORIES = [
  'Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador','Nova Scotia','Ontario','Prince Edward Island','Quebec','Saskatchewan',
  'Northwest Territories','Nunavut','Yukon'
]

export type CurriculumGrouping = {
  curriculum_name: string
  states: string[]
  description: string
  source_url?: string
  sources?: Record<string, string>
}

export function getCanadaScienceGroupings(): CurriculumGrouping[] {
  // Most curricula are provincial/territorial; no single national standard.
  // Provide one umbrella grouping with official ministry landing pages for key provinces (seed).
  const grouping: CurriculumGrouping = {
    curriculum_name: 'Provincial/Territorial Science Curricula',
    states: CANADA_PROVINCES_TERRITORIES,
    description: 'Science curricula are set by provinces/territories. Refer to your ministry of education.',
    source_url: 'https://www.cmec.ca/',
    sources: {
      'Ontario': 'https://www.dcp.edu.gov.on.ca/en/curriculum/elementary-science-and-technology',
      'British Columbia': 'https://curriculum.gov.bc.ca/curriculum/science',
      'Alberta': 'https://www.alberta.ca/k-12-education',
      'Quebec': 'https://www.quebec.ca/en/education/preschool-elementary-secondary',
      'Saskatchewan': 'https://www.edonline.sk.ca/bbcswebdav/library/curricula/English/Science/index.html',
      'Nova Scotia': 'https://curriculum.novascotia.ca/curriculum',
      'Manitoba': 'https://www.edu.gov.mb.ca/k12/cur/science.html'
    }
  }
  return [grouping]
}

export function getCanadaMathGroupings(): CurriculumGrouping[] {
  const grouping: CurriculumGrouping = {
    curriculum_name: 'Provincial/Territorial Mathematics Curricula',
    states: CANADA_PROVINCES_TERRITORIES,
    description: 'Mathematics curricula are set by provinces/territories. Refer to your ministry of education.',
    source_url: 'https://www.cmec.ca/',
    sources: {
      'Ontario': 'https://www.dcp.edu.gov.on.ca/en/curriculum/elementary-mathematics',
      'British Columbia': 'https://curriculum.gov.bc.ca/curriculum/mathematics',
      'Alberta': 'https://www.alberta.ca/k-12-education',
      'Quebec': 'https://www.quebec.ca/en/education/preschool-elementary-secondary',
      'Saskatchewan': 'https://www.edonline.sk.ca/bbcswebdav/library/curricula/English/Mathematics/index.html',
      'Nova Scotia': 'https://curriculum.novascotia.ca/curriculum',
      'Manitoba': 'https://www.edu.gov.mb.ca/k12/cur/math/index.html'
    }
  }
  return [grouping]
}

export function getCanadaELAGroupings(): CurriculumGrouping[] {
  const grouping: CurriculumGrouping = {
    curriculum_name: 'Provincial/Territorial English Language Arts Curricula',
    states: CANADA_PROVINCES_TERRITORIES,
    description: 'ELA curricula are set by provinces/territories. Refer to your ministry of education.',
    source_url: 'https://www.cmec.ca/',
    sources: {
      'Ontario': 'https://www.dcp.edu.gov.on.ca/en/curriculum/elementary-language',
      'British Columbia': 'https://curriculum.gov.bc.ca/curriculum/english-language-arts',
      'Alberta': 'https://www.alberta.ca/k-12-education',
      'Quebec': 'https://www.quebec.ca/en/education/preschool-elementary-secondary',
      'Saskatchewan': 'https://www.edonline.sk.ca/bbcswebdav/library/curricula/English/English_Language_Arts/index.html',
      'Nova Scotia': 'https://curriculum.novascotia.ca/curriculum',
      'Manitoba': 'https://www.edu.gov.mb.ca/k12/cur/ela/index.html'
    }
  }
  return [grouping]
}
