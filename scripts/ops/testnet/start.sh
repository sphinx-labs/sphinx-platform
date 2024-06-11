export $(grep -v '^#' .env | xargs)

if [[ "${POSTGRES_PRISMA_URL}" == *"main"* || "${POSTGRES_URL_NON_POOLING}" == *"main"* ]]; then
  echo "Whoa there, don't reset the production db you idiot!"
  exit 1
fi

export SPHINX_INTERNAL__DISABLE_HARDCODED_GAS_LIMIT=true
yarn start:backend:live
yarn start:frontend:live