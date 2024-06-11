-- CreateEnum
CREATE TYPE "SafeDeploymentMethod" AS ENUM ('first_party_consistent', 'pre_audit');

-- CreateEnum
CREATE TYPE "Blockexplorer" AS ENUM ('Etherscan', 'Blockscout');

-- CreateEnum
CREATE TYPE "ExplorerVerificationStatus" AS ENUM ('queued', 'failing', 'verified', 'verification_unsupported', 'unverified');

-- CreateEnum
CREATE TYPE "ProjectVerificationStatus" AS ENUM ('pending', 'verifying', 'completed');

-- CreateEnum
CREATE TYPE "RelayRequestStatus" AS ENUM ('queued', 'attempting', 'queuedForCancelation', 'canceled', 'completed');

-- CreateEnum
CREATE TYPE "RelayRequestType" AS ENUM ('transferToEscrow', 'withdrawFromEscrow', 'executeLeaf', 'registerSphinxDeployer', 'usdcAirdrop', 'deploymentTransaction');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('ETH', 'BNB', 'MATIC', 'xDAI', 'USDC', 'FTM', 'AVAX', 'CELO', 'MOVR', 'GLMR', 'FUSE', 'EVMOS', 'KAVA', 'OKT', 'RBTC', 'RING', 'CRAB', 'MNT');

