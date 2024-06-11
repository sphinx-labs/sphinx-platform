/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K]
}
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>
}
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>
}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: any
  MultichainDeploymentStatus: any
  ProjectDeploymentErrorCode: any
  ProjectDeploymentStatus: any
  SortOrder: any
}

export type AddMultiChainDeploymentSignatureInput = {
  multichainDeploymentId: Scalars['String']
  signature: Scalars['String']
  signer: Scalars['String']
}

export type ApiKeys = {
  __typename?: 'ApiKeys'
  apiKey: Scalars['String']
  created: Scalars['Date']
  id: Scalars['ID']
  modified: Scalars['Date']
  orgId?: Maybe<Scalars['String']>
}

export enum BlockExplorerType {
  Blockscout = 'Blockscout',
  Etherscan = 'Etherscan',
}

export type CancelMultichainDeploymentInput = {
  multichainDeploymentId: Scalars['String']
}

export type Contracts = {
  __typename?: 'Contracts'
  address: Scalars['String']
  contractName: Scalars['String']
  created: Scalars['Date']
  id: Scalars['ID']
  modified: Scalars['Date']
  network: Networks
  project: Projects
  projectNetwork: ProjectNetworks
  projectVerification?: Maybe<ProjectVerifications>
  referenceName: Scalars['String']
}

export type CreateProjectInput = {
  owners: Array<Scalars['String']>
  projectName: Scalars['String']
  saltNonce: Scalars['String']
  threshold: Scalars['String']
}

export enum ExplorerVerificationStatusType {
  failing = 'failing',
  queued = 'queued',
  unverified = 'unverified',
  verification_unsupported = 'verification_unsupported',
  verified = 'verified',
}

export type ExplorerVerifications = {
  __typename?: 'ExplorerVerifications'
  created: Scalars['Date']
  explorer: BlockExplorerType
  id: Scalars['ID']
  modified: Scalars['Date']
  status: ExplorerVerificationStatusType
  tries: Scalars['Int']
}

export type GetMultichainDeploymentInput = {
  id: Scalars['String']
}

export type GetProjectQueryInput = {
  id: Scalars['String']
}

export type InviteTeammateInput = {
  email: Scalars['String']
  role: Scalars['String']
}

export type Invites = {
  __typename?: 'Invites'
  created: Scalars['Date']
  email: Scalars['String']
  id: Scalars['ID']
  modified: Scalars['Date']
  role: Scalars['String']
  signedUp: Scalars['Boolean']
}

export type MultiChainDeployments = {
  __typename?: 'MultiChainDeployments'
  created: Scalars['Date']
  id: Scalars['ID']
  isTestnet: Scalars['Boolean']
  modified: Scalars['Date']
  organization: Organizations
  project: Projects
  projectDeployments: Array<ProjectDeployments>
  status: MultichainDeploymentStatusType
  totalTxs: Scalars['Int']
  treeChainStatus: Array<TreeChainStatus>
  treeRoot: Scalars['String']
  treeSigners: Array<TreeSigners>
}

export enum MultichainDeploymentStatusType {
  approved = 'approved',
  cancelled = 'cancelled',
  completed = 'completed',
  executed = 'executed',
  funded = 'funded',
  proposed = 'proposed',
}

export type Mutation = {
  __typename?: 'Mutation'
  AddMultiChainDeploymentSignature: MultiChainDeployments
  CancelMultiChainDeployment: MultiChainDeployments
  CreateProject: Projects
  InviteTeammate: Organizations
  UpdateProject: Projects
  UpdateTeammate: Organizations
}

export type MutationAddMultiChainDeploymentSignatureArgs = {
  input: AddMultiChainDeploymentSignatureInput
}

export type MutationCancelMultiChainDeploymentArgs = {
  input: CancelMultichainDeploymentInput
}

export type MutationCreateProjectArgs = {
  input: CreateProjectInput
}

export type MutationInviteTeammateArgs = {
  input: InviteTeammateInput
}

export type MutationUpdateProjectArgs = {
  input: UpdateProjectInput
}

export type MutationUpdateTeammateArgs = {
  input: UpdateTeammateInput
}

export type Networks = {
  __typename?: 'Networks'
  created: Scalars['Date']
  displayName: Scalars['String']
  id: Scalars['Int']
  modified: Scalars['Date']
  name: Scalars['String']
}

