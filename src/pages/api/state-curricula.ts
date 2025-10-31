import type { NextApiRequest, NextApiResponse } from 'next'
import { getUSAScienceGroupings, US_STATES } from '@/data/curricula/usa'
import { getCanadaScienceGroupings } from '@/data/curricula/canada'
import { getAustraliaScienceGroupings } from '@/data/curricula/australia'
import { getUKScienceGroupings } from '@/data/curricula/uk'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    const { country, subject } = req.body || {}

    if (!country || !subject) return res.status(400).json({ error: 'country and subject are required' })

    const countryLc = String(country).toLowerCase()
    const subjectLc = String(subject).toLowerCase()

    // USA Science: return curated grouping with official sources
    if (countryLc.includes('usa') || countryLc.includes('united states')) {
      if (subjectLc.includes('science')) {
        const items = getUSAScienceGroupings()
        // Ensure coverage of all regions: include DC optionally
        const allRegions = US_STATES
        const covered = new Set(items.flatMap((g) => g.states))
        const missing = allRegions.filter((s) => !covered.has(s))
        // If any missing (shouldn't), add to a catch-all bucket
        let finalItems = items
        if (missing.length > 0) {
          finalItems = [
            ...items,
            {
              curriculum_name: 'Uncategorized (Needs Review) – Science',
              states: missing,
              description: 'Temporarily categorized pending verification from official sources.',
              source_url: 'https://www.ed.gov/'
            }
          ]
        }
        // Sort by number of states desc
        finalItems = finalItems.slice().sort((a, b) => b.states.length - a.states.length)
        return res.status(200).json({ success: true, items: finalItems, count: finalItems.length })
      }
    }
    // Canada science
    if (countryLc.includes('canada') && subjectLc.includes('science')) {
      const items = getCanadaScienceGroupings()
      return res.status(200).json({ success: true, items, count: items.length })
    }
    // Australia science
    if (countryLc.includes('australia') && subjectLc.includes('science')) {
      const items = getAustraliaScienceGroupings()
      return res.status(200).json({ success: true, items, count: items.length })
    }
    // UK science
    if ((countryLc.includes('uk') || countryLc.includes('united kingdom') || countryLc.includes('england') || countryLc.includes('scotland') || countryLc.includes('wales') || countryLc.includes('northern ireland')) && subjectLc.includes('science')) {
      const items = getUKScienceGroupings()
      return res.status(200).json({ success: true, items, count: items.length })
    }

    // Fallback: use existing AI generator for unsupported combinations
    return res.status(200).json({
      success: true,
      items: [
        {
          curriculum_name: `No special curriculum (${subject})`,
          states: [],
          description: 'No curated data available yet; please select another subject or use manual selection.'
        }
      ],
      count: 1
    })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal error' })
  }
}
