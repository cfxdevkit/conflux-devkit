const hre = require("hardhat");
const path = require("path");
const fs = require("fs");

/**
 * Core Hardhat integration for Conflux Core blockchain
 * Provides utilities for deployment, artifact management, and network configuration
 */
class CoreHardhat {
  constructor(config = {}) {
    this.config = {
      artifactsDir: config.artifactsDir || path.join(__dirname, "artifacts"),
      deploymentsDir: config.deploymentsDir || path.join(__dirname, "deployments"),
      contractsDir: config.contractsDir || path.join(__dirname, "contracts"),
      ...config,
    };
  }

  /**
   * Deploy a contract to Conflux Core
   */
  async deployContract(contractName, constructorArgs = [], options = {}) {
    try {
      console.log(`Deploying ${contractName} to Conflux Core...`);

      const Contract = await hre.ethers.getContractFactory(contractName);
      const contract = await Contract.deploy(...constructorArgs, options);

      await contract.waitForDeployment();
      const address = await contract.getAddress();
      const deployTx = contract.deploymentTransaction();

      const receipt = {
        contractName,
        address,
        transactionHash: deployTx?.hash,
        blockNumber: deployTx?.blockNumber,
        gasUsed: deployTx?.gasLimit?.toString(),
        network: hre.network.name,
        chainId: hre.network.config.chainId,
        deployedAt: new Date().toISOString(),
      };

      // Save deployment info
      await this.saveDeployment(contractName, receipt);

      console.log(`✅ ${contractName} deployed to: ${address}`);
      return receipt;
    } catch (error) {
      console.error(`❌ Failed to deploy ${contractName}:`, error.message);
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
}

module.exports = { CoreHardhat, hre };