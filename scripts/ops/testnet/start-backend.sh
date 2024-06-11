export $(grep -v '^#' .env | xargs)

if [[ "${POSTGRES_PRISMA_URL}" == *"main"* || "${POSTGRES_URL_NON_POOLING}" == *"main"* ]]; then
  echo "Whoa there, don't reset the production db you idiot!"
  exit 1
fi

export SPHINX_INTERNAL__DISABLE_HARDCODED_GAS_LIMIT=true
yarn start:db
yarn prisma-reset
export INIT_DEPLOY_SYSTEM=false
export LOCAL_S3=true
npx ts-node ./services/init/src/index.ts
export LOCAL_ANVIL=false
export LOCAL_ANVIL_DOCKER=false
node ./services/relayer/dist/index.js &
node ./services/executor/dist/index.js &
node ./services/artifact-generator/dist/index.js &
node ./services/contract-verifier/dist/index.js &