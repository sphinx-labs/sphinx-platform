import { MultichainDeploymentStatus } from '@prisma/client'

import { prisma } from '@/server/utils/prisma'

export const estimateSphinxFees = async (
  newTransactions: number,
  orgId: string
) => {
  const now = new Date()

  // Calculate the first day of the current month
  const firstDayOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0
  )

  // Calculate the last day of the current month
  const nextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
    0,
    0,
    0,
    0
  )
  const lastDayOfMonth = new Date(nextMonth.getTime() - 1)
  const deploymentsInLastMonth = await prisma.multiChainDeployments.findMany({
    where: {
      orgId,
      modified: {
        lt: lastDayOfMonth,
        gte: firstDayOfMonth,
      },
      isTestnet: false,
      status: MultichainDeploymentStatus.completed,
    },
  })

  const chargedTransactions = deploymentsInLastMonth.reduce(
    (value, deployment) => {
      return (value += deployment.totalTxs)
    },
    0
  )
  const cost = calculateCost(newTransactions, chargedTransactions)
  return cost
}

const txsBetweenXAndY = (
  totalTransactions: number,
  chargedTransactions: number,
  start: number,
  end: number
) => {
  // If there have already been enough txs to cover the entire range, then return 0
  if (chargedTransactions >= end || totalTransactions <= start) {
    return 0
  } else {
    // Find the range start point by using the maximum of the defined range start or the number of charged transactions
    const maxStart = Math.max(start, chargedTransactions)

    // Find the range end point by using the minimum of the defined end or the total transactions
    const minEnd = Math.min(end, totalTransactions)

    // Return the number of transactions in the range
    return minEnd - maxStart
  }
}

export const calculateCost = (
  newTransactions: number,
  chargedTransactions: number
) => {
  const totalTransactions = newTransactions + chargedTransactions

  const under25 = txsBetweenXAndY(totalTransactions, chargedTransactions, 0, 25)
  const under125 = txsBetweenXAndY(
    totalTransactions,
    chargedTransactions,
    25,
    125
  )
  const over125 = newTransactions - under25 - under125

  return under25 * 5 + under125 * 1 + over125 * 0.1
}
