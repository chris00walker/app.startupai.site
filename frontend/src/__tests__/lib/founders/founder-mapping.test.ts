/**
 * Unit tests for AI Founders Mapping Utility
 * @story US-F02
*/

import {
  AI_FOUNDERS,
  getAllFounders,
  getFounderById,
  getFounderByCrew,
  getFounderBySource,
  getFounderByDataType,
  isValidFounderId,
  type FounderId,
  type AttributableDataType,
} from '@/lib/founders/founder-mapping'

describe('AI Founders Mapping', () => {
  describe('AI_FOUNDERS constant', () => {
    it('should contain exactly 6 founders', () => {
      expect(Object.keys(AI_FOUNDERS)).toHaveLength(6)
    })

    it('should have all required founder IDs', () => {
      const expectedIds: FounderId[] = ['sage', 'forge', 'pulse', 'compass', 'guardian', 'ledger']
      expectedIds.forEach((id) => {
        expect(AI_FOUNDERS[id]).toBeDefined()
      })
    })

    it('should have correct metadata for Sage (CSO)', () => {
      expect(AI_FOUNDERS.sage).toMatchObject({
        id: 'sage',
        name: 'Sage',
        title: 'CSO',
        role: 'Strategy & Analysis',
        crews: ['service', 'analysis'],
        color: 'blue',
      })
    })

    it('should have correct metadata for Forge (CTO)', () => {
      expect(AI_FOUNDERS.forge).toMatchObject({
        id: 'forge',
        name: 'Forge',
        title: 'CTO',
        role: 'Technical Feasibility',
        crews: ['build'],
        color: 'orange',
      })
    })

    it('should have correct metadata for Pulse (CGO)', () => {
      expect(AI_FOUNDERS.pulse).toMatchObject({
        id: 'pulse',
        name: 'Pulse',
        title: 'CGO',
        role: 'Growth & Testing',
        crews: ['growth'],
        color: 'pink',
      })
    })

    it('should have correct metadata for Compass (CPO)', () => {
      expect(AI_FOUNDERS.compass).toMatchObject({
        id: 'compass',
        name: 'Compass',
        title: 'CPO',
        role: 'Synthesis & Balance',
        crews: ['synthesis'],
        color: 'purple',
      })
    })

    it('should have correct metadata for Guardian (CCO)', () => {
      expect(AI_FOUNDERS.guardian).toMatchObject({
        id: 'guardian',
        name: 'Guardian',
        title: 'CCO',
        role: 'Governance & QA',
        crews: ['governance'],
        color: 'green',
      })
    })

    it('should have correct metadata for Ledger (CFO)', () => {
      expect(AI_FOUNDERS.ledger).toMatchObject({
        id: 'ledger',
        name: 'Ledger',
        title: 'CFO',
        role: 'Finance & Viability',
        crews: ['finance'],
        color: 'yellow',
      })
    })

    it('each founder should have required styling properties', () => {
      Object.values(AI_FOUNDERS).forEach((founder) => {
        expect(founder.bgColor).toBeDefined()
        expect(founder.textColor).toBeDefined()
        expect(founder.ringColor).toBeDefined()
        expect(founder.icon).toBeDefined()
      })
    })
  })

  describe('getAllFounders', () => {
    it('should return an array of 6 founders', () => {
      const founders = getAllFounders()
      expect(founders).toHaveLength(6)
    })

    it('should return founders in consistent order', () => {
      const founders1 = getAllFounders()
      const founders2 = getAllFounders()
      expect(founders1.map((f) => f.id)).toEqual(founders2.map((f) => f.id))
    })
  })

  describe('getFounderById', () => {
    it('should return correct founder for each ID', () => {
      expect(getFounderById('sage').name).toBe('Sage')
      expect(getFounderById('forge').name).toBe('Forge')
      expect(getFounderById('pulse').name).toBe('Pulse')
      expect(getFounderById('compass').name).toBe('Compass')
      expect(getFounderById('guardian').name).toBe('Guardian')
      expect(getFounderById('ledger').name).toBe('Ledger')
    })
  })

  describe('getFounderByCrew', () => {
    it('should map service crew to Sage', () => {
      const founder = getFounderByCrew('service')
      expect(founder?.id).toBe('sage')
    })

    it('should map analysis crew to Sage', () => {
      const founder = getFounderByCrew('analysis')
      expect(founder?.id).toBe('sage')
    })

    it('should map build crew to Forge', () => {
      const founder = getFounderByCrew('build')
      expect(founder?.id).toBe('forge')
    })

    it('should map growth crew to Pulse', () => {
      const founder = getFounderByCrew('growth')
      expect(founder?.id).toBe('pulse')
    })

    it('should map synthesis crew to Compass', () => {
      const founder = getFounderByCrew('synthesis')
      expect(founder?.id).toBe('compass')
    })

    it('should map governance crew to Guardian', () => {
      const founder = getFounderByCrew('governance')
      expect(founder?.id).toBe('guardian')
    })

    it('should map finance crew to Ledger', () => {
      const founder = getFounderByCrew('finance')
      expect(founder?.id).toBe('ledger')
    })

    it('should handle case insensitive matching', () => {
      expect(getFounderByCrew('SERVICE')?.id).toBe('sage')
      expect(getFounderByCrew('Build')?.id).toBe('forge')
      expect(getFounderByCrew('GROWTH')?.id).toBe('pulse')
    })

    it('should handle crew names with prefixes/suffixes', () => {
      expect(getFounderByCrew('CrewAI Growth Crew')?.id).toBe('pulse')
      expect(getFounderByCrew('analysis-crew')?.id).toBe('sage')
      expect(getFounderByCrew('finance_crew')?.id).toBe('ledger')
    })

    it('should return null for unknown crew', () => {
      expect(getFounderByCrew('unknown')).toBeNull()
      expect(getFounderByCrew('')).toBeNull()
    })
  })

  describe('getFounderBySource', () => {
    it('should map strategy-related sources to Sage', () => {
      expect(getFounderBySource('Customer Segment Analysis')?.id).toBe('sage')
      expect(getFounderBySource('VPC design')?.id).toBe('sage')
      expect(getFounderBySource('Value Map generation')?.id).toBe('sage')
    })

    it('should map technical sources to Forge', () => {
      expect(getFounderBySource('Technical Feasibility Assessment')?.id).toBe('forge')
      expect(getFounderBySource('MVP Architecture')?.id).toBe('forge')
    })

    it('should map growth sources to Pulse', () => {
      expect(getFounderBySource('Experiment design')?.id).toBe('pulse')
      expect(getFounderBySource('Desirability testing')?.id).toBe('pulse')
      expect(getFounderBySource('Ad campaign')?.id).toBe('pulse')
      expect(getFounderBySource('Conversion optimization')?.id).toBe('pulse')
    })

    it('should map synthesis sources to Compass', () => {
      expect(getFounderBySource('Pivot recommendation')?.id).toBe('compass')
      expect(getFounderBySource('Balance assessment')?.id).toBe('compass')
    })

    it('should map governance sources to Guardian', () => {
      expect(getFounderBySource('QA review')?.id).toBe('guardian')
      expect(getFounderBySource('Compliance check')?.id).toBe('guardian')
    })

    it('should map finance sources to Ledger', () => {
      expect(getFounderBySource('Unit Economics calculation')?.id).toBe('ledger')
      expect(getFounderBySource('CAC and LTV metrics')?.id).toBe('ledger')
      expect(getFounderBySource('Viability assessment')?.id).toBe('ledger')
      expect(getFounderBySource('Finance review')?.id).toBe('ledger')
    })

    it('should return null for unknown sources', () => {
      expect(getFounderBySource('random string')).toBeNull()
      expect(getFounderBySource('')).toBeNull()
    })
  })

  describe('getFounderByDataType', () => {
    const dataTypeFounderMap: Record<AttributableDataType, FounderId> = {
      vpc: 'sage',
      bmc: 'sage',
      assumptions: 'sage',
      customer_profiles: 'sage',
      value_maps: 'sage',
      experiments: 'pulse',
      desirability: 'pulse',
      feasibility: 'forge',
      viability: 'ledger',
      finance: 'ledger',
      synthesis: 'compass',
      governance: 'guardian',
    }

    Object.entries(dataTypeFounderMap).forEach(([dataType, expectedFounderId]) => {
      it(`should map ${dataType} to ${expectedFounderId}`, () => {
        const founder = getFounderByDataType(dataType as AttributableDataType)
        expect(founder.id).toBe(expectedFounderId)
      })
    })
  })

  describe('isValidFounderId', () => {
    it('should return true for valid founder IDs', () => {
      expect(isValidFounderId('sage')).toBe(true)
      expect(isValidFounderId('forge')).toBe(true)
      expect(isValidFounderId('pulse')).toBe(true)
      expect(isValidFounderId('compass')).toBe(true)
      expect(isValidFounderId('guardian')).toBe(true)
      expect(isValidFounderId('ledger')).toBe(true)
    })

    it('should return false for invalid founder IDs', () => {
      expect(isValidFounderId('invalid')).toBe(false)
      expect(isValidFounderId('')).toBe(false)
      expect(isValidFounderId('SAGE')).toBe(false) // Case sensitive
    })
  })
})