export type Organizations = {
  __typename?: 'Organizations'
  apiKeys: Array<ApiKeys>
  created: Scalars['Date']
  id: Scalars['ID']
  invites: Array<Invites>
  modified: Scalars['Date']
  multiChainDeployments: Array<MultiChainDeployments>
  projects: Array<Projects>
  teammates: Array<User>
}

export enum ProjectDeploymentStatusType {
  approved = 'approved',
  cancelled = 'cancelled',
  executed = 'executed',
}

export type ProjectDeployments = {
  __typename?: 'ProjectDeployments'
  contracts: Array<Contracts>
  created: Scalars['Date']
  deploymentId?: Maybe<Scalars['String']>
  errorCode?: Maybe<Scalars['ProjectDeploymentErrorCode']>
  failed: Scalars['Boolean']
  failureIndex?: Maybe<Scalars['Int']>
  failureReason?: Maybe<Scalars['String']>
  id: Scalars['ID']
  modified: Scalars['Date']
  multichainDeployment: MultiChainDeployments
  network: Networks
  project: Projects
  projectVerification: ProjectVerifications
  status: ProjectDeploymentStatusType
}

export type ProjectNetworks = {
  __typename?: 'ProjectNetworks'
  contracts: Array<Contracts>
  id: Scalars['ID']
  network: Networks
  project: Projects
  projectDeployments: Array<ProjectDeployments>
  registered: Scalars['Boolean']
}

export enum ProjectVerificationStatusType {
  completed = 'completed',
  pending = 'pending',
  verifying = 'verifying',
}

export type ProjectVerifications = {
  __typename?: 'ProjectVerifications'
  created: Scalars['Date']
  explorerVerifications: Array<ExplorerVerifications>
  id: Scalars['ID']
  modified: Scalars['Date']
  status: ProjectVerificationStatusType
}

export type Projects = {
  __typename?: 'Projects'
  contracts: Array<Contracts>
  created: Scalars['Date']
  id: Scalars['ID']
  modified: Scalars['Date']
  multichainDeployments: Array<MultiChainDeployments>
  name: Scalars['String']
  organization: Organizations
  projectDeployments: Array<ProjectDeployments>
  projectNetworks: Array<ProjectNetworks>
  projectOwners: Array<SafeOwners>
  safeDeploymentStrategy: SafeDeploymentStrategy
  threshold: Scalars['Int']
}

export type Query = {
  __typename?: 'Query'
  multichainDeployment?: Maybe<MultiChainDeployments>
  project?: Maybe<Projects>
  projectDeployment?: Maybe<ProjectDeployments>
  user: User
}

export type QuerymultichainDeploymentArgs = {
  input: GetMultichainDeploymentInput
}

export type QueryprojectArgs = {
  input: GetProjectQueryInput
}

export type QueryprojectDeploymentArgs = {
  id?: InputMaybe<Scalars['String']>
}

export enum SafeDeploymentMethodType {
  first_party_consistent = 'first_party_consistent',
  pre_audit = 'pre_audit',
}

export type SafeDeploymentStrategy = {
  __typename?: 'SafeDeploymentStrategy'
  address?: Maybe<Scalars['String']>
  created: Scalars['Date']
  deploymentMethod: SafeDeploymentMethodType
  id: Scalars['ID']
  modified: Scalars['Date']
  safeName?: Maybe<Scalars['String']>
}

export type SafeOwners = {
  __typename?: 'SafeOwners'
  created: Scalars['Date']
  id: Scalars['ID']
  modified: Scalars['Date']
  ownerAddress: Scalars['String']
  project: Projects
  projectId: Scalars['ID']
  safeDeploymentStrategy: SafeDeploymentStrategy
  safeDeploymentStrategyId?: Maybe<Scalars['ID']>
}

export type TreeChainStatus = {
  __typename?: 'TreeChainStatus'
  created: Scalars['Date']
  id: Scalars['ID']
  leavesExecuted: Scalars['Int']
  modified: Scalars['Date']
  multichainDeployment: MultiChainDeployments
  network: Networks
  numLeaves: Scalars['Int']
  projectDeployment: ProjectDeployments
  status: TreeStatusType
}

