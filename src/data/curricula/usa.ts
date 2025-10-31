// Curated USA curricula groupings (initial seed)
// Sources (verify/update regularly):
// - NGSS: https://www.nextgenscience.org/
// - Texas TEKS (Science): https://tea.texas.gov/academics/curriculum-standards/teks/texas-essential-knowledge-and-skills
// - Virginia SOL (Science): https://doe.virginia.gov/teaching-learning-assessment/k-12-standards-instruction/science
// - Florida NGSSS (Science): https://www.fldoe.org/academics/standards/subject-areas/science.stml
// - Massachusetts STE: https://www.doe.mass.edu/frameworks/scitech/
// - New York NYSSLS: http://www.nysed.gov/curriculum-instruction/new-york-state-p-12-science-learning-standards
// - Minnesota Science Standards: https://education.mn.gov/MDE/dse/stds/sci/
// - North Carolina Science: https://www.dpi.nc.gov/districts-schools/classroom-resources/academic-standards/science
// - South Carolina Science: https://ed.sc.gov/instruction/standards-learning/science/
// - Indiana Academic Standards (Science): https://www.in.gov/doe/students/indiana-academic-standards/science/

export const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia',
  'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland',
  'Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
  'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina',
  'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming',
  // Non-state district for completeness in some contexts
  'District of Columbia'
]

export type CurriculumGrouping = {
  curriculum_name: string
  states: string[]
  description: string
  source_url?: string
  sources?: Record<string, string>
}

export const USA_SCIENCE_GROUPS: CurriculumGrouping[] = [
  {
    curriculum_name: 'Next Generation Science Standards (NGSS)',
    // Conservative initial list; please verify with nextgenscience.org and update
    states: [
      'California','Connecticut','Delaware','District of Columbia','Hawaii','Illinois','Iowa','Kansas','Kentucky','Maryland',
      'Michigan','Nevada','New Hampshire','New Jersey','Oregon','Rhode Island','Vermont','Washington','West Virginia'
    ],
    description: 'States that have adopted NGSS; see NextGenScience for current adoption map and details.',
    source_url: 'https://www.nextgenscience.org/'
  },
  {
    curriculum_name: 'State-Specific Science Standards (Named Frameworks)',
    states: [
      'Texas','Virginia','Florida','Massachusetts','New York','Minnesota','North Carolina','South Carolina','Indiana',
      'Arizona','Colorado','Georgia','Utah','Alaska','Ohio'
    ],
    description: 'States with officially named science standards distinct from or adapted relative to NGSS.',
    source_url: 'https://www.ed.gov/',
    sources: {
      'Texas': 'https://tea.texas.gov/academics/curriculum-standards/teks/texas-essential-knowledge-and-skills',
      'Virginia': 'https://doe.virginia.gov/teaching-learning-assessment/k-12-standards-instruction/science',
      'Florida': 'https://www.fldoe.org/academics/standards/subject-areas/science.stml',
      'Massachusetts': 'https://www.doe.mass.edu/frameworks/scitech/',
      'New York': 'http://www.nysed.gov/curriculum-instruction/new-york-state-p-12-science-learning-standards',
      'Minnesota': 'https://education.mn.gov/MDE/dse/stds/sci/',
      'North Carolina': 'https://www.dpi.nc.gov/districts-schools/classroom-resources/academic-standards/science',
      'South Carolina': 'https://ed.sc.gov/instruction/standards-learning/science/',
      'Indiana': 'https://www.in.gov/doe/students/indiana-academic-standards/science/',
      'Arizona': 'https://www.azed.gov/standards-practices/k-12-standards/standards-science',
      'Colorado': 'https://www.cde.state.co.us/standardsandinstruction/standards_science',
      'Georgia': 'https://www.georgiastandards.org/Standards/Pages/BrowseStandards/Science.aspx',
      'Utah': 'https://www.schools.utah.gov/curr/science',
      'Alaska': 'https://education.alaska.gov/standards/science',
      'Ohio': 'https://education.ohio.gov/Topics/Learning-in-Ohio/Science/Ohio-s-Learning-Standards-in-Science'
    }
  }
]

export function getUSAScienceGroupings(): CurriculumGrouping[] {
  const covered = new Set<string>()
  USA_SCIENCE_GROUPS.forEach((g) => g.states.forEach((s) => covered.add(s)))
  const leftovers = US_STATES.filter((s) => !covered.has(s))
  // Group remaining states under a general bucket indicating state-maintained standards
  const others: CurriculumGrouping = {
    curriculum_name: 'Other State Science Standards',
    states: leftovers,
    description: 'Standards maintained by state education agencies (not explicitly listed above). Refer to your state Department of Education.',
    source_url: 'https://www.ed.gov/'
  }
  return [...USA_SCIENCE_GROUPS, others].filter((g) => g.states.length > 0)
}