-- CreateEnum
CREATE TYPE "MultichainDeploymentStatus" AS ENUM ('proposed', 'approved', 'funded', 'executed', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ProjectDeploymentStatus" AS ENUM ('approved', 'cancelled', 'executed');

-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('owner', 'admin', 'user', 'developer', 'deactivated');

-- CreateEnum
CREATE TYPE "Integration" AS ENUM ('hardhat', 'foundry');

-- CreateEnum
CREATE TYPE "TreeStatus" AS ENUM ('proposed', 'executingDeployment', 'completed');

-- CreateEnum
CREATE TYPE "TreeLeafType" AS ENUM ('approveDeployment', 'cancelActiveDeployment', 'setProposer', 'createProject', 'exportProxy', 'propose', 'removeProject', 'setOrgOwner', 'setOrgOwnerThreshold', 'setProjectManager', 'setProjectOwner', 'setProjectThreshold', 'setup', 'transferDeployerOwnership', 'updateContractsInProject', 'upgradeAuthImplementation', 'upgradeManagerAndAuthImpl', 'upgradeManagerImplementation', 'withdrawEth');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "image" TEXT,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "org_id" TEXT,
    "role" "Roles" NOT NULL DEFAULT 'owner',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safe_deployment_strategy" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "deployment_method" "SafeDeploymentMethod" NOT NULL DEFAULT 'first_party_consistent',
    "consistent_address" TEXT,
    "project_id" TEXT NOT NULL,
    "safe_identifier" TEXT,
    "threshold" INTEGER,
    "salt" TEXT,

    CONSTRAINT "safe_deployment_strategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "salt" TEXT NOT NULL DEFAULT '0',

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_owners" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "project_id" TEXT NOT NULL,
    "owner_address" TEXT NOT NULL,
    "safeDeploymentStrategyId" TEXT,

    CONSTRAINT "registration_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_networks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "registered" BOOLEAN NOT NULL,
    "safe_address" TEXT NOT NULL,
    "module_address" TEXT NOT NULL,

    CONSTRAINT "project_networks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "networks" (
    "id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "deprecated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "networks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "reference_name" TEXT NOT NULL,
    "contract_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "deployment_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "project_verification_id" TEXT,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multichain_deployments" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "tree_root" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "is_testnet" BOOLEAN NOT NULL,
    "total_txs" INTEGER NOT NULL DEFAULT 0,
    "probono" BOOLEAN NOT NULL DEFAULT false,
    "previous_completed_deployment_id" TEXT,
    "status" "MultichainDeploymentStatus" NOT NULL DEFAULT 'proposed',

    CONSTRAINT "multichain_deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_artifacts" (
    "id" TEXT NOT NULL,
    "multichain_deployment_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployment_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "explorer_verifications" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "status" "ExplorerVerificationStatus" NOT NULL,
    "explorer" "Blockexplorer" NOT NULL,
    "tries" INTEGER NOT NULL,
    "last_wait_period_ms" INTEGER NOT NULL DEFAULT 5000,
    "next_try" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "project_verification_id" TEXT NOT NULL,

    CONSTRAINT "explorer_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_verifications" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "status" "ProjectVerificationStatus" NOT NULL,
    "project_deployment_id" TEXT NOT NULL,

    CONSTRAINT "project_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_deployments" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "on_chain_id" TEXT NOT NULL,
    "error_code" INTEGER,
    "chain_id" INTEGER NOT NULL,
    "project_id" TEXT NOT NULL,
    "multichain_deployment_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "tries" INTEGER NOT NULL DEFAULT 0,
    "last_wait_period_ms" INTEGER NOT NULL DEFAULT 5000,
    "next_try" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failed" BOOLEAN NOT NULL DEFAULT false,
    "failure_reason" TEXT,
    "failure_index" INTEGER,
    "config_uri" TEXT NOT NULL DEFAULT '',
    "compiler_config_id" TEXT,
    "total_txs" INTEGER NOT NULL DEFAULT 0,
    "status" "ProjectDeploymentStatus" NOT NULL DEFAULT 'approved',

    CONSTRAINT "project_deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tree_chain_status" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "multichain_deployment_id" TEXT NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "leaves_executed" INTEGER NOT NULL,
    "num_leaves" INTEGER NOT NULL,
    "status" "TreeStatus" NOT NULL,

    CONSTRAINT "tree_chain_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tree_signers" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "multichain_deployment_id" TEXT NOT NULL,
    "signer" TEXT NOT NULL,
    "signature" TEXT,
    "signed" BOOLEAN NOT NULL,
    "is_proposer" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tree_signers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "org_id" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelayTries" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "block_hash" TEXT,
    "block_number" INTEGER,
    "data" TEXT,
    "gas_limit" TEXT,
    "gas_price" TEXT,
    "hash" TEXT NOT NULL,
    "mined" BOOLEAN NOT NULL,
    "max_fee_per_gas" TEXT,
    "max_priority_fee_per_gas" TEXT,
    "nonce" INTEGER,
    "to" TEXT,
    "from" TEXT,
    "value" TEXT,
    "confirmations" INTEGER NOT NULL,
    "gas_used" TEXT,
    "status" INTEGER,
    "fee" TEXT,
    "relay_request_id" TEXT NOT NULL,

    CONSTRAINT "RelayTries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relay_requests" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "to" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '0',
    "data" TEXT,
    "gas_limit" TEXT,
    "actions_minimum_gas_limit" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "tries" INTEGER NOT NULL DEFAULT 0,
    "last_wait_period_ms" INTEGER NOT NULL DEFAULT 5000,
    "next_try" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chain_id" INTEGER NOT NULL,
    "executable" BOOLEAN NOT NULL,
    "sphinx_transaction_hash" TEXT,
    "leaf_id" TEXT,
    "action_index" INTEGER,
    "multichain_deployment_id" TEXT,
    "txhash" TEXT,
    "reverted" BOOLEAN,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "type" "RelayRequestType" NOT NULL,
    "status" "RelayRequestStatus" NOT NULL DEFAULT 'queued',

    CONSTRAINT "relay_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionCosts" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "chain_id" INTEGER NOT NULL,
    "cost" TEXT NOT NULL,
    "currency" "Currency" NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "project_deployment_id" TEXT,
    "multichain_deployment_id" TEXT,
    "relay_request_id" TEXT NOT NULL,

    CONSTRAINT "TransactionCosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compiler_configs" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "compilerConfig" JSONB,
    "hash" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "version" TEXT NOT NULL,

    CONSTRAINT "compiler_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invites" (
    "id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "role" "Roles" NOT NULL,
    "signed_up" BOOLEAN NOT NULL DEFAULT false,
    "org_id" TEXT,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_codes" (
    "id" TEXT NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedByEmail" TEXT,

    CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "safe_deployment_strategy_project_id_key" ON "safe_deployment_strategy"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_name_id_key" ON "projects"("name", "id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_name_org_id_key" ON "projects"("name", "org_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_networks_projectId_chainId_key" ON "project_networks"("projectId", "chainId");

-- CreateIndex
CREATE UNIQUE INDEX "networks_name_key" ON "networks"("name");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_address_chain_id_key" ON "contracts"("address", "chain_id");

-- CreateIndex
CREATE UNIQUE INDEX "multichain_deployments_tree_root_key" ON "multichain_deployments"("tree_root");

-- CreateIndex
CREATE UNIQUE INDEX "deployment_artifacts_multichain_deployment_id_key" ON "deployment_artifacts"("multichain_deployment_id");

-- CreateIndex
CREATE UNIQUE INDEX "explorer_verifications_project_verification_id_explorer_key" ON "explorer_verifications"("project_verification_id", "explorer");

-- CreateIndex
CREATE UNIQUE INDEX "project_verifications_project_deployment_id_key" ON "project_verifications"("project_deployment_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_deployments_on_chain_id_chain_id_key" ON "project_deployments"("on_chain_id", "chain_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_deployments_multichain_deployment_id_chain_id_key" ON "project_deployments"("multichain_deployment_id", "chain_id");

-- CreateIndex
CREATE UNIQUE INDEX "tree_chain_status_multichain_deployment_id_chain_id_key" ON "tree_chain_status"("multichain_deployment_id", "chain_id");

-- CreateIndex
CREATE UNIQUE INDEX "tree_signers_multichain_deployment_id_signer_key" ON "tree_signers"("multichain_deployment_id", "signer");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_api_key_key" ON "api_keys"("api_key");

-- CreateIndex
CREATE UNIQUE INDEX "RelayTries_hash_key" ON "RelayTries"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "relay_requests_leaf_id_key" ON "relay_requests"("leaf_id");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionCosts_relay_request_id_tx_hash_key" ON "TransactionCosts"("relay_request_id", "tx_hash");

-- CreateIndex
CREATE UNIQUE INDEX "compiler_configs_hash_key" ON "compiler_configs"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "invites_email_key" ON "invites"("email");

-- CreateIndex
CREATE UNIQUE INDEX "invites_code_key" ON "invites"("code");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safe_deployment_strategy" ADD CONSTRAINT "safe_deployment_strategy_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_owners" ADD CONSTRAINT "registration_owners_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_owners" ADD CONSTRAINT "registration_owners_safeDeploymentStrategyId_fkey" FOREIGN KEY ("safeDeploymentStrategyId") REFERENCES "safe_deployment_strategy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_networks" ADD CONSTRAINT "project_networks_name_projectId_fkey" FOREIGN KEY ("name", "projectId") REFERENCES "projects"("name", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_networks" ADD CONSTRAINT "project_networks_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "networks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_project_verification_id_fkey" FOREIGN KEY ("project_verification_id") REFERENCES "project_verifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_deployment_id_chain_id_fkey" FOREIGN KEY ("deployment_id", "chain_id") REFERENCES "project_deployments"("on_chain_id", "chain_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "networks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_project_id_chain_id_fkey" FOREIGN KEY ("project_id", "chain_id") REFERENCES "project_networks"("projectId", "chainId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multichain_deployments" ADD CONSTRAINT "multichain_deployments_previous_completed_deployment_id_fkey" FOREIGN KEY ("previous_completed_deployment_id") REFERENCES "multichain_deployments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multichain_deployments" ADD CONSTRAINT "multichain_deployments_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multichain_deployments" ADD CONSTRAINT "multichain_deployments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_artifacts" ADD CONSTRAINT "deployment_artifacts_multichain_deployment_id_fkey" FOREIGN KEY ("multichain_deployment_id") REFERENCES "multichain_deployments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_artifacts" ADD CONSTRAINT "deployment_artifacts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "explorer_verifications" ADD CONSTRAINT "explorer_verifications_project_verification_id_fkey" FOREIGN KEY ("project_verification_id") REFERENCES "project_verifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_verifications" ADD CONSTRAINT "project_verifications_project_deployment_id_fkey" FOREIGN KEY ("project_deployment_id") REFERENCES "project_deployments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_deployments" ADD CONSTRAINT "project_deployments_project_id_chain_id_fkey" FOREIGN KEY ("project_id", "chain_id") REFERENCES "project_networks"("projectId", "chainId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_deployments" ADD CONSTRAINT "project_deployments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_deployments" ADD CONSTRAINT "project_deployments_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "networks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_deployments" ADD CONSTRAINT "project_deployments_multichain_deployment_id_fkey" FOREIGN KEY ("multichain_deployment_id") REFERENCES "multichain_deployments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_deployments" ADD CONSTRAINT "project_deployments_multichain_deployment_id_chain_id_fkey" FOREIGN KEY ("multichain_deployment_id", "chain_id") REFERENCES "tree_chain_status"("multichain_deployment_id", "chain_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_deployments" ADD CONSTRAINT "project_deployments_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_deployments" ADD CONSTRAINT "project_deployments_compiler_config_id_fkey" FOREIGN KEY ("compiler_config_id") REFERENCES "compiler_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_chain_status" ADD CONSTRAINT "tree_chain_status_multichain_deployment_id_fkey" FOREIGN KEY ("multichain_deployment_id") REFERENCES "multichain_deployments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_chain_status" ADD CONSTRAINT "tree_chain_status_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "networks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_signers" ADD CONSTRAINT "tree_signers_multichain_deployment_id_fkey" FOREIGN KEY ("multichain_deployment_id") REFERENCES "multichain_deployments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelayTries" ADD CONSTRAINT "RelayTries_relay_request_id_fkey" FOREIGN KEY ("relay_request_id") REFERENCES "relay_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_requests" ADD CONSTRAINT "relay_requests_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "networks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relay_requests" ADD CONSTRAINT "relay_requests_multichain_deployment_id_fkey" FOREIGN KEY ("multichain_deployment_id") REFERENCES "multichain_deployments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionCosts" ADD CONSTRAINT "TransactionCosts_relay_request_id_fkey" FOREIGN KEY ("relay_request_id") REFERENCES "relay_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionCosts" ADD CONSTRAINT "TransactionCosts_multichain_deployment_id_fkey" FOREIGN KEY ("multichain_deployment_id") REFERENCES "multichain_deployments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionCosts" ADD CONSTRAINT "TransactionCosts_project_deployment_id_fkey" FOREIGN KEY ("project_deployment_id") REFERENCES "project_deployments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compiler_configs" ADD CONSTRAINT "compiler_configs_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_code_fkey" FOREIGN KEY ("code") REFERENCES "invite_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
