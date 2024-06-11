# Running Sphinx DevOps Platform
You have a few different options when running Sphinx. This guide will cover the following scenarios:
- Running Sphinx with Docker Compose against local Anvil nodes
- Running Sphinx for local development with Bash and local Anvil nodes
- Running Sphinx against live networks with Docker Compose
- Running Sphinx against live networks which Bash

> Note that this guide does not cover running Sphinx in production. For information on that see the [Running the Sphinx Platform in production](production.md) guide.

# Table of Contents

- [Dependencies](#dependencies)
- [Environment Variables](#environment-variables)
  - [Sphinx Organization](#sphinx-organization)
  - [NextAuth](#nextauth)
  - [Sendgrid](#sendgrid)
  - [Relayer Private Key](#relayer-private-key)
  - [WalletConnect](#walletconnect)
  - [Infisical](#infisical)
- [Running Sphinx Locally](#running-sphinx-locally)
  - [Running Sphinx against Anvil Nodes with Docker Compose](#running-sphinx-against-anvil-nodes-with-docker-compose)
  - [Running Sphinx for local development](#running-sphinx-for-local-development)
  - [Running Sphinx against live networks with Docker Compose](#running-sphinx-against-live-networks-with-docker-compose)
  - [Running Sphinx against live networks with Bash](#running-sphinx-against-live-networks-with-bash)


# Dependencies
You will need to install the following dependencies
- [Docker Desktop](https://docs.docker.com/desktop/)
- [Yarn Classic](https://classic.yarnpkg.com/lang/en/)

You'll also want to clone both of the Sphinx repos. You'll need both repos to be placed in the same folder for the system to work the directory structure should look like this:
├── Dev                    # Wherever you like to put your repositories
│   ├── sphinx             # [Sphinx Monorepo](https://github.com/sphinx-labs/sphinx)
│   ├── sphinx-managed     # [Sphinx DevOps Platform Repo](TODO(md))

> It would be a good improvement to combine these two repos together.

# Environment Variables
You'll need to configure some environment variables to run Sphinx. Create a new `.env` file in the root of the repo and then copy/paste the contents of `.env.example` into it. At the bottom of the file, you will see a section labeled `Fill in`. You'll want to configure most of those variables. Below, we've explained what each one is.

## Sphinx Organization
When Sphinx starts up, an organization will automatically be created for you. You must configure an email or set of emails that you would like to be added as members of this organization. You'll also need to configure the API key and organization ID you would like to use for this organization. Note that these values will be used to set your org ID and API key when the backend starts up. You do not need to retrieve them from anywhere.

You can configure either a single email:
```
SPHINX_ORG_USERS=example@sphinx.dev
```

Or you can configure a set of emails using a comma-separated list:
```
SPHINX_ORG_USERS=example@sphinx.dev,example2@sphinx.dev
```

The full configuration should look something like this:
```
SPHINX_ORG_USERS=example@sphinx.dev
SPHINX_API_KEY=my-api-key
SPHINX_ORG_ID=my-org-id
```

> If need to update any of these values after you have already started your database, you can do so by running `yarn prisma-reset`. Note that this will fully clear and re-seed the database so any data you have in it will be lost.

## NextAuth
We use [NextAuth.js](https://next-auth.js.org/) to handle user sign-in, so you will need to configure a Next AuthSecret. This is used to hash auth tokens. You can generate a good value for this using the following command:
```
openssl rand -base64 32
```

Then set this value in your `.env` file:
```
NEXTAUTH_SECRET=<your secret>
```

> You can use any long random string of characters for this value.

## Sendgrid
Sphinx uses Sendgrid as an email provider and it is required to be able to sign in including when running Sphinx locally. You'll want to sign up for [Sendgrid](https://sendgrid.com/en-us/solutions/email-api/smtp-service). You'll need to setup and email sender, SMTP server, and get a Sendgrid API key. Then you'll want to fill in these environment variables with the values:
- `EMAIL_FROM=<your Sendgrid email sender>`
- `EMAIL_SERVER=<your Sendgrid SMTP server>`
- `SENDGRID_API_KEY=<your Sendgrid API key>`

## Relayer Private Key
You'll need to configure a private key for the relayer EOA you would like to use to execute deployments. When running Sphinx locally against Anvil nodes, we recommend using a funded default account:
```
SPHINX_RELAYER__PRIVATE_KEYS=0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6
```

When running Sphinx against production networks, you must specify a real private key that is funded on the network you wish to deploy on.

## WalletConnect
We use [WalletConnect](https://walletconnect.com/) to allow users to connect their wallets to Sphinx. You will need to create a WalletConnect account and project, and then fill in the wallet connect project id environment variable:
```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=<your wallet connect project id>
```

## Infisical
We use Infisical to store secrets related to production networks such as RPC URLs and BlockExplorer API keys. To use Sphinx against production networks, you will need to set up an Infisical Cloud account, create a project and environment, create a machine identity and add it to the project. Finally you'll need to configure the various secrets. You will then need to set the following environment variables in your `.env` file:
- `INFISICAL_PROJECT_ID`
- `INFISICAL_ENVIRONMENT`
- `INFISICAL_CLIENT_ID`
- `INFISICAL_CLIENT_SECRET`

We go into more detail on how to set up Infisical in the section below on [running Sphinx against live networks](todo(md)).

# Running Sphinx locally
The easiest way to run the Sphinx Platform is with Docker Compose. We will start with spinning up Sphinx against a set of local anvil nodes using Docker Compose. Then we will cover running Sphinx with Bash (which you will want to do if you are making modifications to Sphinx). Finally, we will cover running Sphinx against production networks.

## Running Sphinx against Anvil nodes with Docker Compose
Start by making sure you have the environment variables configured as described above. Once that is done you can run Sphinx by navigating to the root of the project, and running the following command to start the microservices with Docker Compose:
```
yarn start:stack:anvil
```

We currently do not have a Docker container for the frontend. You must start it separately with this command:
```
yarn start:frontend
```

It may take a few minutes for the full system to start up. Once it does, navigate to `localhost:3000` in your browser and sign in with the account owner email you configured earlier.

Those two commands started up the following services:
- 6 anvil nodes with chain IDs that correspond to common networks (Sepolia, Arb Sepolia, Optimism Sepolia, Ethereum, Arbitrum, Optimism)
- A [Localstack](https://www.localstack.cloud/) instance that stores configuration files and deployment artifacts.
- Sphinx Executor: Handles executing deployments, but does not send any transactions.
- Sphinx Relayer: Handles executing transactions.
- Sphinx Artifact Generator: Handles generating and Storing Artifacts.
- Sphinx Website: The UI and API used to interact with Sphinx.

To propose against this Sphinx instance you'll just need to set the `SPHINX_MANAGED_BASE_URL` environment in your project to point to the frontend container:
```
SPHINX_MANAGED_BASE_URL=localhost:3000
```

You'll also need to update your `foundry.toml` file in your project (a separate Foundry project intended to use Sphinx), to use the Anvil nodes when proposing instead of live networks. Your rpc endpoint configuration option should look something like this:
```
[rpc_endpoints]
sepolia = "http://127.0.0.1:42111"
optimism_sepolia = "http://127.0.0.1:42420"
arbitrum_sepolia = "http://127.0.0.1:42161"
ethereum = "http://127.0.0.1:42001"
optimism = "http://127.0.0.1:42010"
arbitrum = "http://127.0.0.1:42161"
```

> Note that when deploying on local Anvil nodes, Sphinx will not attempt to verify contracts since there is no Block Explorer available. When you run Sphinx against live networks using the guide below, an additional Contract Verifier service will be spun up to handle that.

## Running Sphinx for local development
Using Docker Compose isn't ideal for doing local development on Sphinx. For local development, we recommend running Sphinx with bash.

### Make sure you have all dependencies installed:
```
yarn install
```

### Build the microservices to incorporate any changes you may have made:
```
yarn build:dev
```

### Start the backend services with bash:
```
yarn start:backend
```
This command will also start a Postgres database and an instance of LocalStack using Docker Compose, and will prompt you to confirm if you would like to reset the database. If this is your first time running the database, then you will want to reset it. Otherwise, you may or may not want too depending on the situation.

The Postgres database and LocalStack instances started by this are different from the ones started when running the entire Sphinx stack using Docker Compose, but they do run on the same ports. So if you still have those services running, you may run into problems running this command.

### Start the front end
```
yarn start:frontend
```

### Stop the backend microservices
```
yarn stop
```
This will not stop the Postgres DB or LocalStack instance. You will have to manually stop those services using Docker Desktop or the CLI.

### Stop the DB and LocalStack instances
```
yarn stop:db
```

## Running Sphinx against live networks with Docker Compose
Running Sphinx against live networks requires some additional configuration. You will need to:
1. Set up Infisical and configure RPC URLs and API keys for the supported Block Explorers.
2. Get a funded EOA on each network and set the `SPHINX_RELAYER__PRIVATE_KEYS` environment variable to use it.
3. Start Sphinx backend and UI

> Note that if you run Sphinx against live networks immediately after running Sphinx against anvil nodes, the same DB instance will be used for each so some data may be carried over which can cause errors in the microservices. You will want to either delete the database volume manually in Docker or run `yarn prisma-reset` to clear the database.

### Setup Infisical

#### 1. Start by creating an [Infisical Cloud account](https://infisical.com/)

#### 2. Create a new project
After you have created a project, go to the `Project Settings` tab, fetch the project ID and set `INFISICAL_PROJECT_ID` in your `.env` file.

#### 3. Create a Machine Identity
Go to the `Access Control` tab, create a new Machine Identity using Universal Auth, and create a new Client Secret for it. You'll then also need to navigate to your project and add the Machine Identity to the project. Then add the `INFISICAL_CLIENT_ID` and `INFISICAL_CLIENT_SECRET` variables to your `.env` file.

> Note that setting up the Machine Identity can be somewhat confusing because of the Infisical UI. There are *two* seperate Machine Identity sections in the UI. One is at the top level (organization level) and is where you need to create the identity and client secret. Then there is a separate Machine Identity section underneath each of your Infisical projects where you will add the Machine Identity to the project.

#### 4. Set `INFISICAL_ENVIRONMENT` variable
It can be `dev`, `staging`, or `prod` depending on your preference. This is only used to configure what set of secrets are available in Infisical. You'll have the option to choose which environment secrets are available in when creating secrets.

#### 5. Configure RPC URLs and Block Explorer API keys
For every network that you wish to use Sphinx on, you will need to configure an RPC url and one or two Block Explorer API keys. Sphinx requires specific names for these secrets. You can find these names in the `SPHINX_NETWORKS` array in the mono repo. For example, Ethereum Sepolia requires the RPC URL secret name [`ETH_SEPOLIA_URL`](https://github.com/sphinx-labs/sphinx/blob/main/packages/contracts/src/networks.ts#L105) as well as the Block Explorer API keys [`ETH_ETHERSCAN_API_KEY`](https://github.com/sphinx-labs/sphinx/blob/main/packages/contracts/src/networks.ts#L110) and [`ETH_SEPOLIA_BLOCKSCOUT_API_KEY`](https://github.com/sphinx-labs/sphinx/blob/main/packages/contracts/src/networks.ts#L115). You are *required* to configure API keys for all Block Explorers listed in the [`blockexplorers`](https://github.com/sphinx-labs/sphinx/blob/main/packages/contracts/src/networks.ts#L106) field for each network you would like to use.

Note that all Block Explorer API keys are *required* to be in a folder with the exact name `BlockExplorers`. All RPC URLs are *required* to be in a folder with the exact name `RPC`. All RPC URL and Block Explorer secrets must be configured to be available in the environment you chose in step 4.

### Get a funded EOA
You'll need to get a funded account on the networks you would like to use Sphinx on, then go to your `.env` file and set the `SPHINX_RELAYER__PRIVATE_KEYS` environment variable to equal the private key of your EOA.

### Start backend and UI
Once you've setup Infisical as well as a funded EOA, you can start Sphinx with these commands.

Start the Sphinx Microservices on live networks:
```
yarn start:stack:live
```

Start the Sphinx Website on live networks:
```
yarn start:frontend:live
```

## Running Sphinx against live networks with Bash
You are also able to run Sphinx against live networks using Bash scripts. This is useful for testing your local changes against real networks or testing logic that only runs against live networks such as the Block Explorer verification logic. This process very similar to [running Sphinx for local development](#running-sphinx-for-local-development).

Note that just like running Sphinx against live networks with Docker Compose, this requires a funded EOA and for you to configure your RPC URLs and Block Explorer API keys in Infisical.

### Starting the front end is exactly the same
```
yarn start:frontend
```

### Start the backend microservices
```
yarn start:backend:live
```

### Stop the backend microservices
```
yarn stop
```

### Stop the DB and LocalStack instances
```
yarn stop:db
```