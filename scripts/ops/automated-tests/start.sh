export $(grep -v '^#' .env | xargs)

if [[ "${POSTGRES_PRISMA_URL}" == *"main"* || "${POSTGRES_URL_NON_POOLING}" == *"main"* ]]; then
  echo "Whoa there, don't reset the production db you idiot!"
  exit 1
fi

yarn start:db &
sleep 2
yarn prisma-reset --force
anvil --silent --port 42001 --chain-id 1 --code-size-limit 300000 &
anvil --silent --port 42010 --chain-id 10 --code-size-limit 300000 &
anvil --silent --port 42161 --chain-id 42161 --code-size-limit 300000 &
anvil --silent --port 42111 --chain-id 11155111 --code-size-limit 300000 &
anvil --silent --port 42614 --chain-id 421614 --code-size-limit 300000 &
anvil --silent --port 42141 --chain-id 59141 --code-size-limit 300000 &
anvil --silent --port 42420 --chain-id 11155420 --code-size-limit 300000 &
export LOCAL_ANVIL=true
npx ts-node ./website/scripts/init.ts