export type TreeSigners = {
  __typename?: 'TreeSigners'
  created: Scalars['Date']
  id: Scalars['ID']
  isProposer: Scalars['Boolean']
  modified: Scalars['Date']
  multichainDeployment: MultiChainDeployments
  signature?: Maybe<Scalars['String']>
  signed: Scalars['Boolean']
  signer: Scalars['String']
}

export enum TreeStatusType {
  completed = 'completed',
  executingDeployment = 'executingDeployment',
  proposed = 'proposed',
}

export type UpdateProjectInput = {
  projectId: Scalars['String']
  projectName: Scalars['String']
}

export type UpdateTeammateInput = {
  email: Scalars['String']
  role: Scalars['String']
}

export type User = {
  __typename?: 'User'
  created: Scalars['Date']
  email?: Maybe<Scalars['String']>
  id: Scalars['ID']
  image?: Maybe<Scalars['String']>
  modified: Scalars['Date']
  name?: Maybe<Scalars['String']>
  organization: Organizations
  role: Scalars['String']
}

export type CreateProjectMutationVariables = Exact<{
  input: CreateProjectInput
}>

export type CreateProjectMutation = {
  __typename?: 'Mutation'
  CreateProject: {
    __typename?: 'Projects'
    name: string
    threshold: number
    projectOwners: Array<{ __typename?: 'SafeOwners'; ownerAddress: string }>
    safeDeploymentStrategy: {
      __typename?: 'SafeDeploymentStrategy'
      address?: string | null
      safeName?: string | null
    }
  }
}

export type UpdateTeammateMutationVariables = Exact<{
  input: UpdateTeammateInput
}>

export type UpdateTeammateMutation = {
  __typename?: 'Mutation'
  UpdateTeammate: {
    __typename?: 'Organizations'
    teammates: Array<{
      __typename?: 'User'
      email?: string | null
      role: string
    }>
    invites: Array<{
      __typename?: 'Invites'
      id: string
      email: string
      role: string
      signedUp: boolean
    }>
  }
}

export type InviteMutationVariables = Exact<{
  input: InviteTeammateInput
}>

export type InviteMutation = {
  __typename?: 'Mutation'
  InviteTeammate: {
    __typename?: 'Organizations'
    teammates: Array<{
      __typename?: 'User'
      email?: string | null
      role: string
    }>
    invites: Array<{
      __typename?: 'Invites'
      id: string
      email: string
      role: string
      signedUp: boolean
    }>
  }
}

export type GetProjectQueryVariables = Exact<{
  input: GetProjectQueryInput
}>

export type GetProjectQuery = {
  __typename?: 'Query'
  project?: {
    __typename?: 'Projects'
    id: string
    created: any
    modified: any
    name: string
    projectNetworks: Array<{
      __typename?: 'ProjectNetworks'
      id: string
      network: {
        __typename?: 'Networks'
        displayName: string
        name: string
        id: number
      }
      contracts: Array<{
        __typename?: 'Contracts'
        id: string
        referenceName: string
        contractName: string
        address: string
      }>
    }>
    multichainDeployments: Array<{
      __typename?: 'MultiChainDeployments'
      id: string
      created: any
      modified: any
      status: MultichainDeploymentStatusType
      treeRoot: string
      isTestnet: boolean
      totalTxs: number
      project: {
        __typename?: 'Projects'
        name: string
        threshold: number
        projectOwners: Array<{
          __typename?: 'SafeOwners'
          ownerAddress: string
        }>
      }
      treeChainStatus: Array<{
        __typename?: 'TreeChainStatus'
        id: string
        leavesExecuted: number
        numLeaves: number
        status: TreeStatusType
        network: {
          __typename?: 'Networks'
          id: number
          name: string
          displayName: string
        }
        projectDeployment: {
          __typename?: 'ProjectDeployments'
          status: ProjectDeploymentStatusType
          failed: boolean
          failureReason?: string | null
          errorCode?: any | null
          project: { __typename?: 'Projects'; name: string }
          contracts: Array<{
            __typename?: 'Contracts'
            id: string
            referenceName: string
            contractName: string
            address: string
            projectVerification?: {
              __typename?: 'ProjectVerifications'
              explorerVerifications: Array<{
                __typename?: 'ExplorerVerifications'
                status: ExplorerVerificationStatusType
                explorer: BlockExplorerType
              }>
            } | null
          }>
        }
      }>
      treeSigners: Array<{
        __typename?: 'TreeSigners'
        signer: string
        signed: boolean
        isProposer: boolean
      }>
    }>
    safeDeploymentStrategy: {
      __typename?: 'SafeDeploymentStrategy'
      address?: string | null
      safeName?: string | null
    }
    projectOwners: Array<{ __typename?: 'SafeOwners'; ownerAddress: string }>
  } | null
}

