"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@sphinx-labs/core");
const utilities_1 = require("@sphinx-managed/utilities");
const ethers_1 = require("ethers");
const relayers = [
    '0x42761FAcF5e6091fcA0e38F450adfB1E22bD8c3C',
    '0xC034550B542b83BA1De312b21d1C94a9a52B1595',
    '0x808923399391944164220074Ef3Cc6ad4701526f',
];
const owner = '0x9fd58Bf0F2E6125Ffb0CBFa9AE91893Dbc1D5c51';
const initializer = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const setBalances = [owner, initializer, ...relayers];
const createBucket = (s3, bucketParams) => {
    s3.createBucket(bucketParams, function (err, data) {
        if (err) {
            console.log('Error', err);
        }
        else {
            console.log('Bucket Created Successfully', data.Location);
        }
    });
};
const createBucketIfNotExists = (s3, bucketName, bucketParams) => {
    s3.headBucket({ Bucket: bucketName }, function (err, data) {
        if (err && err.code === 'NotFound') {
            console.log('Bucket not found, creating it...');
            createBucket(s3, bucketParams);
        }
        else if (err) {
            console.log('Error', err);
        }
        else {
            console.log('Bucket exists, proceeding with operations...');
        }
    });
};
const init = async () => {
    if (process.env.INIT_DEPLOY_SYSTEM === 'true') {
        const chainIds = [1, 10, 42161, 11155111, 11155420, 421614];
        const networks = chainIds.map((id) => {
            const baseUrl = process.env.LOCAL_ANVIL_DOCKER === 'true'
                ? (0, core_1.fetchNameForNetwork)(BigInt(id))
                : '127.0.0.1';
            return `http://${baseUrl}:${42000 + (id % 1000)}`;
        });
        await Promise.all(networks.map(async (network) => {
            const provider = new core_1.SphinxJsonRpcProvider(network);
            const signer = new ethers_1.ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
            for (const address of [...setBalances]) {
                await provider.send('anvil_setBalance', [
                    address,
                    ethers_1.AbiCoder.defaultAbiCoder().encode(['uint'], [ethers_1.ethers.parseEther('10000')]),
                ]);
            }
            return (0, core_1.deploySphinxSystem)(provider, signer, relayers, core_1.ExecutionMode.Platform, true);
        }));
    }
    if (process.env.LOCAL_S3 === 'true') {
        const s3 = await (0, utilities_1.fetchAWSS3Client)();
        const deploymentConfigBucket = {
            Bucket: 'sphinx-compiler-configs',
        };
        console.log(deploymentConfigBucket);
        createBucketIfNotExists(s3, 'sphinx-compiler-configs', deploymentConfigBucket);
        const artifactBucket = {
            Bucket: 'sphinx-artifacts',
        };
        console.log(artifactBucket);
        createBucketIfNotExists(s3, 'sphinx-artifacts', artifactBucket);
    }
    const prisma = await (0, utilities_1.fetchPrismaClient)();
    const orgs = await prisma.organizations.findMany();
    if (orgs.length === 0) {
        if (!process.env.SPHINX_ORG_USERS) {
            throw new Error('no SPHINX_ORG_USERS found');
        }
        if (!process.env.SPHINX_API_KEY) {
            throw new Error('no SPHINX_ORG_USERS found');
        }
        if (!process.env.SPHINX_ORG_ID) {
            throw new Error('no SPHINX_ORG_ID found');
        }
        const users = process.env.SPHINX_ORG_USERS.split(',');
        await (0, utilities_1.seedDB)(prisma, users, process.env.SPHINX_API_KEY, process.env.SPHINX_ORG_ID);
    }
};
init();
//# sourceMappingURL=index.js.map