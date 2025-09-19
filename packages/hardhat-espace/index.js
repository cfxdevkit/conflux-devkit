const hre = require("hardhat");
const path = require("path");
const fs = require("fs");

/**
 * eSpace Hardhat integration for Conflux eSpace (EVM) blockchain
 * Provides utilities for deployment, artifact management, and network configuration
 */
class ESpaceHardhat {
  constructor(config = {}) {
    this.config = {
      artifactsDir: config.artifactsDir || path.join(__dirname, "artifacts"),
      deploymentsDir: config.deploymentsDir || path.join(__dirname, "deployments"),
      contractsDir: config.contractsDir || path.join(__dirname, "contracts"),
      ignitionDir: config.ignitionDir || path.join(__dirname, "ignition"),
      ...config,
    };
  }

  /**
   * Deploy a contract to Conflux eSpace using viem
   */
  async deployContract(contractName, constructorArgs = [], options = {}) {
    try {
      console.log(`Deploying ${contractName} to Conflux eSpace...`);

      const Contract = await hre.viem.getContractFactory(contractName);
      const contract = await Contract.deploy(constructorArgs, options);

      const receipt = {
        contractName,
        address: contract.address,
        transactionHash: contract.transactionHash,
        blockNumber: contract.blockNumber?.toString(),
        gasUsed: contract.gasUsed?.toString(),
        network: hre.network.name,
        chainId: hre.network.config.chainId,
        deployedAt: new Date().toISOString(),
      };

      // Save deployment info
      await this.saveDeployment(contractName, receipt);

      console.log(`✅ ${contractName} deployed to: ${contract.address}`);
      return receipt;
    } catch (error) {
      console.error(`❌ Failed to deploy ${contractName}:`, error.message);
      throw error;
    }
  }

  /**
   * Deploy using Hardhat Ignition
   */
  async deployWithIgnition(moduleName, parameters = {}, options = {}) {
    try {
      console.log(`Deploying ${moduleName} using Hardhat Ignition...`);

      const module = require(path.join(this.config.ignitionDir, "modules", `${moduleName}.js`));

      const result = await hre.ignition.deploy(module, {
        parameters: {
          [moduleName]: parameters,
        },
        ...options,
      });

      console.log(`✅ ${moduleName} deployed via Ignition`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to deploy ${moduleName} via Ignition:`, error.message);
      throw error;
    }
  }

  /**
   * Get contract artifact
   */
  async getArtifact(contractName) {
    const artifactPath = path.join(
      this.config.artifactsDir,
      "contracts",
      `${contractName}.sol`,
      `${contractName}.json`
    );

    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Artifact not found for ${contractName} at ${artifactPath}`);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    return artifact;
  }

  /**
   * Save deployment information
   */
  async saveDeployment(contractName, deploymentInfo) {
    const networkName = hre.network.name;
    const deploymentDir = path.join(this.config.deploymentsDir, networkName);

    // Ensure directory exists
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentDir, `${contractName}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

    console.log(`📄 Deployment info saved to: ${deploymentFile}`);
  }

  /**
   * Load deployment information
   */
  async loadDeployment(contractName, networkName = null) {
    const network = networkName || hre.network.name;
    const deploymentFile = path.join(
      this.config.deploymentsDir,
      network,
      `${contractName}.json`
    );

    if (!fs.existsSync(deploymentFile)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  }

  /**
   * Get all deployments for a network
   */
  async getNetworkDeployments(networkName = null) {
    const network = networkName || hre.network.name;
    const deploymentDir = path.join(this.config.deploymentsDir, network);

    if (!fs.existsSync(deploymentDir)) {
      return {};
    }

    const deployments = {};
    const files = fs.readdirSync(deploymentDir);

    for (const file of files) {
      if (file.endsWith(".json")) {
        const contractName = file.replace(".json", "");
        const filePath = path.join(deploymentDir, file);
        deployments[contractName] = JSON.parse(fs.readFileSync(filePath, "utf8"));
      }
    }

    return deployments;
  }

  /**
   * Compile contracts
   */
  async compile() {
    console.log("🔨 Compiling contracts...");
    await hre.run("compile");
    console.log("✅ Contracts compiled successfully");
  }

  /**
   * Get available networks
   */
  getNetworks() {
    return Object.keys(hre.config.networks);
  }

  /**
   * Get current network info
   */
  getCurrentNetwork() {
    return {
      name: hre.network.name,
      chainId: hre.network.config.chainId,
      url: hre.network.config.url,
    };
  }

  /**
   * Get viem client for current network
   */
  async getViemClient() {
    return await hre.viem.getPublicClient();
  }

  /**
   * Get wallet client for deployments
   */
  async getWalletClient() {
    return await hre.viem.getWalletClient();
  }
}

module.exports = { ESpaceHardhat, hre };