export type AddSignatureMutationVariables = Exact<{
  input: AddMultiChainDeploymentSignatureInput
}>

export type AddSignatureMutation = {
  __typename?: 'Mutation'
  AddMultiChainDeploymentSignature: {
    __typename?: 'MultiChainDeployments'
    treeSigners: Array<{
      __typename?: 'TreeSigners'
      signer: string
      signed: boolean
    }>
  }
}

export type CancelDeploymentMutationVariables = Exact<{
  input: CancelMultichainDeploymentInput
}>

export type CancelDeploymentMutation = {
  __typename?: 'Mutation'
  CancelMultiChainDeployment: {
    __typename?: 'MultiChainDeployments'
    status: MultichainDeploymentStatusType
  }
}

export type GetUserQueryVariables = Exact<{ [key: string]: never }>

export type GetUserQuery = {
  __typename?: 'Query'
  user: {
    __typename?: 'User'
    id: string
    role: string
    organization: {
      __typename?: 'Organizations'
      id: string
      created: any
      modified: any
      teammates: Array<{
        __typename?: 'User'
        id: string
        email?: string | null
        role: string
      }>
      invites: Array<{
        __typename?: 'Invites'
        id: string
        email: string
        role: string
        signedUp: boolean
      }>
      apiKeys: Array<{ __typename?: 'ApiKeys'; apiKey: string }>
      multiChainDeployments: Array<{
        __typename?: 'MultiChainDeployments'
        id: string
        created: any
        modified: any
        status: MultichainDeploymentStatusType
        treeRoot: string
        isTestnet: boolean
        totalTxs: number
        project: {
          __typename?: 'Projects'
          threshold: number
          projectOwners: Array<{
            __typename?: 'SafeOwners'
            ownerAddress: string
          }>
        }
        treeChainStatus: Array<{
          __typename?: 'TreeChainStatus'
          id: string
          leavesExecuted: number
          numLeaves: number
          status: TreeStatusType
          network: {
            __typename?: 'Networks'
            id: number
            name: string
            displayName: string
          }
          projectDeployment: {
            __typename?: 'ProjectDeployments'
            status: ProjectDeploymentStatusType
            failed: boolean
            failureReason?: string | null
            errorCode?: any | null
            project: { __typename?: 'Projects'; name: string }
            contracts: Array<{
              __typename?: 'Contracts'
              id: string
              referenceName: string
              contractName: string
              address: string
              projectVerification?: {
                __typename?: 'ProjectVerifications'
                explorerVerifications: Array<{
                  __typename?: 'ExplorerVerifications'
                  status: ExplorerVerificationStatusType
                  explorer: BlockExplorerType
                }>
              } | null
            }>
          }
        }>
        treeSigners: Array<{
          __typename?: 'TreeSigners'
          signer: string
          signed: boolean
          isProposer: boolean
        }>
      }>
      projects: Array<{
        __typename?: 'Projects'
        id: string
        created: any
        modified: any
        name: string
        safeDeploymentStrategy: {
          __typename?: 'SafeDeploymentStrategy'
          address?: string | null
          safeName?: string | null
        }
      }>
    }
  }
}

export const CreateProjectDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateProject' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'CreateProjectInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'CreateProject' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'threshold' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'projectOwners' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'ownerAddress' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'safeDeploymentStrategy' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'address' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'safeName' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  CreateProjectMutation,
  CreateProjectMutationVariables
>
export const UpdateTeammateDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateTeammate' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'UpdateTeammateInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'UpdateTeammate' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'teammates' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'invites' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'signedUp' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  UpdateTeammateMutation,
  UpdateTeammateMutationVariables
