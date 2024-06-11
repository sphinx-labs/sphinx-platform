/* eslint-disable */
import * as types from './graphql'
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core'

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel-plugin for production.
 */
const documents = {
  'mutation CreateProject($input: CreateProjectInput!) {\n  CreateProject(input: $input) {\n    name\n    threshold\n    projectOwners {\n      ownerAddress\n    }\n    safeDeploymentStrategy {\n      address\n      safeName\n    }\n  }\n}':
    types.CreateProjectDocument,
  'mutation UpdateTeammate($input: UpdateTeammateInput!) {\n  UpdateTeammate(input: $input) {\n    teammates {\n      email\n      role\n    }\n    invites {\n      id\n      email\n      role\n      signedUp\n    }\n  }\n}':
    types.UpdateTeammateDocument,
  'mutation Invite($input: InviteTeammateInput!) {\n  InviteTeammate(input: $input) {\n    teammates {\n      email\n      role\n    }\n    invites {\n      id\n      email\n      role\n      signedUp\n    }\n  }\n}':
    types.InviteDocument,
  'query GetProject($input: GetProjectQueryInput!) {\n  project(input: $input) {\n    id\n    created\n    modified\n    name\n    projectNetworks {\n      id\n      network {\n        displayName\n        name\n        id\n      }\n      contracts {\n        id\n        referenceName\n        contractName\n        address\n      }\n    }\n    multichainDeployments {\n      id\n      created\n      modified\n      status\n      treeRoot\n      isTestnet\n      totalTxs\n      project {\n        name\n        threshold\n        projectOwners {\n          ownerAddress\n        }\n      }\n      treeChainStatus {\n        id\n        leavesExecuted\n        numLeaves\n        status\n        network {\n          id\n          name\n          displayName\n        }\n        projectDeployment {\n          status\n          failed\n          failureReason\n          project {\n            name\n          }\n          errorCode\n          contracts {\n            id\n            referenceName\n            contractName\n            address\n            projectVerification {\n              explorerVerifications {\n                status\n                explorer\n              }\n            }\n          }\n        }\n      }\n      treeSigners {\n        signer\n        signed\n        isProposer\n      }\n    }\n    safeDeploymentStrategy {\n      address\n      safeName\n    }\n    projectOwners {\n      ownerAddress\n    }\n  }\n}':
    types.GetProjectDocument,
  'mutation AddSignature($input: AddMultiChainDeploymentSignatureInput!) {\n  AddMultiChainDeploymentSignature(input: $input) {\n    treeSigners {\n      signer\n      signed\n    }\n  }\n}':
    types.AddSignatureDocument,
  'mutation CancelDeployment($input: CancelMultichainDeploymentInput!) {\n  CancelMultiChainDeployment(input: $input) {\n    status\n  }\n}':
    types.CancelDeploymentDocument,
  'query GetUser {\n  user {\n    id\n    role\n    organization {\n      id\n      created\n      modified\n      teammates {\n        id\n        email\n        role\n      }\n      invites {\n        id\n        email\n        role\n        signedUp\n      }\n      apiKeys {\n        apiKey\n      }\n      multiChainDeployments {\n        id\n        created\n        modified\n        status\n        treeRoot\n        isTestnet\n        totalTxs\n        project {\n          threshold\n          projectOwners {\n            ownerAddress\n          }\n        }\n        treeChainStatus {\n          id\n          leavesExecuted\n          numLeaves\n          status\n          network {\n            id\n            name\n            displayName\n          }\n          projectDeployment {\n            status\n            failed\n            failureReason\n            project {\n              name\n            }\n            errorCode\n            contracts {\n              id\n              referenceName\n              contractName\n              address\n              projectVerification {\n                explorerVerifications {\n                  status\n                  explorer\n                }\n              }\n            }\n          }\n        }\n        treeSigners {\n          signer\n          signed\n          isProposer\n        }\n      }\n      projects {\n        id\n        created\n        modified\n        name\n        safeDeploymentStrategy {\n          address\n          safeName\n        }\n      }\n    }\n  }\n}':
    types.GetUserDocument,
}

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: 'mutation CreateProject($input: CreateProjectInput!) {\n  CreateProject(input: $input) {\n    name\n    threshold\n    projectOwners {\n      ownerAddress\n    }\n    safeDeploymentStrategy {\n      address\n      safeName\n    }\n  }\n}'
): (typeof documents)['mutation CreateProject($input: CreateProjectInput!) {\n  CreateProject(input: $input) {\n    name\n    threshold\n    projectOwners {\n      ownerAddress\n    }\n    safeDeploymentStrategy {\n      address\n      safeName\n    }\n  }\n}']
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: 'mutation UpdateTeammate($input: UpdateTeammateInput!) {\n  UpdateTeammate(input: $input) {\n    teammates {\n      email\n      role\n    }\n    invites {\n      id\n      email\n      role\n      signedUp\n    }\n  }\n}'
): (typeof documents)['mutation UpdateTeammate($input: UpdateTeammateInput!) {\n  UpdateTeammate(input: $input) {\n    teammates {\n      email\n      role\n    }\n    invites {\n      id\n      email\n      role\n      signedUp\n    }\n  }\n}']
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: 'mutation Invite($input: InviteTeammateInput!) {\n  InviteTeammate(input: $input) {\n    teammates {\n      email\n      role\n    }\n    invites {\n      id\n      email\n      role\n      signedUp\n    }\n  }\n}'
): (typeof documents)['mutation Invite($input: InviteTeammateInput!) {\n  InviteTeammate(input: $input) {\n    teammates {\n      email\n      role\n    }\n    invites {\n      id\n      email\n      role\n      signedUp\n    }\n  }\n}']
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: 'query GetProject($input: GetProjectQueryInput!) {\n  project(input: $input) {\n    id\n    created\n    modified\n    name\n    projectNetworks {\n      id\n      network {\n        displayName\n        name\n        id\n      }\n      contracts {\n        id\n        referenceName\n        contractName\n        address\n      }\n    }\n    multichainDeployments {\n      id\n      created\n      modified\n      status\n      treeRoot\n      isTestnet\n      totalTxs\n      project {\n        name\n        threshold\n        projectOwners {\n          ownerAddress\n        }\n      }\n      treeChainStatus {\n        id\n        leavesExecuted\n        numLeaves\n        status\n        network {\n          id\n          name\n          displayName\n        }\n        projectDeployment {\n          status\n          failed\n          failureReason\n          project {\n            name\n          }\n          errorCode\n          contracts {\n            id\n            referenceName\n            contractName\n            address\n            projectVerification {\n              explorerVerifications {\n                status\n                explorer\n              }\n            }\n          }\n        }\n      }\n      treeSigners {\n        signer\n        signed\n        isProposer\n      }\n    }\n    safeDeploymentStrategy {\n      address\n      safeName\n    }\n    projectOwners {\n      ownerAddress\n    }\n  }\n}'
): (typeof documents)['query GetProject($input: GetProjectQueryInput!) {\n  project(input: $input) {\n    id\n    created\n    modified\n    name\n    projectNetworks {\n      id\n      network {\n        displayName\n        name\n        id\n      }\n      contracts {\n        id\n        referenceName\n        contractName\n        address\n      }\n    }\n    multichainDeployments {\n      id\n      created\n      modified\n      status\n      treeRoot\n      isTestnet\n      totalTxs\n      project {\n        name\n        threshold\n        projectOwners {\n          ownerAddress\n        }\n      }\n      treeChainStatus {\n        id\n        leavesExecuted\n        numLeaves\n        status\n        network {\n          id\n          name\n          displayName\n        }\n        projectDeployment {\n          status\n          failed\n          failureReason\n          project {\n            name\n          }\n          errorCode\n          contracts {\n            id\n            referenceName\n            contractName\n            address\n            projectVerification {\n              explorerVerifications {\n                status\n                explorer\n              }\n            }\n          }\n        }\n      }\n      treeSigners {\n        signer\n        signed\n        isProposer\n      }\n    }\n    safeDeploymentStrategy {\n      address\n      safeName\n    }\n    projectOwners {\n      ownerAddress\n    }\n  }\n}']
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: 'mutation AddSignature($input: AddMultiChainDeploymentSignatureInput!) {\n  AddMultiChainDeploymentSignature(input: $input) {\n    treeSigners {\n      signer\n      signed\n    }\n  }\n}'
): (typeof documents)['mutation AddSignature($input: AddMultiChainDeploymentSignatureInput!) {\n  AddMultiChainDeploymentSignature(input: $input) {\n    treeSigners {\n      signer\n      signed\n    }\n  }\n}']
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: 'mutation CancelDeployment($input: CancelMultichainDeploymentInput!) {\n  CancelMultiChainDeployment(input: $input) {\n    status\n  }\n}'
): (typeof documents)['mutation CancelDeployment($input: CancelMultichainDeploymentInput!) {\n  CancelMultiChainDeployment(input: $input) {\n    status\n  }\n}']
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: 'query GetUser {\n  user {\n    id\n    role\n    organization {\n      id\n      created\n      modified\n      teammates {\n        id\n        email\n        role\n      }\n      invites {\n        id\n        email\n        role\n        signedUp\n      }\n      apiKeys {\n        apiKey\n      }\n      multiChainDeployments {\n        id\n        created\n        modified\n        status\n        treeRoot\n        isTestnet\n        totalTxs\n        project {\n          threshold\n          projectOwners {\n            ownerAddress\n          }\n        }\n        treeChainStatus {\n          id\n          leavesExecuted\n          numLeaves\n          status\n          network {\n            id\n            name\n            displayName\n          }\n          projectDeployment {\n            status\n            failed\n            failureReason\n            project {\n              name\n            }\n            errorCode\n            contracts {\n              id\n              referenceName\n              contractName\n              address\n              projectVerification {\n                explorerVerifications {\n                  status\n                  explorer\n                }\n              }\n            }\n          }\n        }\n        treeSigners {\n          signer\n          signed\n          isProposer\n        }\n      }\n      projects {\n        id\n        created\n        modified\n        name\n        safeDeploymentStrategy {\n          address\n          safeName\n        }\n      }\n    }\n  }\n}'
): (typeof documents)['query GetUser {\n  user {\n    id\n    role\n    organization {\n      id\n      created\n      modified\n      teammates {\n        id\n        email\n        role\n      }\n      invites {\n        id\n        email\n        role\n        signedUp\n      }\n      apiKeys {\n        apiKey\n      }\n      multiChainDeployments {\n        id\n        created\n        modified\n        status\n        treeRoot\n        isTestnet\n        totalTxs\n        project {\n          threshold\n          projectOwners {\n            ownerAddress\n          }\n        }\n        treeChainStatus {\n          id\n          leavesExecuted\n          numLeaves\n          status\n          network {\n            id\n            name\n            displayName\n          }\n          projectDeployment {\n            status\n            failed\n            failureReason\n            project {\n              name\n            }\n            errorCode\n            contracts {\n              id\n              referenceName\n              contractName\n              address\n              projectVerification {\n                explorerVerifications {\n                  status\n                  explorer\n                }\n              }\n            }\n          }\n        }\n        treeSigners {\n          signer\n          signed\n          isProposer\n        }\n      }\n      projects {\n        id\n        created\n        modified\n        name\n        safeDeploymentStrategy {\n          address\n          safeName\n        }\n      }\n    }\n  }\n}']

export function graphql(source: string) {
  return (documents as any)[source] ?? {}
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never
