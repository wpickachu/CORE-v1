require("openzeppelin-test-helpers");

const { ethers, Wallet, ContractFactory } = require("ethers");
const fs = require("fs");

const unpackArtifact = (artifactPath) => {
  let contractData = JSON.parse(fs.readFileSync(artifactPath));
  const contractBytecode = contractData["bytecode"];
  const contractABI = contractData["abi"];
  const constructorArgs = contractABI.filter((itm) => {
    return itm.type == "constructor";
  });
  let constructorStr;
  if (constructorArgs.length < 1) {
    constructorStr = "    -- No constructor arguments -- ";
  } else {
    constructorJSON = constructorArgs[0].inputs;
    constructorStr = JSON.stringify(
      constructorJSON.map((c) => {
        return {
          name: c.name,
          type: c.type,
        };
      })
    );
  }
  return {
    abi: contractABI,
    bytecode: contractBytecode,
    description: `  ${contractData.contractName}\n    ${constructorStr}`,
  };
};

const logDeployTx = (contractABI, contractBytecode, args = []) => {
  const factory = new ContractFactory(contractABI, contractBytecode);
  let deployTx;
  if (args.length === 0) {
    deployTx = factory.getDeployTransaction();
  } else {
    deployTx = factory.getDeployTransaction(...args);
  }
  console.log(deployTx);
};

let mainnet = false;
let provider;
let wethAddress;
let wallet, connectedWallet;
let mnemonic =
  "trigger short carbon offer combine camera shiver roast salmon unit another damp";

const uniswapFactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const uniswapRouterAddress = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d";

if (mainnet) {
  provider = ethers.getDefaultProvider("homestead");
  wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
} else {
  provider = ethers.getDefaultProvider("kovan");
  wethAddress = "0xd0a1e359811322d97991e03f863a0c30c2cf029c";
}

wallet = Wallet.fromMnemonic(mnemonic);
connectedWallet = wallet.connect(provider);

const deployContract = async (
  contractABI,
  contractBytecode,
  wallet,
  provider,
  args = []
) => {
  const factory = new ContractFactory(
    contractABI,
    contractBytecode,
    wallet.connect(provider)
  );
  return await factory.deploy(...args);
};

const getContractDeploymentTxFor = async (artifactPath, args) => {
  // Get the built metadata for our contracts
  let contractUnpacked = unpackArtifact(artifactPath);
  console.log(contractUnpacked.description);
  const token = await deployContract(
    contractUnpacked.abi,
    contractUnpacked.bytecode,
    wallet,
    provider,
    args
  );
  console.log(`⌛ Deploying token...`);
  await connectedWallet.provider.waitForTransaction(
    token.deployTransaction.hash
  );
  console.log(`✅ Deployed token to ${token.address}`);
  //logDeployTx(contractUnpacked.abi, contractUnpacked.bytecode, args);
};

// fill out data for steps as you go
let deployedProxyAdminAddress = "0xa8c5F3D1D010Be2CcaC57e32bCCa5676EA237D39";
let deployedCoreVaultAddress = "0xAE125303E5a1f142bDF2A3048C4CDCf075d864E1";
let deployedCoreVaultProxy = "0x1aDfC567438707A80b8bCF689D6195Df260c71F7";
let deployedFeeApprover = "";
let coreTokenAddress = "0x80aCE96aB5a40F110c9477460c77004CA16669a2";
let devAddr = "0x5518876726C060b2D3fCda75c0B9f31F13b78D07";

// Step 1.
// Deploy proxy admin contract and get the address..
if (!deployedProxyAdminAddress) {
  getContractDeploymentTxFor("./prodartifacts/ProxyAdmin.json");
  return;
}

// Step 2.
// Deploy the CoreVault logic
if (!deployedCoreVaultAddress) {
  getContractDeploymentTxFor("./prodartifacts/CoreVault.json");
  return;
}

// Step 3.
// Deploy the proxy for CoreVault logic
if (!deployedCoreVaultProxy) {
  getContractDeploymentTxFor(
    "./build/contracts/AdminUpgradeabilityProxy.json",
    [
      deployedCoreVaultAddress /*logic*/,
      deployedProxyAdminAddress /*admin*/,
      [],
      // ["64c0c53b8b", coreTokenAddress, devAddr, devAddr]
      /*[1,2,3] skip initialization */
    ]
  );
  return;
}

// Step 4.
// Call initializer on the proxied CoreVault

const ERC20RupiahToken = artifacts.require("CoreVault");
await this.corevault.initialize(deployedCoreVaultAddress, dev, clean5);

// Step 5.
// Release FeeApprover
if (!deployedFeeApprover) {
  getContractDeploymentTxFor("./prodartifacts/FeeApprover.json");
  return;
}