>
export const InviteDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'Invite' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'InviteTeammateInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'InviteTeammate' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'teammates' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'invites' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'email' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'signedUp' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<InviteMutation, InviteMutationVariables>
export const GetProjectDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetProject' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'GetProjectQueryInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'project' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'created' } },
                { kind: 'Field', name: { kind: 'Name', value: 'modified' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'projectNetworks' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'network' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'displayName' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'contracts' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'referenceName' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'contractName' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'address' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'multichainDeployments' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'created' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'modified' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'status' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'treeRoot' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'isTestnet' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'totalTxs' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'project' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'threshold' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'projectOwners' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: {
                                      kind: 'Name',
                                      value: 'ownerAddress',
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'treeChainStatus' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'leavesExecuted' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'numLeaves' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'status' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'network' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'id' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'name' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: {
                                      kind: 'Name',
                                      value: 'displayName',
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: {
                                kind: 'Name',
                                value: 'projectDeployment',
                              },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'status' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'failed' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: {
                                      kind: 'Name',
                                      value: 'failureReason',
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'project' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'name' },
                                        },
                                      ],
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'errorCode' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'contracts' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'id' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'referenceName',
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'contractName',
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'address',
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'projectVerification',
                                          },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value:
                                                    'explorerVerifications',
                                                },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    {
                                                      kind: 'Field',
                                                      name: {
                                                        kind: 'Name',
                                                        value: 'status',
                                                      },
                                                    },
                                                    {
                                                      kind: 'Field',
                                                      name: {
                                                        kind: 'Name',
                                                        value: 'explorer',
                                                      },
                                                    },
                                                  ],
                                                },
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'treeSigners' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'signer' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'signed' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'isProposer' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'safeDeploymentStrategy' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'address' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'safeName' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'projectOwners' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'ownerAddress' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetProjectQuery, GetProjectQueryVariables>
export const AddSignatureDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AddSignature' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: {
                kind: 'Name',
                value: 'AddMultiChainDeploymentSignatureInput',
              },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'AddMultiChainDeploymentSignature' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'treeSigners' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'signer' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'signed' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  AddSignatureMutation,
  AddSignatureMutationVariables
>
export const CancelDeploymentDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CancelDeployment' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'input' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'CancelMultichainDeploymentInput' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'CancelMultiChainDeployment' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'input' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'input' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  CancelDeploymentMutation,
  CancelDeploymentMutationVariables
>
export const GetUserDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetUser' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'user' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'role' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'organization' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'created' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'modified' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'teammates' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'email' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'role' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'invites' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'email' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'role' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'signedUp' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'apiKeys' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'apiKey' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'multiChainDeployments' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'created' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'modified' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'status' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'treeRoot' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'isTestnet' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'totalTxs' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'project' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'threshold' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: {
                                      kind: 'Name',
                                      value: 'projectOwners',
                                    },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'ownerAddress',
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'treeChainStatus' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'id' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: {
                                      kind: 'Name',
                                      value: 'leavesExecuted',
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'numLeaves' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'status' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'network' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'id' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'name' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'displayName',
                                          },
                                        },
                                      ],
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: {
                                      kind: 'Name',
                                      value: 'projectDeployment',
                                    },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'status',
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'failed',
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'failureReason',
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'project',
                                          },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'name',
                                                },
                                              },
                                            ],
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'errorCode',
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'contracts',
                                          },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'id',
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'referenceName',
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'contractName',
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'address',
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'projectVerification',
                                                },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    {
                                                      kind: 'Field',
                                                      name: {
                                                        kind: 'Name',
                                                        value:
                                                          'explorerVerifications',
                                                      },
                                                      selectionSet: {
                                                        kind: 'SelectionSet',
                                                        selections: [
                                                          {
                                                            kind: 'Field',
                                                            name: {
                                                              kind: 'Name',
                                                              value: 'status',
                                                            },
                                                          },
                                                          {
                                                            kind: 'Field',
                                                            name: {
                                                              kind: 'Name',
                                                              value: 'explorer',
                                                            },
                                                          },
                                                        ],
                                                      },
                                                    },
                                                  ],
                                                },
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'treeSigners' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'signer' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'signed' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'isProposer' },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'projects' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'created' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'modified' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'name' },
                            },
                            {
                              kind: 'Field',
                              name: {
                                kind: 'Name',
                                value: 'safeDeploymentStrategy',
                              },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'address' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'safeName' },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetUserQuery, GetUserQueryVariables>
