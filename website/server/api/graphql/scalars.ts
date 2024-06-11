import {
  Blockexplorer,
  ExplorerVerificationStatus,
  MultichainDeploymentStatus,
  ProjectDeploymentStatus,
  ProjectVerificationStatus,
  SafeDeploymentMethod,
  TreeStatus,
} from '@prisma/client'

import {
  builder,
  ProjectDeploymentErrorCode,
  SortOrder,
} from '@/server/api/graphql/builder'

export const SafeDeploymentMethodType = builder.enumType(
  'SafeDeploymentMethodType',
  {
    values: Object.values(SafeDeploymentMethod),
  }
)

export const MultichainDeploymentStatusType = builder.enumType(
  'MultichainDeploymentStatusType',
  {
    values: Object.values(MultichainDeploymentStatus),
  }
)

export const ProjectDeploymentStatusType = builder.enumType(
  'ProjectDeploymentStatusType',
  {
    values: Object.values(ProjectDeploymentStatus),
  }
)

export const ProjectVerificationStatusType = builder.enumType(
  'ProjectVerificationStatusType',
  {
    values: Object.values(ProjectVerificationStatus),
  }
)

export const ExplorerVerificationStatusType = builder.enumType(
  'ExplorerVerificationStatusType',
  {
    values: Object.values(ExplorerVerificationStatus),
  }
)

export const BlockExplorerType = builder.enumType('BlockExplorerType', {
  values: Object.values(Blockexplorer),
})

export const TreeStatusType = builder.enumType('TreeStatusType', {
  values: Object.values(TreeStatus),
})

builder.scalarType('ProjectDeploymentErrorCode', {
  serialize: (n) => n,
  parseValue: (n) => {
    const validValues = [1, 2, 3, 4, 5, 6]
    if (typeof n !== 'number' || !validValues.includes(n)) {
      throw new Error(`${n} is not a valid deployment error code status`)
    } else {
      return n as ProjectDeploymentErrorCode
    }
  },
})

builder.scalarType('ProjectDeploymentStatus', {
  serialize: (n) => n,
  parseValue: (n) => {
    const validValues = [
      'approved',
      'cancelled',
      'executed',
      'verified',
      'failed',
    ]
    if (typeof n !== 'string' || !validValues.includes(n)) {
      throw new Error(`${n} is not a valid deployment status`)
    } else {
      return n as ProjectDeploymentStatus
    }
  },
})

builder.scalarType('MultichainDeploymentStatus', {
  serialize: (n) => n,
  parseValue: (n) => {
    const validValues = [
      'proposed',
      'funded',
      'approved',
      'submittedLeaves',
      'completed',
    ]
    if (typeof n !== 'string' || !validValues.includes(n)) {
      throw new Error(`${n} is not a valid deployment status`)
    } else {
      return n as MultichainDeploymentStatus
    }
  },
})

builder.scalarType('SortOrder', {
  serialize: (n) => n,
  parseValue: (n) => {
    const validValues = ['asc', 'desc']
    if (typeof n !== 'string' || !validValues.includes(n)) {
      throw new Error(`${n} is not a valid deployment status`)
    } else {
      return n as SortOrder
    }
  },
})
