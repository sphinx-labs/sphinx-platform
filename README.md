# Sphinx Platform
Sphinx is an open-source automated deployment platform for smart contract developers. It includes functionality including:
- One-click multichain deployments
- Artifact generation and management
- Contract verification on Blockscout and Etherscan
- Gasless deployment proposals from CI

Sphinx was previously a hosted managed service, but that service has been sunset. We provide the code here for anyone who would like to use and host it themselves. We welcome forks and contributions. All code in this repo and in the Sphinx plugin mono repo is available under the MIT.

## Getting Started
- Learn about Sphinx by reading the original user-facing docs in the [Sphinx plugin monorepo](https://github.com/sphinx-labs/sphinx)
- [Running the Sphinx platform locally](/docs/local.md)
- [Recommendations for running the Sphinx platform in production](/docs/production.md)

## Audit
The Sphinx core contracts were audited by Spearbit. [You can find the report here.](https://github.com/sphinx-labs/sphinx/blob/main/audit/spearbit.pdf)

## License

We use the Gnosis Safe contracts as a library. These contracts are licensed under [LGPL v3](https://github.com/safe-global/safe-contracts/blob/main/LICENSE). You can access them in [Gnosis Safe's repository](https://github.com/safe-global/safe-contracts).

All other code in this repository is licensed under [MIT](https://github.com/sphinx-labs/sphinx/blob/develop/LICENSE).

## Disclaimer
The code and contracts provided in this and the Sphinx plugins monorepo are provided *as is* and with no guarantees of reliability, security, or ongoing maintenance. You are responsible for your usage of Sphinx.