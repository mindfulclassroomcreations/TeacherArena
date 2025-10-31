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

import US_SEA from '@/data/us-sea.json'

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
    source_url: 'https://www2.ed.gov/about/contacts/state/index.html'
  }
  const withSources = (g: CurriculumGrouping): CurriculumGrouping => {
    const sources: Record<string, string> = { ...(g.sources || {}) }
    g.states.forEach((s) => {
      if (!sources[s] && (US_SEA as any)[s]) sources[s] = (US_SEA as any)[s]
    })
    return { ...g, sources }
  }
  return [...USA_SCIENCE_GROUPS.map(withSources), withSources(others)].filter((g) => g.states.length > 0)
}

// CCSS groupings (initial conservative seed)
const CCSS_EXCEPTIONS_COMMON = new Set<string>([
  'Texas','Virginia','Florida','Indiana','Oklahoma','South Carolina','Nebraska','Alaska'
])
const CCSS_MATH_EXTRA_EXCEPTIONS = new Set<string>(['Minnesota'])

export function getUSAMathGroupings(): CurriculumGrouping[] {
  const exceptions = new Set<string>([...CCSS_EXCEPTIONS_COMMON, ...CCSS_MATH_EXTRA_EXCEPTIONS])
  const ccssStates = US_STATES.filter((s) => !exceptions.has(s))
  const groups: CurriculumGrouping[] = [
    {
      curriculum_name: 'Common Core State Standards (CCSS) – Mathematics',
      states: ccssStates,
      description: 'States that adopted or use CCSS-aligned Mathematics standards (including revisions).',
      source_url: 'https://www.ccsso.org/'
    },
    {
      curriculum_name: 'Texas Essential Knowledge and Skills (TEKS) – Mathematics',
      states: ['Texas'],
      description: 'Texas state standards for Mathematics.',
      source_url: 'https://tea.texas.gov/academics/curriculum-standards/teks/texas-essential-knowledge-and-skills'
    },
    {
      curriculum_name: 'B.E.S.T. Standards – Mathematics (Florida)',
      states: ['Florida'],
      description: 'Florida’s Benchmarks for Excellent Student Thinking (B.E.S.T.) Mathematics standards.',
      source_url: 'https://www.cpalms.org/Standards/Best_Standards.aspx'
    },
    {
      curriculum_name: 'Standards of Learning (SOL) – Mathematics (Virginia)',
      states: ['Virginia'],
      description: 'Virginia SOL for Mathematics.',
      source_url: 'https://doe.virginia.gov/teaching-learning-assessment/k-12-standards-instruction/mathematics'
    },
    {
      curriculum_name: 'Indiana Academic Standards – Mathematics',
      states: ['Indiana'],
      description: 'Indiana state Mathematics standards.',
      source_url: 'https://www.in.gov/doe/students/indiana-academic-standards/mathematics/'
    },
    {
      curriculum_name: 'Oklahoma Academic Standards – Mathematics',
      states: ['Oklahoma'],
      description: 'Oklahoma state Mathematics standards.',
      source_url: 'https://sde.ok.gov/oklahoma-academic-standards'
    },
    {
      curriculum_name: 'South Carolina College- and Career-Ready Standards – Mathematics',
      states: ['South Carolina'],
      description: 'South Carolina Mathematics standards.',
      source_url: 'https://ed.sc.gov/instruction/standards-learning/mathematics/'
    },
    {
      curriculum_name: 'Nebraska College and Career Ready Standards – Mathematics',
      states: ['Nebraska'],
      description: 'Nebraska Mathematics standards.',
      source_url: 'https://www.education.ne.gov/math/standards/'
    },
    {
      curriculum_name: 'Alaska Mathematics Standards',
      states: ['Alaska'],
      description: 'Alaska Mathematics standards.',
      source_url: 'https://education.alaska.gov/standards/mathematics'
    },
    {
      curriculum_name: 'Minnesota Mathematics Standards',
      states: ['Minnesota'],
      description: 'Minnesota Mathematics standards (not CCSS).',
      source_url: 'https://education.mn.gov/MDE/dse/stds/Math/'
    }
  ]
  const withSources = (g: CurriculumGrouping): CurriculumGrouping => {
    const sources: Record<string, string> = { ...(g.sources || {}) }
    g.states.forEach((s) => {
      if (!sources[s] && (US_SEA as any)[s]) sources[s] = (US_SEA as any)[s]
    })
    return { ...g, sources }
  }
  return groups.map(withSources)
}

export function getUSAELAGroupings(): CurriculumGrouping[] {
  const exceptions = new Set<string>([...CCSS_EXCEPTIONS_COMMON])
  const ccssStates = US_STATES.filter((s) => !exceptions.has(s))
  const groups: CurriculumGrouping[] = [
    {
      curriculum_name: 'Common Core State Standards (CCSS) – English Language Arts',
      states: ccssStates,
      description: 'States that adopted or use CCSS-aligned ELA standards (including revisions).',
      source_url: 'https://www.ccsso.org/'
    },
    {
      curriculum_name: 'Texas Essential Knowledge and Skills (TEKS) – English Language Arts and Reading',
      states: ['Texas'],
      description: 'Texas state standards for ELA and Reading.',
      source_url: 'https://tea.texas.gov/academics/curriculum-standards/teks/texas-essential-knowledge-and-skills'
    },
    {
      curriculum_name: 'B.E.S.T. Standards – English Language Arts (Florida)',
      states: ['Florida'],
      description: 'Florida’s B.E.S.T. standards for ELA.',
      source_url: 'https://www.fldoe.org/academics/standards/best.stml'
    },
    {
      curriculum_name: 'Standards of Learning (SOL) – English (Virginia)',
      states: ['Virginia'],
      description: 'Virginia SOL for English.',
      source_url: 'https://doe.virginia.gov/teaching-learning-assessment/k-12-standards-instruction/english'
    },
    {
      curriculum_name: 'Indiana Academic Standards – English/Language Arts',
      states: ['Indiana'],
      description: 'Indiana state ELA standards.',
      source_url: 'https://www.in.gov/doe/students/indiana-academic-standards/englishlanguage-arts/'
    },
    {
      curriculum_name: 'Oklahoma Academic Standards – English Language Arts',
      states: ['Oklahoma'],
      description: 'Oklahoma state ELA standards.',
      source_url: 'https://sde.ok.gov/oklahoma-academic-standards'
    },
    {
      curriculum_name: 'South Carolina College- and Career-Ready Standards – English Language Arts',
      states: ['South Carolina'],
      description: 'South Carolina ELA standards.',
      source_url: 'https://ed.sc.gov/instruction/standards-learning/english-language-arts/'
    },
    {
      curriculum_name: 'Nebraska College and Career Ready Standards – English Language Arts',
      states: ['Nebraska'],
      description: 'Nebraska ELA standards.',
      source_url: 'https://www.education.ne.gov/ela/standards/'
    },
    {
      curriculum_name: 'Alaska English/Language Arts Standards',
      states: ['Alaska'],
      description: 'Alaska ELA standards.',
      source_url: 'https://education.alaska.gov/standards/englishlanguage-arts'
    }
  ]
  const withSources = (g: CurriculumGrouping): CurriculumGrouping => {
    const sources: Record<string, string> = { ...(g.sources || {}) }
    g.states.forEach((s) => {
      if (!sources[s] && (US_SEA as any)[s]) sources[s] = (US_SEA as any)[s]
    })
    return { ...g, sources }
  }
  return groups.map(withSources)
}
