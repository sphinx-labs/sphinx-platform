import { describe, expect } from '@jest/globals'
import { roundToTwoSignificantDigits } from '../src/utils/math'

// Test suite
describe('roundToTwoSignificantDigits', () => {
  it('should round 1.156 to 1.16', () => {
    expect(roundToTwoSignificantDigits(1.156)).toEqual(1.16)
  })

  it('should round 0.0087015431 to 0.0087', () => {
    expect(roundToTwoSignificantDigits(0.0087015431)).toEqual(0.0087)
  })

  it('should round 453.4624742134247 to 453.46', () => {
    expect(roundToTwoSignificantDigits(453.4624742134247)).toEqual(453.46)
  })

  it('should round 0 to 0', () => {
    expect(roundToTwoSignificantDigits(0)).toEqual(0)
  })

  it('should round a negative number -0.046 to -0.046', () => {
    expect(roundToTwoSignificantDigits(-0.046)).toEqual(-0.046)
  })

  it('should round a large number 123456789.123 to 123456789.12', () => {
    expect(roundToTwoSignificantDigits(123456789.123)).toEqual(123456789.12)
  })
})
