import SchemaBuilder from '@pothos/core'
import PrismaPlugin from '@pothos/plugin-prisma'
import type PrismaTypes from '@pothos/plugin-prisma/generated'
import WithInputPlugin from '@pothos/plugin-with-input'
import {
  Contracts,
  MultiChainDeployments,
  MultichainDeploymentStatus,
  Networks,
  Organizations,
  ProjectDeployments,
  ProjectDeploymentStatus,
  ProjectNetworks,
  Projects,
} from '@prisma/client'
import { DateTimeResolver } from 'graphql-scalars'

import { GraphQLContext } from '@/server/api/graphql/context'
import { prisma } from '@/server/utils/prisma'

export type SortOrder = 'asc' | 'desc'
export type ProjectDeploymentErrorCode = 1 | 2 | 3 | 4 | 5 | 6

export const builder = new SchemaBuilder<{
  Scalars: {
    Date: { Input: Date; Output: Date }
    SortOrder: { Input: SortOrder; Output: SortOrder }
    MultichainDeploymentStatus: {
      Input: MultichainDeploymentStatus
      Output: MultichainDeploymentStatus
    }
    ProjectDeploymentStatus: {
      Input: ProjectDeploymentStatus
      Output: ProjectDeploymentStatus
    }
    ProjectDeploymentErrorCode: {
      Input: ProjectDeploymentErrorCode
      Output: ProjectDeploymentErrorCode
    }
  }
  PrismaTypes: PrismaTypes
  Context: GraphQLContext
  Objects: {
    Projects: Projects
    ProjectDeployments: ProjectDeployments
    MultiChainDeployments: MultiChainDeployments
    Networks: Networks
    Contracts: Contracts
    Organizations: Organizations
    ProjectNetworks: ProjectNetworks
    ProjectDeploymentErrorCode: ProjectDeploymentErrorCode
  }
}>({
  plugins: [PrismaPlugin, WithInputPlugin],
  prisma: {
    client: prisma,
  },
})

builder.addScalarType('Date', DateTimeResolver, {})
builder.queryType({})
builder.mutationType({})
