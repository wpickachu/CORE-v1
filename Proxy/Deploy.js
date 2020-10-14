const { ethers, Wallet, ContractFactory, Provider } = require("ethers");

const fs = require('fs');

require("dotenv").config();

const deployContract = async (contractABI, contractBytecode, wallet, provider, args = []) => {
    const factory = new ContractFactory(contractABI, contractBytecode, wallet.connect(provider))
    return await factory.deploy(...args);
}

const unpackArtifact = (artifactPath) => {
    let contractData = JSON.parse(fs.readFileSync(artifactPath))

    const contractBytecode = contractData['bytecode']
    const contractABI = contractData['abi']
    const constructorArgs = contractABI.filter((itm) => {
        return itm.type == 'constructor'
    })

    let constructorStr;
    if(constructorArgs.length < 1) {
        constructorStr = "    -- No constructor arguments -- "
    }
    else {
        constructorJSON = constructorArgs[0].inputs
        constructorStr = JSON.stringify(constructorJSON.map((c) => {
            return {
                name: c.name,
                type: c.type
            }
        }))
    }

    return {
        abi: contractABI,
        bytecode: contractBytecode,
        description:`  ${contractData.contractName}\n    ${constructorStr}`
    }
}

const logDeployTx = (contractABI, contractBytecode, args = []) => {
    const factory = new ContractFactory(contractABI, contractBytecode)
    let deployTx;

    if(args.length === 0) {
        deployTx = factory.getDeployTransaction()
    }
    else {
        deployTx = factory.getDeployTransaction(...args)
    }

    console.log(deployTx)
}

const getContractDeploymentTxFor = async (artifactPath, args) => {
    // Get the built metadata for our contracts
    let contractUnpacked = unpackArtifact(artifactPath)
    console.log(contractUnpacked.description)
    logDeployTx(contractUnpacked.abi, contractUnpacked.bytecode, args)
}

const deployToken = async (token, mnemonic = "", mainnet = false) => {
    // Get the built metadata for our contracts
    let tokenUnpacked = unpackArtifact(token)
    console.log(tokenUnpacked.description)

    let provider;
    const uniswapFactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    const uniswapRouterAddress = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d";

    if(mainnet) {
        provider = ethers.getDefaultProvider("homestead")
        wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
    }
    else {
        provider = ethers.getDefaultProvider("kovan")
        wethAddress = "0xd0a1e359811322d97991e03f863a0c30c2cf029c"
    }

    const tokenArgs = [
        uniswapRouterAddress,
        uniswapFactoryAddress
    ]

    let wallet, connectedWallet;

    if(mnemonic != "") {
        wallet = Wallet.fromMnemonic(mnemonic);
        connectedWallet = wallet.connect(provider);
    }
    else {
        deployTokenFromSigner(tokenUnpacked.abi, tokenUnpacked.bytecode, provider, tokenArgs)
    }

    // using soft mnemonic
    const token = await deployContract(tokenUnpacked.abi, tokenUnpacked.bytecode, wallet, provider, tokenArgs)
    console.log(`⌛ Deploying core token...`)
    await connectedWallet.provider.waitForTransaction(token.deployTransaction.hash)
    console.log(`✅ Deployed token to ${token.address}`)
}

// fill out data for steps as you go
let deployedProxyAdminAddress = "";
let deployedCoreVaultAddress = "";
let deployedProxy = "";
let deployedFeeApprover = "";
let coreTokenAddress = "0x13F15b86e671903e304b0e9773Ea2b15Dbfd0a5c";
let devAddr = "0xAD3e6614754f143a6e602E81086F1dB7afC81569";

// Step 1.
// Deploy proxy admin contract and get the address..
if(!deployedProxyAdminAddress) {
    deployContract("./prodartifacts/ProxyAdmin.json");
    getContractDeploymentTxFor(
        "./prodartifacts/ProxyAdmin.json"
    );
    return;
}

// Step 2.
// Deploy the CoreVault logic
if(!deployedCoreVaultAddress) {
    deployContract("./prodartifacts/CoreVault.json");
    getContractDeploymentTxFor(
        "./prodartifacts/CoreVault.json"
    )
    return;
}

// Step 3.
// Deploy the proxy for CoreVault logic
if(!deployedProxy) {
    getContractDeploymentTxFor(
        "./build/contracts/AdminUpgradeabilityProxy.json",
        [
            deployedCoreVaultAddress, /*logic*/
            deployedProxyAdminAddress, /*admin*/
            []
            // ["64c0c53b8b", coreTokenAddress, devAddr, devAddr]
            /*[1,2,3] skip initialization */
        ]
    );
    return;
}

// Step 4.
// Call initializer on the proxied CoreVault

// Step 5.
// Release FeeApprover
if(!deployedFeeApprover) {
    getContractDeploymentTxFor(
        "./prodartifacts/FeeApprover.json"
    )
    return;
}