import { describe, expect, test } from '@jest/globals'

import { calculateCost } from '../server/utils/pricing'

describe('calculateCost function', () => {
  test('calculates the cost for the first 25 transactions', () => {
    const newTransactions = 25
    const chargedTransactions = 0
    const cost = calculateCost(newTransactions, chargedTransactions)
    expect(cost).toEqual(125) // 25 transactions * $5 each
  })

  test('calculates the cost for the first 26 transactions', () => {
    const newTransactions = 26
    const chargedTransactions = 0
    const cost = calculateCost(newTransactions, chargedTransactions)
    expect(cost).toEqual(126) // 25 transactions * $5 each + 1 transaction * $1
  })

  test('calculates the cost for the first 126 transactions', () => {
    const newTransactions = 126
    const chargedTransactions = 0
    const cost = calculateCost(newTransactions, chargedTransactions)
    expect(cost).toEqual(225.1) // 25 transactions * $5 each + 100 transaction * $1 + 1 transaction * $0.1
  })

  test('calculates the cost for the first 120 transactions after 5 already charged', () => {
    const newTransactions = 120
    const chargedTransactions = 5
    const cost = calculateCost(newTransactions, chargedTransactions)
    expect(cost).toEqual(200) // 20 transactions * $5 each + 100 transaction * $1
  })

  test('calculates the cost for the next 100 transactions after 25 already charged', () => {
    const newTransactions = 100
    const chargedTransactions = 25
    const cost = calculateCost(newTransactions, chargedTransactions)
    expect(cost).toEqual(100) // 100 transactions * $1 each
  })

  test('calculates the cost for 25 additional transactions after 100 already charged', () => {
    const newTransactions = 25
    const chargedTransactions = 125
    const cost = calculateCost(newTransactions, chargedTransactions)
    expect(cost).toEqual(2.5) // 25 transactions * $0.1 each
  })

  test('calculates the cost for zero transactions', () => {
    const totalTransactions = 0
    const chargedTransactions = 0
    const cost = calculateCost(totalTransactions, chargedTransactions)
    expect(cost).toEqual(0)
  })
})
