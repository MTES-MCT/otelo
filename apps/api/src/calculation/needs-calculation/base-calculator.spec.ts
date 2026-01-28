import { ESourceB11 } from '~/schemas/scenarios/scenario'
import { BaseCalculator, CalculationContext } from './base-calculator'

// Create a concrete implementation for testing
class TestCalculator extends BaseCalculator {
  calculate(): number {
    return 0 // Not needed for these tests
  }

  // Expose protected method for testing
  public testApplyCoefficient(value: number): number {
    return this.applyCoefficient(value)
  }
}

describe('BaseCalculator', () => {
  let calculator: TestCalculator
  const mockContext: CalculationContext = {
    coefficient: 1.5,
    periodProjection: 6,
    simulation: {
      createdAt: new Date('2024-01-01'),
      epci: {
        code: 'epci-1',
        name: 'EPCI 1',
        region: 'region-1',
      },
      id: 'simulation-1',
      scenario: {
        b11_etablissement: [],
        b11_fortune: true,
        b11_hotel: true,
        b11_part_etablissement: 100,
        b11_sa: true,
        b12_cohab_interg_subie: 50,
        b12_heberg_particulier: true,
        b12_heberg_temporaire: true,
        b13_acc: true,
        b13_plp: true,
        b13_taux_effort: 30,
        b13_taux_reallocation: 80,
        b14_confort: 'RP_abs_sani',
        b14_occupation: 'prop_loc',
        b14_qualite: '',
        b14_taux_reallocation: 80,
        b15_loc_hors_hlm: true,
        b15_proprietaire: false,
        b15_surocc: 'Acc',
        b15_taux_reallocation: 80,
        b17_motif: 'Tout',
        b1_horizon_resorption: 20,
        b2_scenario: 'Central_C',
        createdAt: new Date('2024-01-01'),
        id: 'scenario-1',
        isConfidential: false,
        projection: 2024,
        source_b11: ESourceB11.RP,
        source_b14: ESourceB11.RP,
        source_b15: ESourceB11.RP,
        updatedAt: new Date('2024-01-01'),
      },
      updatedAt: new Date('2024-01-01'),
    },
  }

  beforeEach(() => {
    calculator = new TestCalculator(mockContext)
  })

  describe('applyCoefficient', () => {
    it('should multiply the value by the coefficient and round to nearest integer', () => {
      const testCases = [
        { expected: 150, input: 100 },
        { expected: 100, input: 66.6 },
        { expected: 50, input: 33.3 },
        { expected: 0, input: 0 },
        { expected: -150, input: -100 },
      ]

      testCases.forEach(({ expected, input }) => {
        const result = calculator.testApplyCoefficient(input)
        expect(result).toBe(expected)
      })
    })

    it('should handle zero coefficient', () => {
      const calculatorWithZeroCoeff = new TestCalculator({
        ...mockContext,
        coefficient: 0,
      })

      const result = calculatorWithZeroCoeff.testApplyCoefficient(100)
      expect(result).toBe(0)
    })

    it('should handle negative coefficient', () => {
      const calculatorWithNegativeCoeff = new TestCalculator({
        ...mockContext,
        coefficient: -1.5,
      })

      const result = calculatorWithNegativeCoeff.testApplyCoefficient(100)
      expect(result).toBe(-150)
    })
  })
})
