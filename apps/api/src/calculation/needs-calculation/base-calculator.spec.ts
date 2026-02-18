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
    baseYear: 2021,
    millesime: '2021',
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
